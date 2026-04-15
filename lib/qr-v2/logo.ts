import sharp from 'sharp';
import { ValidatedQRParams, QRProcessingError } from './types';
import { fetchImage } from './fetch-image';

/**
 * Apply logo to QR code (similar to v1 implementation)
 */
export async function applyLogo(qrBuffer: Buffer, qrSize: number, params: ValidatedQRParams): Promise<Buffer> {
  if (!params.logo_url || !params.logo_size) {
    return qrBuffer;
  }

  try {
    // Fetch logo image
    const logoBuffer = await fetchImage(params.logo_url, {
      maxSizeMB: 2, // 2MB limit for logos
      label: 'logo'
    });

    // Calculate logo size in pixels
    const logoSizePercent = params.logo_size;
    const logoSizePx = Math.round((qrSize * logoSizePercent) / 100);

    // Resize logo and make it round/square with white background
    const logoResized = await sharp(logoBuffer)
      .resize(logoSizePx, logoSizePx, { fit: 'cover' })
      .png()
      .toBuffer();

    // Composite logo onto QR code (centered)
    const offsetX = Math.round((qrSize - logoSizePx) / 2);
    const offsetY = Math.round((qrSize - logoSizePx) / 2);

    const result = await sharp(qrBuffer)
      .composite([
        {
          input: logoResized,
          left: offsetX,
          top: offsetY,
        }
      ])
      .png()
      .toBuffer();

    return result;
  } catch (error) {
    if (error instanceof QRProcessingError) {
      throw error;
    }
    
    const message = error instanceof Error ? error.message : String(error);
    throw new QRProcessingError(`Failed to apply logo: ${message}`, 'LOGO_EMBEDDING_FAILED');
  }
}
