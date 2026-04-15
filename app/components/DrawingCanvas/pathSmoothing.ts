import { Point } from './types'

/**
 * Ramer-Douglas-Peucker algorithm for path simplification
 * Reduces the number of points while preserving the overall shape
 */
export function rdpSimplify(points: Point[], epsilon: number): Point[] {
  if (points.length <= 2) return points

  // Find the point with maximum distance from the line segment
  let maxDistance = 0
  let maxIndex = 0
  const start = points[0]
  const end = points[points.length - 1]

  for (let i = 1; i < points.length - 1; i++) {
    const distance = perpendicularDistance(points[i], start, end)
    if (distance > maxDistance) {
      maxDistance = distance
      maxIndex = i
    }
  }

  // If max distance is greater than epsilon, recursively simplify
  if (maxDistance > epsilon) {
    const firstHalf = rdpSimplify(points.slice(0, maxIndex + 1), epsilon)
    const secondHalf = rdpSimplify(points.slice(maxIndex), epsilon)

    // Combine results, avoiding duplicate point at junction
    return [...firstHalf.slice(0, -1), ...secondHalf]
  } else {
    // If max distance is less than epsilon, return simplified line
    return [start, end]
  }
}

/**
 * Calculate perpendicular distance from point to line segment
 */
function perpendicularDistance(point: Point, lineStart: Point, lineEnd: Point): number {
  const A = lineEnd.x - lineStart.x
  const B = lineEnd.y - lineStart.y
  const C = point.x - lineStart.x
  const D = point.y - lineStart.y

  const dot = A * C + B * D
  const lenSq = A * A + B * B

  if (lenSq === 0) {
    // Line segment is a point
    return Math.sqrt((point.x - lineStart.x) ** 2 + (point.y - lineStart.y) ** 2)
  }

  const param = dot / lenSq

  let xx: number, yy: number

  if (param < 0) {
    xx = lineStart.x
    yy = lineStart.y
  } else if (param > 1) {
    xx = lineEnd.x
    yy = lineEnd.y
  } else {
    xx = lineStart.x + param * A
    yy = lineStart.y + param * B
  }

  const dx = point.x - xx
  const dy = point.y - yy
  return Math.sqrt(dx * dx + dy * dy)
}

/**
 * Convert array of points to SVG path string
 */
export function pointsToPath(points: Point[], smooth: boolean = false): string {
  if (points.length === 0) return ''
  if (points.length === 1) return `M${points[0].x} ${points[0].y}`

  let path = `M${points[0].x} ${points[0].y}`

  if (smooth && points.length > 2) {
    // Use quadratic bezier curves for smoothing
    for (let i = 1; i < points.length - 1; i++) {
      const current = points[i]
      const next = points[i + 1]
      const controlX = current.x
      const controlY = current.y
      const endX = (current.x + next.x) / 2
      const endY = (current.y + next.y) / 2

      path += ` Q${controlX} ${controlY} ${endX} ${endY}`
    }

    // Add final point
    const last = points[points.length - 1]
    path += ` T${last.x} ${last.y}`
  } else {
    // Use simple line segments
    for (let i = 1; i < points.length; i++) {
      path += ` L${points[i].x} ${points[i].y}`
    }
  }

  return path
}

/**
 * Calculate command count and character count for SVG path
 */
export function calculatePathBudget(path: string): { commands: number; characters: number } {
  // Count SVG path commands (M, L, Q, T, C, S, A, Z)
  const commandMatches = path.match(/[MLQTCSAZ]/gi) || []
  const commands = commandMatches.length

  // Count total characters (excluding whitespace for more accurate estimate)
  const characters = path.replace(/\s+/g, ' ').trim().length

  return { commands, characters }
}

/**
 * Optimize path to fit within budget constraints
 */
export function optimizePathForBudget(
  points: Point[],
  maxCommands: number = 500,
  maxCharacters: number = 10000,
  useBezier: boolean = false
): string {
  let epsilon = 1.0
  let path = ''
  let budget = { commands: Infinity, characters: Infinity }

  // Iteratively increase epsilon until we fit within budget
  while ((budget.commands > maxCommands || budget.characters > maxCharacters) && epsilon < 20) {
    const simplified = rdpSimplify(points, epsilon)
    path = pointsToPath(simplified, useBezier)
    budget = calculatePathBudget(path)
    epsilon += 0.5
  }

  return path
}