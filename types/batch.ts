export interface Batch {
  id: string
  name: string
  timestamp: Date
  status: 'uploading' | 'extracting' | 'annotating' | 'preview' | 'done'
  analysisType: string
  performance?: {
    masterPromptRuntime: number
    totalInferenceTime: number
    detectedElementsCount: number
  }
  images: {
    id: string
    name: string
    url: string
  }[]
} 