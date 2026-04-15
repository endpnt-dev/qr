// Types for the Drawing Canvas component

export interface Point {
  x: number
  y: number
}

export interface Stroke {
  id: string
  points: Point[]
  color: string
  width: number
}

export interface DrawingState {
  strokes: Stroke[]
  currentStroke: Stroke | null
  isDrawing: boolean
  canvasSize: { width: number; height: number }
}

export interface PathSmoothing {
  enabled: boolean
  rdpEpsilon: number // Ramer-Douglas-Peucker epsilon value
  useBezier: boolean
}

export interface CommandBudget {
  commands: number
  characters: number
  maxCommands: number
  maxCharacters: number
}

export interface DrawingCanvasProps {
  onPathChange: (path: string) => void
  strokeColor?: string
  strokeWidth?: number
  fill?: string
  initialPath?: string
  className?: string
}

export interface PresetShape {
  name: string
  path: string
  description?: string
}

export interface DrawingHistory {
  states: DrawingState[]
  currentIndex: number
  maxHistory: number
}