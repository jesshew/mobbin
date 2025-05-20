export const MAX_FILES_PER_BATCH = 20;
export const DEFAULT_BATCH_NAME_PREFIX = 'Batch_';
export const EXTRACTION_CONCURRENCY = 3; // Concurrency limit for OpenAI/Claude calls
export const MOONDREAM_CONCURRENCY = 5; // Limit concurrency for Moondream processing per batch
export const VALIDATION_CONCURRENCY = 10;


export enum PromptLogType {
  COMPONENT_EXTRACTION = 'component_extraction',
  ELEMENT_EXTRACTION = 'element_extraction',
  ANCHORING = 'anchoring',
  VLM_LABELING = 'vlm_labeling',
  ACCURACY_VALIDATION = 'accuracy_validation',
  METADATA_EXTRACTION = 'metadata_extraction',
}

export enum ProcessStatus {
  UPLOADING = 'uploading',
  EXTRACTING = 'extracting',
  ANNOTATING = 'annotating',
  VALIDATING = 'validating',
  SAVING = 'saving',
  DONE = 'done',
  FAILED = 'failed',
}

export const STAGE_STATUS_MAPPING = {
  setup: 'uploading',
  extraction: 'extracting',
  annotation: 'annotating',
  validation: 'validating',
  metadata: 'extracting ux metadata',
  saving: 'saving results',
  completed: 'done',
  failed: 'done'
}

export const API_ENDPOINTS = {
  BATCHES: '/api/batches',
  UPLOAD: '/api/upload',
} as const;

export const TOAST_MESSAGES = {
  UPLOAD_ERROR: 'Upload failed. Please try again.',
  LOADING_BATCHES: 'Loading batches, please wait...',
} as const; 