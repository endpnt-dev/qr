'use client'

import { useRef, useCallback, useEffect } from 'react'
import { Undo2, Redo2, Trash2, Square, Download } from 'lucide-react'
import { DrawingCanvasProps, Point } from './types'
import { useDrawing } from './useDrawing'
import { presetShapes } from './presets'
import SVGPreview from './SVGPreview'

export default function DrawingCanvas({
  onPathChange,
  strokeColor = '#2196F3',
  strokeWidth = 3,
  fill = 'none',
  initialPath = '',
  className = ''
}: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const {
    drawingState,
    commandBudget,
    canUndo,
    canRedo,
    startDrawing,
    continueDrawing,
    endDrawing,
    undo,
    redo,
    clear,
    loadPath
  } = useDrawing({
    onPathChange,
    strokeColor,
    strokeWidth,
    initialPath
  })

  // Get canvas coordinates from pointer event
  const getCanvasPoint = useCallback((e: PointerEvent, canvas: HTMLCanvasElement): Point => {
    const rect = canvas.getBoundingClientRect()
    const scaleX = 200 / rect.width  // Canvas uses 200x200 logical coordinates
    const scaleY = 200 / rect.height

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    }
  }, [])

  // Redraw canvas when state changes
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw QR code guide rectangle (dashed)
    ctx.setLineDash([4, 4])
    ctx.strokeStyle = '#9CA3AF'
    ctx.lineWidth = 1
    const guideSize = 120 // ~60% of 200 (more border space)
    const guideOffset = (200 - guideSize) / 2
    ctx.strokeRect(guideOffset, guideOffset, guideSize, guideSize)
    ctx.setLineDash([]) // Reset dash pattern

    // Draw completed strokes
    drawingState.strokes.forEach(stroke => {
      if (stroke.points.length < 2) return

      ctx.strokeStyle = stroke.color
      ctx.lineWidth = stroke.width
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'

      ctx.beginPath()
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y)

      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y)
      }

      ctx.stroke()
    })

    // Draw current stroke
    if (drawingState.currentStroke && drawingState.currentStroke.points.length > 1) {
      const stroke = drawingState.currentStroke
      ctx.strokeStyle = stroke.color
      ctx.lineWidth = stroke.width
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'

      ctx.beginPath()
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y)

      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y)
      }

      ctx.stroke()
    }
  }, [drawingState])

  // Pointer event handlers
  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    canvas.setPointerCapture(e.pointerId)
    const point = getCanvasPoint(e.nativeEvent, canvas)
    startDrawing(point)
  }, [getCanvasPoint, startDrawing])

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingState.isDrawing) return

    const canvas = canvasRef.current
    if (!canvas) return

    const point = getCanvasPoint(e.nativeEvent, canvas)
    continueDrawing(point)
  }, [drawingState.isDrawing, getCanvasPoint, continueDrawing])

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    canvas.releasePointerCapture(e.pointerId)
    endDrawing()
  }, [endDrawing])

  // Preset shape handlers
  const handlePresetClick = useCallback((path: string) => {
    loadPath(path)
  }, [loadPath])

  // Budget status
  const budgetStatus = {
    commandsPercent: Math.min((commandBudget.commands / commandBudget.maxCommands) * 100, 100),
    charactersPercent: Math.min((commandBudget.characters / commandBudget.maxCharacters) * 100, 100),
    isOverBudget: commandBudget.commands > commandBudget.maxCommands || commandBudget.characters > commandBudget.maxCharacters
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Drawing Canvas */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={200}
          height={200}
          className="w-full aspect-square border border-gray-300 rounded-lg cursor-crosshair bg-white touch-none"
          style={{ touchAction: 'none', minHeight: '400px' }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        />

        {/* Drawing instructions overlay */}
        {drawingState.strokes.length === 0 && !drawingState.currentStroke && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-black/70 text-white text-sm px-3 py-2 rounded-lg">
              Draw your border shape
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-2 items-center">
        <button
          onClick={undo}
          disabled={!canUndo}
          className="p-2 border rounded bg-background hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Undo"
        >
          <Undo2 className="w-4 h-4" />
        </button>

        <button
          onClick={redo}
          disabled={!canRedo}
          className="p-2 border rounded bg-background hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Redo"
        >
          <Redo2 className="w-4 h-4" />
        </button>

        <button
          onClick={clear}
          className="p-2 border rounded bg-background hover:bg-gray-50 text-red-600 hover:bg-red-50"
          title="Clear"
        >
          <Trash2 className="w-4 h-4" />
        </button>

        <div className="flex-1" />

        {/* Command Budget Display */}
        <div className="text-xs space-y-1">
          <div className="flex items-center gap-2">
            <span className={budgetStatus.isOverBudget ? 'text-red-600 font-medium' : 'text-gray-600'}>
              Commands: {commandBudget.commands}/{commandBudget.maxCommands}
            </span>
            <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${budgetStatus.commandsPercent > 90 ? 'bg-red-500' : budgetStatus.commandsPercent > 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
                style={{ width: `${budgetStatus.commandsPercent}%` }}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={budgetStatus.isOverBudget ? 'text-red-600 font-medium' : 'text-gray-600'}>
              Chars: {commandBudget.characters}/{commandBudget.maxCharacters}
            </span>
            <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${budgetStatus.charactersPercent > 90 ? 'bg-red-500' : budgetStatus.charactersPercent > 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
                style={{ width: `${budgetStatus.charactersPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Preset Shapes */}
      <div>
        <label className="block text-sm font-medium mb-2">Or use preset shapes:</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {presetShapes.map((shape) => (
            <button
              key={shape.name}
              onClick={() => handlePresetClick(shape.path)}
              className="p-2 text-xs border rounded hover:bg-gray-50 text-center transition-colors"
              title={shape.description}
            >
              {shape.name}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Preview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Live Preview:</label>
          <SVGPreview
            path={initialPath}
            strokeColor={strokeColor}
            strokeWidth={strokeWidth}
            fill={fill}
            className="w-full h-48"
          />
        </div>

        {/* Path info */}
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-2">SVG Path:</label>
            <div className="p-3 bg-gray-50 border rounded-lg">
              {initialPath ? (
                <code className="text-xs break-all text-gray-700">
                  {initialPath.length > 200 ? `${initialPath.substring(0, 200)}...` : initialPath}
                </code>
              ) : (
                <span className="text-xs text-gray-500">No path generated</span>
              )}
            </div>
          </div>

          {budgetStatus.isOverBudget && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700 font-medium">Budget Exceeded</p>
              <p className="text-xs text-red-600 mt-1">
                The path is too complex for the API. Try drawing a simpler shape or clearing and starting over.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}