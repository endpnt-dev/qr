import sharp from 'sharp';
import { QROverlay, QRProcessingError } from './types';
import { fetchImage } from './fetch-image';
import { QR_V2_LIMITS, QR_V2_DEFAULTS } from '../config';

/**
 * Apply photo overlay to QR code (Phase 5)
 * Note: This changes the output dimensions to match the photo
 */
export async function applyOverlay(
  qrBuffer: Buffer,
  qrSize: number,
  overlay: QROverlay
): Promise<{ buffer: Buffer; size: number }> {
  try {
    // Fetch background photo
    const photoBuffer = await fetchImage(overlay.photo_url, {
      maxSizeMB: QR_V2_LIMITS.overlay_photo_max_mb,
      label: 'overlay_photo'
    });

    // Get photo dimensions
    const photoMetadata = await sharp(photoBuffer).metadata();
    if (!photoMetadata.width || !photoMetadata.height) {
      throw new QRProcessingError('Could not determine photo dimensions', 'OVERLAY_APPLICATION_FAILED');
    }

    const photoWidth = photoMetadata.width;
    const photoHeight = photoMetadata.height;

    // Calculate QR overlay size as percentage of photo's shorter dimension
    const qrSizePercent = overlay.qr_size ?? QR_V2_DEFAULTS.overlay_qr_size;
    const shorterDimension = Math.min(photoWidth, photoHeight);
    const qrOverlaySize = Math.round((shorterDimension * qrSizePercent) / 100);

    // Resize QR code to overlay size
    const resizedQR = await sharp(qrBuffer)
      .resize(qrOverlaySize, qrOverlaySize)
      .png()
      .toBuffer();

    // Calculate QR position from normalized coordinates
    const maxX = photoWidth - qrOverlaySize;
    const maxY = photoHeight - qrOverlaySize;
    const pixelX = Math.round(overlay.position.x * maxX);
    const pixelY = Math.round(overlay.position.y * maxY);

    // Ensure QR stays within bounds
    const clampedX = Math.max(0, Math.min(pixelX, maxX));
    const clampedY = Math.max(0, Math.min(pixelY, maxY));

    // Apply opacity to QR if needed
    let qrToComposite = resizedQR;
    const opacity = overlay.opacity ?? QR_V2_DEFAULTS.overlay_opacity;
    
    if (opacity < 1) {
      qrToComposite = await sharp(resizedQR)
        .composite([
          {
            input: Buffer.from([255, 255, 255, Math.round(255 * opacity)]),
            raw: { width: 1, height: 1, channels: 4 },
            tile: true,
            blend: 'dest-in'
          }
        ])
        .png()
        .toBuffer();
    }

    // Composite QR onto photo at calculated position
    const result = await sharp(photoBuffer)
      .composite([
        {
          input: qrToComposite,
          left: clampedX,
          top: clampedY,
        }
      ])
      .png()
      .toBuffer();

    // Return photo dimensions as the new size
    // Note: For non-square photos, we return the larger dimension as "size"
    // This is a simplification - the actual dimensions are photoWidth x photoHeight
    const outputSize = Math.max(photoWidth, photoHeight);

    return {
      buffer: result,
      size: outputSize,
    };

  } catch (error) {
    if (error instanceof QRProcessingError) {
      throw error;
    }
    
    const message = error instanceof Error ? error.message : String(error);
    throw new QRProcessingError(`Failed to apply overlay: ${message}`, 'OVERLAY_APPLICATION_FAILED');
  }
}
