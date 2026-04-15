import { QRParamsV2, QRResultV2, QRValidationError, QRProcessingError } from './qr-v2/types';
import { validateQRParams } from './qr-v2/validate';

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
      const borderResult = await applyBorder(currentBuffer, currentSize, validatedParams.border);
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

// Placeholder functions - will be implemented in separate modules
async function renderQRCode(params: any): Promise<Buffer> {
  throw new QRProcessingError('QR rendering not yet implemented', 'QR_RENDERING_FAILED');
}

async function applyLogo(qrBuffer: Buffer, qrSize: number, params: any): Promise<Buffer> {
  throw new QRProcessingError('Logo application not yet implemented', 'LOGO_EMBEDDING_FAILED');
}

async function applyBorder(qrBuffer: Buffer, qrSize: number, border: any): Promise<{ buffer: Buffer; size: number }> {
  throw new QRProcessingError('Border application not yet implemented', 'BORDER_APPLICATION_FAILED');
}

async function applyOverlay(qrBuffer: Buffer, qrSize: number, overlay: any): Promise<{ buffer: Buffer; size: number }> {
  throw new QRProcessingError('Overlay application not yet implemented', 'OVERLAY_APPLICATION_FAILED');
}

async function convertFormat(buffer: Buffer, format: string): Promise<Buffer> {
  // For now, assume input is PNG and just return it
  // TODO: Implement format conversion using sharp
  return buffer;
}
