import sharp from 'sharp';
import { BorderImage, QRProcessingError } from './types';
import { fetchImage } from './fetch-image';
import { QR_V2_LIMITS, QR_V2_DEFAULTS } from '../config';

/**
 * Apply image border to QR code (Phase 3)
 */
export async function applyImageBorder(
  qrBuffer: Buffer,
  qrSize: number,
  border: BorderImage
): Promise<{ buffer: Buffer; size: number }> {
  try {
    // Fetch border image
    const borderImageBuffer = await fetchImage(border.image_url, {
      maxSizeMB: QR_V2_LIMITS.border_image_max_mb,
      label: 'border_image'
    });

    const width = border.width;
    const padding = border.padding ?? QR_V2_DEFAULTS.border_padding;
    const opacity = border.opacity ?? QR_V2_DEFAULTS.border_opacity;
    
    // Calculate total canvas size
    const totalSize = qrSize + 2 * (width + padding);
    
    // Resize border image to cover the entire canvas
    let resizedBorderImage = await sharp(borderImageBuffer)
      .resize(totalSize, totalSize, { fit: 'cover' })
      .png();
    
    // Apply opacity if needed
    if (opacity < 1) {
      resizedBorderImage = resizedBorderImage.composite([
        {
          input: Buffer.from([255, 255, 255, Math.round(255 * opacity)]),
          raw: { width: 1, height: 1, channels: 4 },
          tile: true,
          blend: 'dest-in'
        }
      ]);
    }
    
    const borderBuffer = await resizedBorderImage.toBuffer();
    
    // Create a mask for the border (opaque border area, transparent center)
    const centerSize = qrSize + 2 * padding;
    const centerOffset = (totalSize - centerSize) / 2;
    
    const maskSvg = `
      <svg width="${totalSize}" height="${totalSize}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <mask id="borderMask">
            <rect width="${totalSize}" height="${totalSize}" fill="white"/>
            <rect x="${centerOffset}" y="${centerOffset}" 
                  width="${centerSize}" height="${centerSize}" fill="black"/>
          </mask>
        </defs>
        <rect width="${totalSize}" height="${totalSize}" fill="white" mask="url(#borderMask)"/>
      </svg>`;
    
    const maskBuffer = await sharp(Buffer.from(maskSvg))
      .png()
      .toBuffer();
    
    // Apply mask to border image to create frame effect
    const framedBorder = await sharp(borderBuffer)
      .composite([
        {
          input: maskBuffer,
          blend: 'dest-in'
        }
      ])
      .toBuffer();
    
    // Start with white/transparent background
    const background = await sharp({
      create: {
        width: totalSize,
        height: totalSize,
        channels: 3,
        background: { r: 255, g: 255, b: 255 }
      }
    })
      .png()
      .toBuffer();
    
    // Composite: background + border frame + QR code
    const qrOffset = width + padding;
    
    const result = await sharp(background)
      .composite([
        {
          input: framedBorder,
          left: 0,
          top: 0,
        },
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
    if (error instanceof QRProcessingError) {
      throw error;
    }
    
    const message = error instanceof Error ? error.message : String(error);
    throw new QRProcessingError(`Failed to apply image border: ${message}`, 'BORDER_APPLICATION_FAILED');
  }
}
