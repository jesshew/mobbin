# UI Analyzer Demo: Detailed Pipeline & Code Reference README

---

## 1. Project Overview

Reimagining UX Annotation with MLLMs: Transforming UI screenshots into structured UX annotations using language and vision models.

This project explores the capabilities of vision-language models with zero shot prompts for automated UI analysis, particularly in challenging scenarios where components appear visually similar. Through a chain of carefully engineered prompts, we investigate whether these models can reliably extract, localize, and describe UI elements from screenshots.

The system employs various prompt engineering techniques including:
- Few-shot prompting, Zero-shot prompting, Agentic prompting

Key findings from this research:
1. Vision-language models struggle with precise UI component analysis when elements share similar visual characteristics
2. Current models require extensive prompt engineering to achieve basic accuracy
3. Results shows promise but is far from production-ready

The project outputs structured JSON annotations and visual artifacts, serving as a foundation for further research in automated UX analysis.

---

## 2. Pipeline Overview

The UI Analyzer pipeline transforms a raw screenshot through seven orchestrated stages, each with a clear contract and responsibility. The design intentionally separates concerns: image preprocessing, high-level segmentation, fine-grained extraction, description refinement, vision localization, validation, and metadata enrichment

---

## 3. Pipeline Stages (With Code References & Logic)
### **Stage 0: Image Preprocessing**

* **Objective:** Transform raw screenshots into a standardized format that works reliably across our pipeline, while preserving the visual details that matter most for analysis.

* **Why This Matters:** 
  - Real-world screenshots come in all shapes and sizes - from mobile portrait to widescreen desktop. Need to handle this variability to ensure realiable & consistent downstream processes.

* **How:**
  - Scale images to fit within 800x800px bounds while keeping their original proportions. No squashing, no stretching.
  - Add white borders to reach the exact 800x800 size. This standardization makes it easier to process images with the Moondream vision language model since all inputs are consistently sized.
  - Simplifies rendering results in the UI by maintaining uniform dimensions while keeping the actual UI content properly proportioned.
  - Optimized for Claude's token count. The 800x800 resolution keeps costs affordable 
  - Clean up filenames to avoid any special character issues in storage or processing.

* **Implementation Details:**
  - **Core Modules:**
    - `ImageProcessor.ts`: Handles the actual image manipulation
    - `ScreenshotProcessor.ts`: Manages the workflow and integration
  - **Processing Steps:**
    1. Validate the input - make sure it's a valid image file
    2. Resize to fit our target dimensions while keeping the aspect ratio intact
    3. Add white padding to reach the exact 800x800 size
    4. Convert to optimized JPEG format
    5. Clean up the filename for safe storage
    6. Prepare for storage and downstream processing

* **Example Usage:**
  ```typescript
  // In ScreenshotProcessor.ts
  const fileBuffer = fs.readFileSync(uploadedFile.filepath);
  const originalFilename = uploadedFile.originalFilename || 'default_image.png';
  const processedImageOutput = await resizeAndPadImageBuffer(fileBuffer, originalFilename);
  // processedImageOutput.buffer ready for Stage 1 processing
  ```

---

### **Stage 1: High-Level UI Component Extraction**

* **Objective:** Identify and segment top-level UI components (e.g., navigation bar, product card).
* **Main Module:**

  * [`OpenAIService.extract_component_from_image()`](/lib/services/ai/OpenAIService.js)
  * Prompt: `EXTRACTION_PROMPT_v6` (\[/lib/prompt/ExtractionPrompts.ts])
* **Logic:**

  * Input: Image buffer (screenshot).
  * The function packages the image into a model-compatible format (typically base64 or direct buffer).
  * Sends the image and `EXTRACTION_PROMPT_v6` to the OPENAI LLM.
  * Parses LLM response into an array of objects with keys: `component_name` and `description`.
  * Returns structured array; logs full prompt/response for audit.
  * **Pre-processing:** Handles basic image checks (format, size).
  * **Error Handling:** If parsing fails, logs error and skips this input (see `ClaudeAIService._parseComponentList()`).
* **Typical Call:**

  ```typescript
  const components = await OpenAIService.extract_component_from_image(imageBuffer);
  ```

---

### **Stage 2: Fine-Grained UI Element Extraction**

* **Objective:** For each detected component, extract detailed, visually distinct UI elements.
* **Main Module:**

  * [`ClaudeAIService.extract_element_from_image()`](/lib/services/ai/ClaudeAIService.ts)
  * Prompt: `EXTRACT_ELEMENTS_PROMPT_v2` (\[/lib/prompt/ExtractElementsPrompts.ts])
* **Logic:**

  * Input: Image buffer, array of component names.
  * Loops over component names; for each, calls the model with the screenshot and the component context.
  * Model returns a flat map: `Component > Element Label` → description.
  * The response is parsed and merged into a single JSON structure.
  * Each result is tagged with its originating component for traceability.
  * **Validation:** Keys are checked for duplicates; warnings logged if non-unique.
  * **Error Handling:** If any extraction fails for a component, a placeholder or error is inserted.
* **Typical Call:**

  ```typescript
  const elements = await ClaudeAIService.extract_element_from_image(imageBuffer, components);
  ```

---

### **Stage 3: Anchor-Aware Description Refinement**

* **Objective:** Refine element descriptions to support robust, context-aware localization for vision models.
* **Main Module:**

  * [`ClaudeAIService.anchor_elements_from_image()`](/lib/services/ai/ClaudeAIService.ts)
  * Prompt: `ANCHOR_ELEMENTS_PROMPT_v3` (\[/lib/prompt/AnchorElementsPrompts.ts])
* **Logic:**

  * Input: Flat JSON of element descriptions, image buffer.
  * For each key, calls the model with the original and surrounding context, plus the relevant image region (if available).
  * Model returns an anchor-enriched description, e.g., referencing neighboring labels or position ("to the right of…").
  * Output is validated for length, clarity, and anchor presence.
  * **Error Handling:** If the response lacks anchor phrasing, original is retained and a warning logged.
* **Typical Call:**

  ```typescript
  const anchoredElements = await ClaudeAIService.anchor_elements_from_image(elementMap, imageBuffer);
  ```

---

### **Stage 4: Vision-Based Bounding Box Detection**

* **Objective:** For each anchored UI element description, use a vision-language model to localize the element's bounding box in the screenshot.
* **Main Module:**

  * [`MoondreamDetectionService.detectBoundingBoxes()`](/lib/services/ai/MoondreamDetectionService.js)
* **Logic:**

  * Input: Image buffer, anchor-enriched description per element.
  * Iterates through elements, submitting (image, description) pairs to the VLM (e.g., Moondream).
  * Receives bounding box predictions: coordinates (x_min, y_min, x_max, y_max), confidence score.
  * All bounding boxes are normalized to image dimensions.
  * **Grouping:** Results are grouped by component for downstream processing.
  * **Artifacts:**

    * Annotated images are generated (using `/lib/services/imageServices/BoundingBoxService.js`) showing all predicted boxes.
    * Detection JSON is written per run (see logs/audit).
  * **Error Handling:** Low-confidence detections are flagged; missing boxes are marked as "not found."
* **Typical Call:**

  ```javascript
  const boundingBoxes = await MoondreamDetectionService.detectBoundingBoxes(imageBuffer, anchoredDescriptions);
  ```

---

### **Stage 5: Bounding Box Accuracy Validation & Correction**

* **Objective:** Assess and improve bounding box predictions for each element.
* **Main Module:**

  * [`ClaudeAIService.validateBoundingBoxes()`](/lib/services/ai/ClaudeAIService.ts)
  * Prompt: `ACCURACY_VALIDATION_PROMPT_v0` (\[/lib/prompt/AccuracyValidationPrompts.ts])
* **Logic:**

  * Input: Original image, bounding box JSON per element.
  * For each element, sends the bounding box and label back to the LLM for assessment.
  * Receives:

    * `accuracy` (0-100)
    * `hidden` (boolean)
    * `status` (`Verified`, `Corrected`, `Failed`)
    * `suggested_coordinates` (optional)
    * `explanation` (natural language rationale)
  * If `status` is `Corrected`, replaces box with `suggested_coordinates`.
  * All corrections and rationales are logged in the output JSON.
  * **Error Handling:** Boxes failing validation are highlighted in output and annotated images.
* **Typical Call:**

  ```typescript
  const validatedBoxes = await ClaudeAIService.validateBoundingBoxes(boundingBoxes, imageBuffer);
  ```

---

### **Stage 6: Structured Metadata Enrichment**

* **Objective:** Generate rich, UX-focused metadata for each component and its elements for analysis or further automation.
* **Main Module:**

  * [`ClaudeAIService.enrichMetadata()`](/lib/services/ai/ClaudeAIService.ts)
  * Prompt: `METADATA_EXTRACTION_PROMPT_FINAL` (\[/lib/prompt/MetadataExtractionPrompts.ts])
* **Logic:**

  * Input: Hierarchical component JSON (with validated boxes and refined descriptions), original image for context.
  * For each component, calls the LLM with relevant data:

    * For components: generates `patternName`, `facetTags`, `states`, `interaction`, `userFlowImpact`, `flowPosition`.
    * For elements: similar enrichment (pattern, tags, possible states, interaction modes, UX role).
  * Responses are strictly structured (validated via a schema in `ClaudeAIService._validateMetadataFormat()`).
  * **Error Handling:** If structure fails, retries prompt or raises error for manual review.
* **Typical Call:**

  ```typescript
  const metadata = await ClaudeAIService.enrichMetadata(componentHierarchy, imageBuffer);
  ```

---

## 4. Data Transformation Flow (with Intermediate Types)

* **Input:** Raw Screenshot (`File`/`Buffer`)
* **Stage 0 Output:**
  * Processed Image (`Buffer` or `Blob`): Standardized in size, format, and padding.
  * Associated metadata (e.g., sanitized filename, storage URL if applicable).
* **Stage 1 Output:**

  * `Array<{component_name: string, description: string}>`
* **Stage 2 Output:**

  * `Record<string, string>`: Flat map `Component > Element Label` → description
* **Stage 3 Output:**

  * `Record<string, string>`: Flat map with anchor-rich descriptions
* **Stage 4 Output:**

  * `Array<{id, label, coordinates, score, status}>`, grouped by component
  * Annotated screenshot images (`PNG`)
* **Stage 5 Output:**

  * `Array<{id, label, coordinates, accuracy, status, explanation, hidden, suggested_coordinates?}>`
* **Stage 6 Output:**

  * Strictly typed hierarchical JSON:

    ```json
    {
      "Component": {
        "patternName": "...",
        "facetTags": [...],
        "states": [...],
        "interaction": "...",
        "userFlowImpact": "...",
        "flowPosition": "...",
        "Element": {
          "patternName": "...",
          "facetTags": [...],
          "states": [...],
          "interaction": "...",
          "userFlowImpact": "..."
        }
      }
    }
    ```

---

## 5. Code Structure (Modules & Class Responsibilities)

| Module                                              | Responsibility                                                                                                                                | Key Exports/Classes                                                                                                                                     |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/lib/services/imageServices/ImageProcessor.ts`     | Core image manipulation: resizing, padding, format conversion, filename sanitization.                                                       | `resizeAndPadImageBuffer()`, `deleteFile()`                                                                                                              |
| `/lib/services/imageServices/ScreenshotProcessor.ts`| Orchestrates screenshot processing: reads files, uses `ImageProcessor`, uploads to storage, records metadata in DB.                            | `ScreenshotProcessor`, `processAndSave()`                                                                                                                |
| `/lib/services/ai/ClaudeAIService.ts`               | Central LLM orchestration; prompt composition, sending, parsing, and validation for extraction, refinement, validation, and enrichment stages | `ClaudeAIService` (singleton), `extractComponents()`, `extractElements()`, `anchorElementDescriptions()`, `validateBoundingBoxes()`, `enrichMetadata()` |
| `/lib/services/ai/MoondreamDetectionService.js`     | Vision-Language detection using VLMs (bounding box prediction, confidence scoring, result normalization)                                      | `MoondreamDetectionService`, `detectBoundingBoxes()`                                                                                                    |
| `/lib/services/imageServices/BoundingBoxService.js` | Utilities for drawing, scaling, and normalizing bounding boxes; annotated image artifact creation                                             | `BoundingBoxService`, `drawBoundingBoxesOnImage()`                                                                                                      |
| `/lib/prompt/ExtractionPrompts.ts`                  | Prompt constant(s) for component extraction                                                                                                   | `EXTRACTION_PROMPT_v6`                                                                                                                                  |
| `/lib/prompt/ExtractElementsPrompts.ts`             | Prompt constant(s) for fine-grained element extraction                                                                                        | `EXTRACT_ELEMENTS_PROMPT_v2`                                                                                                                            |
| `/lib/prompt/AnchorElementsPrompts.ts`              | Prompt constant(s) for anchor-aware description refinement                                                                                    | `ANCHOR_ELEMENTS_PROMPT_v3`                                                                                                                             |
| `/lib/prompt/AccuracyValidationPrompts.ts`          | Prompt constant(s) for bounding box accuracy validation                                                                                       | `ACCURACY_VALIDATION_PROMPT_v0`                                                                                                                         |
| `/lib/prompt/MetadataExtractionPrompts.ts`          | Prompt constant(s) for structured metadata enrichment                                                                                         | `METADATA_EXTRACTION_PROMPT_FINAL`                                                                                                                      |
| `/lib/services/PromptTrackingContext.ts`            | Tracks prompt invocations and results for audit, debugging, and reproducibility                                                               | `PromptTrackingContext`                                                                                                                                 |
| `/lib/services/DatabaseService.ts`                  | Handles result persistence for runs, metadata, logs                                                                                           | `DatabaseService`                                                                                                                                       |

**Additional Utility Modules:**

* `/lib/utils/imageUtils.js` — Pre/post-processing images for VLM compatibility (Note: Referenced in README, specific tasks handled by `ImageProcessor.ts`)
* `/lib/utils/validationUtils.ts` — Validates JSON structure, deduplication, type guards

---



**End of Expanded Technical README**
