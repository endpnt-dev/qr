import sharp from 'sharp';
import { BorderStyled, QRProcessingError } from './types';
import { QR_V2_DEFAULTS } from '../config';

/**
 * Apply styled border (color, text label) to QR code
 */
export async function applyStyledBorder(
  qrBuffer: Buffer, 
  qrSize: number, 
  border: BorderStyled
): Promise<{ buffer: Buffer; size: number }> {
  try {
    const width = border.width;
    const padding = border.padding ?? QR_V2_DEFAULTS.border_padding;
    const radius = border.radius ?? QR_V2_DEFAULTS.border_radius;
    
    // Calculate total canvas size
    const totalSize = qrSize + 2 * (width + padding);
    
    // Create border background
    const borderColor = border.color;
    let borderSvg = `
      <svg width="${totalSize}" height="${totalSize}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${totalSize}" height="${totalSize}" fill="${borderColor}"`;
    
    if (radius > 0) {
      borderSvg += ` rx="${radius}" ry="${radius}"`;
    }
    
    borderSvg += ` />`;
    
    // Add label if specified
    if (border.label?.text) {
      const fontSize = border.label.font_size ?? QR_V2_DEFAULTS.border_label_font_size;
      const fontColor = border.label.font_color ?? QR_V2_DEFAULTS.border_label_font_color;
      const position = border.label.position ?? QR_V2_DEFAULTS.border_label_position;
      
      const textY = position === 'top' ? fontSize + 10 : totalSize - 10;
      const textX = totalSize / 2;
      
      borderSvg += `
        <text x="${textX}" y="${textY}" 
              text-anchor="middle" 
              font-family="Arial, sans-serif" 
              font-size="${fontSize}" 
              fill="${fontColor}">${escapeXml(border.label.text)}</text>`;
    }
    
    borderSvg += '</svg>';
    
    // Create border background
    const borderBuffer = await sharp(Buffer.from(borderSvg))
      .png()
      .toBuffer();
    
    // Calculate QR position (centered with padding)
    const qrOffset = width + padding;
    
    // Composite QR onto border
    const result = await sharp(borderBuffer)
      .composite([
        {
          input: qrBuffer,
          left: qrOffset,
          top: qrOffset,
        }
      ])
      .png()
      .toBuffer();
    
    return {
      buffer: result,
      size: totalSize,
    };
    
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new QRProcessingError(`Failed to apply styled border: ${message}`, 'BORDER_APPLICATION_FAILED');
  }
}

/**
 * Escape XML special characters for SVG text
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
