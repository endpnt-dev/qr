import { PresetShape } from './types'

// Preset SVG shapes for the drawing canvas
// All shapes use the 200x200 coordinate system to match the canvas viewBox

export const presetShapes: PresetShape[] = [
  {
    name: 'Rounded Square',
    path: 'M30 30 L170 30 Q180 30 180 40 L180 160 Q180 170 170 170 L30 170 Q20 170 20 160 L20 40 Q20 30 30 30 Z',
    description: 'A square with rounded corners'
  },
  {
    name: 'Hexagon',
    path: 'M100 20 L160 60 L160 140 L100 180 L40 140 L40 60 Z',
    description: 'A regular hexagon shape'
  },
  {
    name: 'Star',
    path: 'M100 20 L110 70 L160 70 L120 105 L135 155 L100 125 L65 155 L80 105 L40 70 L90 70 Z',
    description: 'A five-pointed star'
  },
  {
    name: 'Wave',
    path: 'M20 100 Q60 50 100 100 T180 100 L180 180 L20 180 Z',
    description: 'A smooth wave pattern'
  },
  {
    name: 'Circle',
    path: 'M100 20 A80 80 0 1 1 99.9 20 Z',
    description: 'A perfect circle'
  },
  {
    name: 'Heart',
    path: 'M100 160 C80 140, 30 100, 30 70 C30 50, 50 30, 70 30 C85 30, 100 45, 100 45 C100 45, 115 30, 130 30 C150 30, 170 50, 170 70 C170 100, 120 140, 100 160 Z',
    description: 'A heart shape'
  },
  {
    name: 'Lightning',
    path: 'M80 20 L120 20 L90 80 L130 80 L100 180 L70 110 L110 110 L80 20 Z',
    description: 'A lightning bolt'
  },
  {
    name: 'Diamond',
    path: 'M100 20 L170 100 L100 180 L30 100 Z',
    description: 'A diamond shape'
  }
]

export const getPresetByName = (name: string): PresetShape | undefined => {
  return presetShapes.find(shape => shape.name === name)
}