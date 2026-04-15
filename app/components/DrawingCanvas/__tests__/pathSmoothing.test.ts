import { rdpSimplify, pointsToPath, calculatePathBudget, optimizePathForBudget } from '../pathSmoothing'
import { Point } from '../types'

// Simple test to verify path smoothing functionality
export function testPathSmoothing() {
  console.log('Testing Path Smoothing...')

  // Test 1: RDP Simplification
  const testPoints: Point[] = [
    { x: 0, y: 0 },
    { x: 1, y: 1 },
    { x: 2, y: 0 },
    { x: 3, y: 1 },
    { x: 4, y: 0 }
  ]

  const simplified = rdpSimplify(testPoints, 0.5)
  console.log('Original points:', testPoints.length)
  console.log('Simplified points:', simplified.length)

  // Test 2: Path generation
  const path = pointsToPath(testPoints)
  console.log('Generated path:', path)

  // Test 3: Budget calculation
  const budget = calculatePathBudget(path)
  console.log('Path budget:', budget)

  // Test 4: Optimization
  const optimized = optimizePathForBudget(testPoints, 10, 50)
  console.log('Optimized path:', optimized)

  return {
    simplified: simplified.length < testPoints.length,
    hasPath: path.length > 0,
    hasBudget: budget.commands > 0,
    hasOptimized: optimized.length > 0
  }
}

// Run test if in Node.js environment
if (typeof window === 'undefined') {
  const results = testPathSmoothing()
  console.log('All tests passed:', Object.values(results).every(Boolean))
}