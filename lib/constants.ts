export const MAX_FILES_PER_BATCH = 20;
export const DEFAULT_BATCH_NAME_PREFIX = 'Batch_';
export const EXTRACTION_CONCURRENCY = 5; // Concurrency limit for OpenAI/Claude calls
export const MOONDREAM_CONCURRENCY = 10; // Limit concurrency for Moondream processing per batch
export const VALIDATION_CONCURRENCY = 5;
export const VALIDATION_THRESHOLD = 50;

export enum PromptLogType {
  COMPONENT_EXTRACTION = 'component_extraction',
  ELEMENT_EXTRACTION = 'element_extraction',
  ANCHORING = 'anchoring',
  VLM_LABELING = 'vlm_labeling',
  ACCURACY_VALIDATION = 'accuracy_validation',
}

export enum ProcessStatus {
  UPLOADING = 'uploading',
  EXTRACTING = 'extracting',
  ANNOTATING = 'annotating',
  VALIDATING = 'validating',
  DONE = 'done',
  FAILED = 'failed',
}



export const API_ENDPOINTS = {
  BATCHES: '/api/batches',
  UPLOAD: '/api/upload',
} as const;

export const TOAST_MESSAGES = {
  UPLOAD_ERROR: 'Upload failed. Please try again.',
  LOADING_BATCHES: 'Loading batches, please wait...',
} as const; 