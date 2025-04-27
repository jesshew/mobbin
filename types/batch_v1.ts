export interface Batch {
  id: string
  name: string
  timestamp: Date
  status: 'uploading' | 'extracting' | 'annotating' | 'preview' | 'done'
  stage?: 'setup' | 'extraction' | 'annotation' | 'validation' | 'metadata' | 'saving' | 'completed' | 'failed'
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