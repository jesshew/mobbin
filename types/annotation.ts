export interface Element {
  element_id: number
  label: string
  description: string
  bounding_box: {
    x_min: number
    y_min: number
    x_max: number
    y_max: number
  }
  status: string
  element_inference_time: number
  accuracy_score: number
  suggested_coordinates?: {
    x_min: number
    y_min: number
    x_max: number
    y_max: number
  } | null
  hidden: boolean
  explanation: string
  element_metadata_extraction?: string
}

export interface Component {
  screenshot_id: number
  component_id: number
  component_name: string
  annotated_image_object?: {
    type: string
    data: any[]
  }
  component_description: string
  detection_status: string
  inference_time: number
  screenshot_url: string
  annotated_image_url: string
  component_ai_description: string
  component_metadata_extraction: string
  elements: Element[]
}

export interface BoundingBox {
  id: number
  label: string // element type
  textLabel: string // display text
  description: string // additional description
  x: number
  y: number
  width: number
  height: number
  inferenceTime: number // time in seconds
  accuracy_score?: number
  patternName?: string
  facetTags?: string[]
  states?: string[]
  userFlowImpact?: string
} 