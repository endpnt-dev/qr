import sharp from 'sharp';
import { BorderSVG, QRProcessingError } from './types';
import { sanitizeSVGPath, validateViewBox } from './svg-sanitize';
import { QR_V2_DEFAULTS } from '../config';

/**
 * Apply SVG/freehand border to QR code (Phase 4)
 */
export async function applySVGBorder(
  qrBuffer: Buffer,
  qrSize: number,
  border: BorderSVG
): Promise<{ buffer: Buffer; size: number }> {
  try {
    // Sanitize SVG path
    const sanitizeResult = sanitizeSVGPath(border.svg_path);
    if (!sanitizeResult.valid) {
      throw new QRProcessingError(sanitizeResult.error || 'Invalid SVG path', 'INVALID_SVG_PATH');
    }

    // Validate viewBox
    const viewBox = border.viewBox ?? QR_V2_DEFAULTS.svg_viewBox;
    const viewBoxResult = validateViewBox(viewBox);
    if (!viewBoxResult.valid) {
      throw new QRProcessingError(viewBoxResult.error || 'Invalid viewBox', 'INVALID_SVG_VIEWBOX');
    }

    const strokeColor = border.stroke_color ?? QR_V2_DEFAULTS.svg_stroke_color;
    const strokeWidth = border.stroke_width ?? QR_V2_DEFAULTS.svg_stroke_width;
    const fill = border.fill ?? QR_V2_DEFAULTS.svg_fill;

    // Parse viewBox to determine size
    const viewBoxValues = viewBox.split(/\s+/).map(parseFloat);
    const [vbX, vbY, vbWidth, vbHeight] = viewBoxValues;
    
    // For simplicity, use the QR size as the SVG render size
    // The SVG will scale to fit within this size
    const svgSize = qrSize * 1.5; // 50% larger than QR for border effect
    
    // Create SVG border
    const svgBorder = `
      <svg width="${svgSize}" height="${svgSize}" 
           viewBox="${viewBox}" 
           xmlns="http://www.w3.org/2000/svg">
        <path d="${sanitizeResult.sanitized}" 
              stroke="${strokeColor}" 
              stroke-width="${strokeWidth}" 
              fill="${fill}" />
      </svg>`;

    // Rasterize SVG to buffer
    const borderBuffer = await sharp(Buffer.from(svgBorder))
      .resize(svgSize, svgSize)
      .png()
      .toBuffer();

    // Calculate QR position (centered)
    const qrOffset = (svgSize - qrSize) / 2;

    // Composite QR onto SVG border
    const result = await sharp(borderBuffer)
      .composite([
        {
          input: qrBuffer,
          left: Math.round(qrOffset),
          top: Math.round(qrOffset),
        }
      ])
      .png()
      .toBuffer();

    return {
      buffer: result,
      size: svgSize,
    };

  } catch (error) {
    if (error instanceof QRProcessingError) {
      throw error;
    }
    
    const message = error instanceof Error ? error.message : String(error);
    throw new QRProcessingError(`Failed to apply SVG border: ${message}`, 'BORDER_APPLICATION_FAILED');
  }
}
