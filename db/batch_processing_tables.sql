-- Table to track batch processing stages
CREATE TABLE batch_processing_queue (
  id BIGSERIAL PRIMARY KEY,
  batch_id BIGINT NOT NULL REFERENCES batch(batch_id),
  current_stage TEXT NOT NULL,
  status TEXT NOT NULL,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  
  -- Add constraint to ensure unique batch_id
  CONSTRAINT unique_batch_id UNIQUE (batch_id)
);

-- Index for fast lookups
CREATE INDEX idx_batch_processing_queue_batch_id ON batch_processing_queue(batch_id);

-- Table to store data between processing stages
CREATE TABLE batch_processing_data (
  id BIGSERIAL PRIMARY KEY,
  batch_id BIGINT NOT NULL,
  stage TEXT NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  
  -- Composite unique constraint for batch_id and stage
  CONSTRAINT unique_batch_stage UNIQUE (batch_id, stage)
);

-- Index for fast lookups
CREATE INDEX idx_batch_processing_data_batch_id ON batch_processing_data(batch_id);
CREATE INDEX idx_batch_processing_data_stage ON batch_processing_data(stage); 