import { QRParamsV2, QRResultV2, QRValidationError, QRProcessingError, ValidatedQRParams } from './qr-v2/types';
import { validateQRParams } from './qr-v2/validate';
import { renderQRCode } from './qr-v2/render-qr';
import { applyLogo } from './qr-v2/logo';
import { applyStyledBorder } from './qr-v2/border-styled';
import { applyImageBorder } from './qr-v2/border-image';
import { applySVGBorder } from './qr-v2/border-svg';
import { applyOverlay } from './qr-v2/overlay';
import sharp from 'sharp';

// Re-export types for the API route
export { QRParamsV2, QRValidationError, QRProcessingError };

/**
 * Generate a QR code with v2 styling features
 */
export async function generateQRCodeV2(params: QRParamsV2): Promise<QRResultV2> {
  try {
    // Step 1: Validate and normalize parameters
    const validatedParams = validateQRParams(params);

    // Step 2: Generate base QR code with styling
    const qrBuffer = await renderQRCode(validatedParams);
    let currentBuffer = qrBuffer;
    let currentSize = validatedParams.size;
    const warnings: string[] = [];

    // Step 3: Apply logo if specified
    if (validatedParams.logo_url) {
      currentBuffer = await applyLogo(currentBuffer, currentSize, validatedParams);
    }

    // Step 4: Apply border if specified
    if (validatedParams.border) {
      const borderResult = await handleBorderApplication(currentBuffer, currentSize, validatedParams.border);
      currentBuffer = borderResult.buffer;
      currentSize = borderResult.size;
    }

    // Step 5: Apply overlay if specified (this can change the output dimensions)
    if (validatedParams.overlay) {
      const overlayResult = await applyOverlay(currentBuffer, currentSize, validatedParams.overlay);
      currentBuffer = overlayResult.buffer;
      currentSize = overlayResult.size;
    }

    // Step 6: Convert to requested format if needed
    const finalBuffer = await convertFormat(currentBuffer, validatedParams.format);

    return {
      imageBuffer: finalBuffer,
      format: validatedParams.format,
      size: currentSize,
      fileSizeBytes: finalBuffer.length,
      warnings,
    };
  } catch (error) {
    if (error instanceof QRValidationError) {
      throw error;
    }
    if (error instanceof QRProcessingError) {
      throw error;
    }
    
    // Wrap unexpected errors
    const message = error instanceof Error ? error.message : String(error);
    throw new QRProcessingError(`QR generation failed: ${message}`, 'GENERATION_FAILED');
  }
}

/**
 * Handle border application based on border mode
 */
async function handleBorderApplication(
  qrBuffer: Buffer,
  qrSize: number,
  border: any
): Promise<{ buffer: Buffer; size: number }> {
  switch (border.mode) {
    case 'styled':
      return await applyStyledBorder(qrBuffer, qrSize, border);
    case 'image':
      return await applyImageBorder(qrBuffer, qrSize, border);
    case 'svg':
      return await applySVGBorder(qrBuffer, qrSize, border);
    default:
      throw new QRProcessingError(`Unknown border mode: ${border.mode}`, 'INVALID_BORDER_MODE');
  }
}

/**
 * Convert buffer to requested format
 */
async function convertFormat(buffer: Buffer, format: string): Promise<Buffer> {
  if (format === 'png') {
    return buffer; // Already PNG from sharp operations
  }

  try {
    const sharpInstance = sharp(buffer);

    switch (format) {
      case 'jpeg':
        return await sharpInstance.jpeg({ quality: 90 }).toBuffer();
      case 'webp':
        return await sharpInstance.webp({ quality: 90 }).toBuffer();
      case 'svg':
        // SVG format would need special handling - not implemented yet
        throw new QRProcessingError('SVG output format not yet implemented', 'INVALID_FORMAT');
      default:
        throw new QRProcessingError(`Unsupported format: ${format}`, 'INVALID_FORMAT');
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new QRProcessingError(`Format conversion failed: ${message}`, 'GENERATION_FAILED');
  }
}
