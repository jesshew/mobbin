export interface BatchResponse {
  id: string
  name: string
  timestamp: Date
  status: string
  analysisType: string
  performance: {
    masterPromptRuntime: number
    totalInferenceTime: number
    detectedElementsCount: number
  }
  images: Array<{
    id: string
    name: string
    url: string
  }>
}

export interface ProcessedImage {
  processedBlob: Blob
  filename: string
  processingTime?: number
}

export interface UploadResponse {
  success: boolean
  batchId: number
}

export interface ErrorResponse {
  error: string
} 