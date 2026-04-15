import { useState, useCallback, useRef, useEffect } from 'react'
import { Point, Stroke, DrawingState, DrawingHistory, CommandBudget } from './types'
import { optimizePathForBudget, calculatePathBudget } from './pathSmoothing'

interface UseDrawingProps {
  onPathChange: (path: string) => void
  strokeColor: string
  strokeWidth: number
  initialPath?: string
}

export function useDrawing({ onPathChange, strokeColor, strokeWidth, initialPath }: UseDrawingProps) {
  const [drawingState, setDrawingState] = useState<DrawingState>({
    strokes: [],
    currentStroke: null,
    isDrawing: false,
    canvasSize: { width: 200, height: 200 }
  })

  const [history, setHistory] = useState<DrawingHistory>({
    states: [drawingState],
    currentIndex: 0,
    maxHistory: 20
  })

  const [commandBudget, setCommandBudget] = useState<CommandBudget>({
    commands: 0,
    characters: 0,
    maxCommands: 500,
    maxCharacters: 10000
  })

  const currentStrokePoints = useRef<Point[]>([])

  // Initialize with initial path if provided
  useEffect(() => {
    if (initialPath && drawingState.strokes.length === 0) {
      // Parse initial path and create strokes (simplified implementation)
      // For now, we'll just set the path without creating drawable strokes
      const budget = calculatePathBudget(initialPath)
      setCommandBudget(prev => ({
        ...prev,
        commands: budget.commands,
        characters: budget.characters
      }))
    }
  }, [initialPath, drawingState.strokes.length])

  // Update command budget when strokes change
  useEffect(() => {
    const allPoints = drawingState.strokes.flatMap(stroke => stroke.points)

    if (allPoints.length > 0) {
      const optimizedPath = optimizePathForBudget(allPoints, 500, 10000, false)
      const budget = calculatePathBudget(optimizedPath)

      setCommandBudget(prev => ({
        ...prev,
        commands: budget.commands,
        characters: budget.characters
      }))

      onPathChange(optimizedPath)
    } else {
      // Only clear path if no initialPath (preset) exists
      // This prevents clearing preset paths when strokes are empty
      if (!initialPath) {
        setCommandBudget(prev => ({
          ...prev,
          commands: 0,
          characters: 0
        }))
        onPathChange('')
      }
    }
  }, [drawingState.strokes, onPathChange, initialPath])

  const saveToHistory = useCallback((state: DrawingState) => {
    setHistory(prev => {
      const newStates = prev.states.slice(0, prev.currentIndex + 1)
      newStates.push(state)

      // Keep only maxHistory states
      if (newStates.length > prev.maxHistory) {
        newStates.shift()
      }

      return {
        states: newStates,
        currentIndex: newStates.length - 1,
        maxHistory: prev.maxHistory
      }
    })
  }, [])

  const startDrawing = useCallback((point: Point) => {
    const newStroke: Stroke = {
      id: `stroke_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      points: [point],
      color: strokeColor,
      width: strokeWidth
    }

    currentStrokePoints.current = [point]

    setDrawingState(prev => {
      const newState = {
        ...prev,
        currentStroke: newStroke,
        isDrawing: true
      }
      return newState
    })
  }, [strokeColor, strokeWidth])

  const continueDrawing = useCallback((point: Point) => {
    if (!drawingState.isDrawing || !drawingState.currentStroke) return

    currentStrokePoints.current.push(point)

    setDrawingState(prev => {
      if (!prev.currentStroke) return prev

      return {
        ...prev,
        currentStroke: {
          ...prev.currentStroke,
          points: [...currentStrokePoints.current]
        }
      }
    })
  }, [drawingState.isDrawing, drawingState.currentStroke])

  const endDrawing = useCallback(() => {
    if (!drawingState.isDrawing || !drawingState.currentStroke) return

    setDrawingState(prev => {
      if (!prev.currentStroke) return prev

      const newState = {
        ...prev,
        strokes: [...prev.strokes, prev.currentStroke],
        currentStroke: null,
        isDrawing: false
      }

      saveToHistory(newState)
      return newState
    })

    currentStrokePoints.current = []
  }, [drawingState.isDrawing, drawingState.currentStroke, saveToHistory])

  const undo = useCallback(() => {
    if (history.currentIndex <= 0) return

    const prevState = history.states[history.currentIndex - 1]
    setDrawingState(prevState)

    setHistory(prev => ({
      ...prev,
      currentIndex: prev.currentIndex - 1
    }))
  }, [history])

  const redo = useCallback(() => {
    if (history.currentIndex >= history.states.length - 1) return

    const nextState = history.states[history.currentIndex + 1]
    setDrawingState(nextState)

    setHistory(prev => ({
      ...prev,
      currentIndex: prev.currentIndex + 1
    }))
  }, [history])

  const clear = useCallback(() => {
    const newState: DrawingState = {
      strokes: [],
      currentStroke: null,
      isDrawing: false,
      canvasSize: drawingState.canvasSize
    }

    setDrawingState(newState)
    saveToHistory(newState)
    currentStrokePoints.current = []

    // Clear any preset path as well
    onPathChange('')
  }, [drawingState.canvasSize, saveToHistory, onPathChange])

  const loadPath = useCallback((path: string) => {
    // For preset shapes, clear existing strokes and just update the path
    const newState: DrawingState = {
      strokes: [],
      currentStroke: null,
      isDrawing: false,
      canvasSize: drawingState.canvasSize
    }

    setDrawingState(newState)
    saveToHistory(newState)

    // Update budget for the loaded path
    const budget = calculatePathBudget(path)
    setCommandBudget(prev => ({
      ...prev,
      commands: budget.commands,
      characters: budget.characters
    }))

    // Call onPathChange to update parent state
    onPathChange(path)
  }, [drawingState.canvasSize, saveToHistory, onPathChange])

  return {
    drawingState,
    commandBudget,
    canUndo: history.currentIndex > 0,
    canRedo: history.currentIndex < history.states.length - 1,
    startDrawing,
    continueDrawing,
    endDrawing,
    undo,
    redo,
    clear,
    loadPath
  }
}