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
} 