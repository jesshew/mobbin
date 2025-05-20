-- --------------------------------------------------------
-- 1) Drop in Dependency Order
-- --------------------------------------------------------
-- DROP TABLE IF EXISTS status_event CASCADE;
-- DROP TABLE IF EXISTS prompt_log CASCADE;
-- DROP TABLE IF EXISTS element CASCADE;
-- DROP TABLE IF EXISTS component CASCADE;
-- DROP TABLE IF EXISTS screenshot CASCADE;
-- DROP TABLE IF EXISTS batch CASCADE;
-- DROP TABLE IF EXISTS taxonomy CASCADE;

-- --------------------------------------------------------
-- 2) Taxonomy (unchanged)
-- --------------------------------------------------------
CREATE TABLE taxonomy (
  taxonomy_id             BIGSERIAL PRIMARY KEY,
  taxonomy_label_name     TEXT        NOT NULL,
  taxonomy_description    TEXT,
  taxonomy_created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --------------------------------------------------------
-- 3) Batch (added token+cost fields)
-- --------------------------------------------------------
CREATE TABLE batch (
  batch_id                       BIGSERIAL PRIMARY KEY,
  batch_name                     TEXT        NOT NULL,
  batch_created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  batch_status                   TEXT        NOT NULL
                                    CHECK (batch_status IN (
                                      'uploading','extracting','annotating',
                                      'validating','done'
                                    )),
  batch_analysis_type            TEXT        NOT NULL
                                    CHECK (batch_analysis_type IN (
                                      'Usability Audit',
                                      'Conversion Analysis',
                                      'UI Categorization'
                                    )),
  batch_master_prompt_runtime    NUMERIC,   -- seconds
  batch_total_inference_time     NUMERIC,   -- seconds
  batch_detected_elements_count  INTEGER,
  batch_input_token_count        BIGINT,    -- new: sum of all input tokens
  batch_output_token_count       BIGINT,    -- new: sum of all output tokens
  batch_total_cost               NUMERIC,   -- new: estimated $
  batch_description              TEXT
);

-- --------------------------------------------------------
-- 4) Screenshot (unchanged)
-- --------------------------------------------------------
CREATE TABLE screenshot (
  screenshot_id                BIGSERIAL PRIMARY KEY,
  batch_id                     BIGINT      NOT NULL,
  screenshot_file_name         TEXT        NOT NULL,
  screenshot_file_url          TEXT        NOT NULL,
  screenshot_processing_status TEXT        NOT NULL
                                   CHECK (screenshot_processing_status IN (
                                     'pending','processing','completed','error'
                                   )),
  screenshot_processing_time   INTERVAL,
  screenshot_created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_screenshot_batch_v4
    FOREIGN KEY (batch_id)
    REFERENCES batch(batch_id)
    ON DELETE CASCADE
);
CREATE INDEX idx_screenshot_batch_id_v4 ON screenshot(batch_id);

-- --------------------------------------------------------
-- 5) Component (new high‑level UI section)
-- --------------------------------------------------------
CREATE TABLE component (
  component_id                   BIGSERIAL PRIMARY KEY,
  screenshot_id                  BIGINT      NOT NULL,
  component_name                 TEXT        NOT NULL,
  component_description          TEXT,
  component_cta_type             TEXT
                                   CHECK (component_cta_type IN (
                                     'primary','secondary','informative'
                                   )),
  component_reusable             BOOLEAN     NOT NULL DEFAULT FALSE,
  component_x_min                NUMERIC,
  component_y_min                NUMERIC,
  component_x_max                NUMERIC,
  component_y_max                NUMERIC,
  component_extraction_model     TEXT,
  component_extraction_time      NUMERIC,
  component_extraction_input_tokens  INTEGER,
  component_extraction_output_tokens INTEGER,
  component_extraction_cost      NUMERIC,
  component_status               TEXT        NOT NULL DEFAULT 'pending'
                                   CHECK (component_status IN (
                                     'pending','extracted','error'
                                   )),
  component_created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_component_screenshot_v4
    FOREIGN KEY (screenshot_id)
    REFERENCES screenshot(screenshot_id)
    ON DELETE CASCADE
);
CREATE INDEX idx_component_screenshot_id_v4 ON component(screenshot_id);

-- --------------------------------------------------------
-- 6) element (updated to link → component_id + extra fields)
-- --------------------------------------------------------
CREATE TABLE element (
  element_id            BIGSERIAL PRIMARY KEY,
  screenshot_id                     BIGINT      NOT NULL,
  component_id                      BIGINT      NOT NULL,
  element_version_number INTEGER     NOT NULL DEFAULT 1,
  element_created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  element_x_min          NUMERIC     NOT NULL,
  element_y_min          NUMERIC     NOT NULL,
  element_x_max          NUMERIC     NOT NULL,
  element_y_max          NUMERIC     NOT NULL,
  taxonomy_id                       BIGINT,
  element_text_label     TEXT,
  element_description    TEXT,
  element_inference_time NUMERIC     NOT NULL,
  element_vlm_model      TEXT,
  element_vlm_label_status TEXT
                                   CHECK (element_vlm_label_status IN (
                                     'pending','completed','error'
                                   )) NOT NULL DEFAULT 'pending',
  element_accuracy_score NUMERIC,
  element_suggested_coordinates JSONB,
  element_updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_element_screenshot_v4
    FOREIGN KEY (screenshot_id)
    REFERENCES screenshot(screenshot_id)
    ON DELETE CASCADE,
  CONSTRAINT fk_element_component_v4
    FOREIGN KEY (component_id)
    REFERENCES component(component_id)
    ON DELETE CASCADE,
  CONSTRAINT fk_element_taxonomy_v4
    FOREIGN KEY (taxonomy_id)
    REFERENCES taxonomy(taxonomy_id)
    ON DELETE SET NULL
);
CREATE INDEX idx_element_screenshot_id_v4 ON element(screenshot_id);
CREATE INDEX idx_element_component_id_v4 ON element(component_id);
CREATE INDEX idx_element_taxonomy_id_v4 ON element(taxonomy_id);

-- preserve your version trigger
CREATE OR REPLACE FUNCTION set_annotation_version()
RETURNS TRIGGER AS $$
DECLARE
  current_max INTEGER;
BEGIN
  IF NEW.element_version_number IS NULL
     OR NEW.element_version_number = 0 THEN
    SELECT COALESCE(MAX(element_version_number),0)
      INTO current_max
      FROM element
     WHERE component_id = NEW.component_id;
    NEW.element_version_number := current_max + 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_annotation_version
BEFORE INSERT ON element
FOR EACH ROW
EXECUTE FUNCTION set_annotation_version();

-- --------------------------------------------------------
-- 7) Prompt_Log (every LLM/VLM call)
-- --------------------------------------------------------
CREATE TABLE prompt_log (
  prompt_log_id              BIGSERIAL PRIMARY KEY,
  batch_id                   BIGINT      NOT NULL,
  screenshot_id              BIGINT,
  component_id               BIGINT,
  element_id      BIGINT,
  prompt_log_type            TEXT        NOT NULL
                                   CHECK (prompt_log_type IN (
                                     'component_extraction',
                                     'element_extraction',
                                     'anchoring',
                                     'vlm_labeling',
                                     'accuracy_validation'
                                   )),
  prompt_log_model           TEXT        NOT NULL,
  prompt_log_input_tokens    INTEGER,
  prompt_log_output_tokens   INTEGER,
  prompt_log_cost            NUMERIC,
  prompt_log_duration        NUMERIC     NOT NULL,
  prompt_log_started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  prompt_log_completed_at    TIMESTAMPTZ,
  CONSTRAINT fk_prompt_log_batch_v4
    FOREIGN KEY (batch_id)
    REFERENCES batch(batch_id)
    ON DELETE CASCADE,
  CONSTRAINT fk_prompt_log_screenshot_v4
    FOREIGN KEY (screenshot_id)
    REFERENCES screenshot(screenshot_id)
    ON DELETE CASCADE,
  CONSTRAINT fk_prompt_log_component_v4
    FOREIGN KEY (component_id)
    REFERENCES component(component_id)
    ON DELETE CASCADE,
  CONSTRAINT fk_prompt_log_element_v4
    FOREIGN KEY (element_id)
    REFERENCES element(element_id)
    ON DELETE CASCADE
);
CREATE INDEX idx_prompt_log_batch_id_v4       ON prompt_log(batch_id);
CREATE INDEX idx_prompt_log_screenshot_id_v4  ON prompt_log(screenshot_id);
CREATE INDEX idx_prompt_log_component_id_v4   ON prompt_log(component_id);
CREATE INDEX idx_prompt_log_element_id_v4     ON prompt_log(element_id);

-- --------------------------------------------------------
-- 8) Status_Event (for real‑time updates)
-- --------------------------------------------------------
CREATE TABLE status_event (
  status_event_id           BIGSERIAL PRIMARY KEY,
  batch_id                  BIGINT      NOT NULL,
  screenshot_id             BIGINT,
  component_id              BIGINT,
  element_id     BIGINT,
  status_event_type         TEXT        NOT NULL,
  status_event_payload      JSONB,
  status_event_created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_status_event_batch_v4
    FOREIGN KEY (batch_id)
    REFERENCES batch(batch_id)
    ON DELETE CASCADE,
  CONSTRAINT fk_status_event_screenshot_v4
    FOREIGN KEY (screenshot_id)
    REFERENCES screenshot(screenshot_id)
    ON DELETE CASCADE,
  CONSTRAINT fk_status_event_component_v4
    FOREIGN KEY (component_id)
    REFERENCES component(component_id)
    ON DELETE CASCADE,
  CONSTRAINT fk_status_event_element_v4
    FOREIGN KEY (element_id)
    REFERENCES element(element_id)
    ON DELETE CASCADE
);
CREATE INDEX idx_status_event_batch_id_v4       ON status_event(batch_id);
CREATE INDEX idx_status_event_screenshot_id_v4  ON status_event(screenshot_id);
CREATE INDEX idx_status_event_component_id_v4   ON status_event(component_id);
CREATE INDEX idx_status_event_element_id_v4     ON status_event(element_id);
