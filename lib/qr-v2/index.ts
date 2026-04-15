/**
 * QR Code API v2 - Main Entry Point
 * Orchestrates the complete QR generation pipeline with v2 styling features
 */

import sharp from 'sharp';
import {
  QRParamsV2,
  ValidatedQRParams,
  ProcessingResult,
  QRProcessingError,
  QRValidationError
} from './types';
import { validateQRParams } from './validate';
import { renderStyledQR, validateScannability } from './render';
import { fetchRemoteImage } from './fetch-image';

// ============ LOGO EMBEDDING ============

async function embedLogo(qrSvg: string, params: ValidatedQRParams): Promise<{ buffer: Buffer; warnings: string[] }> {
  const warnings: string[] = [];

  if (!params.logo_url) {
    // No logo, convert SVG to buffer directly
    const buffer = await sharp(Buffer.from(qrSvg))
      .png()
      .toBuffer();
    return { buffer, warnings };
  }

  try {
    // Fetch logo image
    const logoBuffer = await fetchRemoteImage(params.logo_url, {
      label: 'logo',
      maxSizeBytes: 2 * 1024 * 1024 // 2MB limit for logos
    });

    // Convert SVG to PNG for compositing
    const qrPng = await sharp(Buffer.from(qrSvg))
      .png()
      .toBuffer();

    // Calculate logo size and position
    const qrSize = params.size;
    const logoSizePixels = Math.round((qrSize * params.logo_size) / 100);

    // Resize and composite logo
    const result = await sharp(qrPng)
      .composite([
        {
          input: await sharp(logoBuffer)
            .resize(logoSizePixels, logoSizePixels, { fit: 'inside', withoutEnlargement: true })
            .png()
            .toBuffer(),
          gravity: 'center'
        }
      ])
      .png()
      .toBuffer();

    return { buffer: result, warnings };

  } catch (error) {
    if (error instanceof QRProcessingError) {
      throw error;
    }

    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new QRProcessingError(
      `Logo embedding failed: ${errorMessage}`,
      'LOGO_EMBEDDING_FAILED'
    );
  }
}

// ============ BORDER APPLICATION ============

async function applyBorder(
  qrBuffer: Buffer,
  params: ValidatedQRParams
): Promise<{ buffer: Buffer; warnings: string[] }> {
  const warnings: string[] = [];

  if (!params.border) {
    return { buffer: qrBuffer, warnings };
  }

  try {
    switch (params.border.mode) {
      case 'styled':
        return await applyStyledBorder(qrBuffer, params);
      case 'image':
        return await applyImageBorder(qrBuffer, params);
      case 'svg':
        return await applySvgBorder(qrBuffer, params);
      default:
        throw new QRProcessingError('Unknown border mode', 'INVALID_BORDER_MODE');
    }
  } catch (error) {
    if (error instanceof QRProcessingError) {
      throw error;
    }

    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new QRProcessingError(
      `Border application failed: ${errorMessage}`,
      'BORDER_APPLICATION_FAILED'
    );
  }
}

async function applyStyledBorder(
  qrBuffer: Buffer,
  params: ValidatedQRParams
): Promise<{ buffer: Buffer; warnings: string[] }> {
  const warnings: string[] = [];
  const border = params.border!;

  // Border defaults
  const width = (border as any).width || 4;
  const color = (border as any).color || '#000000';
  const radius = (border as any).radius || 0;
  const padding = (border as any).padding || 16;

  // Calculate final dimensions
  const innerSize = params.size;
  const totalPadding = padding * 2;
  const borderSize = width * 2;
  const finalSize = innerSize + totalPadding + borderSize;

  // Create border background
  let borderSvg = `<svg width="${finalSize}" height="${finalSize}" viewBox="0 0 ${finalSize} ${finalSize}" xmlns="http://www.w3.org/2000/svg">`;

  // Border rectangle
  borderSvg += `<rect x="0" y="0" width="${finalSize}" height="${finalSize}" fill="${color}" rx="${radius}" ry="${radius}"/>`;

  // Inner transparent area for QR code
  const innerX = width + padding;
  const innerY = width + padding;
  borderSvg += `<rect x="${innerX}" y="${innerY}" width="${innerSize}" height="${innerSize}" fill="transparent"/>`;

  // Add label if specified
  const label = (border as any).label;
  if (label && label.text) {
    const labelFontSize = label.font_size || 14;
    const labelColor = label.font_color || color;
    const labelPosition = label.position || 'bottom';

    const textY = labelPosition === 'top'
      ? labelFontSize + 4
      : finalSize - 4;

    borderSvg += `<text x="${finalSize / 2}" y="${textY}" text-anchor="middle" fill="${labelColor}" font-family="Arial, sans-serif" font-size="${labelFontSize}">${escapeXml(label.text.substring(0, 100))}</text>`;
  }

  borderSvg += '</svg>';

  // Create border background image
  const borderBuffer = await sharp(Buffer.from(borderSvg))
    .png()
    .toBuffer();

  // Composite QR code onto border
  const result = await sharp(borderBuffer)
    .composite([
      {
        input: qrBuffer,
        left: width + padding,
        top: width + padding
      }
    ])
    .png()
    .toBuffer();

  return { buffer: result, warnings };
}

async function applyImageBorder(
  qrBuffer: Buffer,
  params: ValidatedQRParams
): Promise<{ buffer: Buffer; warnings: string[] }> {
  const warnings: string[] = [];
  const border = params.border!;

  // Fetch border image
  const borderImageBuffer = await fetchRemoteImage((border as any).image_url, {
    label: 'border image'
  });

  const width = (border as any).width || 40;
  const padding = (border as any).padding || 8;
  const opacity = (border as any).opacity || 1.0;

  // Calculate dimensions
  const qrSize = params.size;
  const borderSize = width * 2;
  const finalSize = qrSize + borderSize;

  // Resize border image to fit frame
  const resizedBorderImage = await sharp(borderImageBuffer)
    .resize(finalSize, finalSize, { fit: 'cover' })
    .png()
    .toBuffer();

  // Create a mask for the QR area (punch out center)
  const maskSvg = `<svg width="${finalSize}" height="${finalSize}" viewBox="0 0 ${finalSize} ${finalSize}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <mask id="borderMask">
        <rect width="${finalSize}" height="${finalSize}" fill="white"/>
        <rect x="${width + padding}" y="${width + padding}" width="${qrSize - padding * 2}" height="${qrSize - padding * 2}" fill="black"/>
      </mask>
    </defs>
    <rect width="${finalSize}" height="${finalSize}" fill="white" mask="url(#borderMask)"/>
  </svg>`;

  const maskBuffer = await sharp(Buffer.from(maskSvg))
    .png()
    .toBuffer();

  // Apply mask to border image
  const maskedBorder = await sharp(resizedBorderImage)
    .composite([{ input: maskBuffer, blend: 'dest-in' } as any])
    .png()
    .toBuffer();

  // Composite QR code onto masked border
  const composite: any[] = [{ input: maskedBorder, blend: 'over' }];

  if (opacity < 1.0) {
    // Apply opacity to QR code
    const opaqueQr = await sharp(qrBuffer)
      .composite([{ input: Buffer.alloc(4, Math.round(255 * opacity)), raw: { width: 1, height: 1, channels: 4 }, tile: true, blend: 'dest-in' } as any])
      .png()
      .toBuffer();
    composite.push({ input: opaqueQr, left: width, top: width });
  } else {
    composite.push({ input: qrBuffer, left: width, top: width });
  }

  const result = await sharp({ create: { width: finalSize, height: finalSize, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } } })
    .png()
    .composite(composite as any)
    .png()
    .toBuffer();

  return { buffer: result, warnings };
}

async function applySvgBorder(
  qrBuffer: Buffer,
  params: ValidatedQRParams
): Promise<{ buffer: Buffer; warnings: string[] }> {
  const warnings: string[] = [];
  const border = params.border!;

  const svgPath = (border as any).svg_path;
  const viewBox = (border as any).viewBox;
  const strokeColor = (border as any).stroke_color || '#000000';
  const strokeWidth = (border as any).stroke_width || 2;
  const fill = (border as any).fill || 'none';
  const padding = (border as any).padding || 16;

  // Determine final size based on viewBox
  const viewBoxMatch = viewBox.match(/(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/);
  if (!viewBoxMatch) {
    throw new QRProcessingError('Invalid SVG viewBox format', 'INVALID_SVG_VIEWBOX');
  }

  const [, , , vbWidth, vbHeight] = viewBoxMatch.map(Number);
  const finalSize = Math.max(vbWidth, vbHeight);

  // Create SVG border
  const borderSvg = `<svg width="${finalSize}" height="${finalSize}" viewBox="${viewBox}" xmlns="http://www.w3.org/2000/svg">
    <path d="${svgPath}" stroke="${strokeColor}" stroke-width="${strokeWidth}" fill="${fill}"/>
  </svg>`;

  // Render border to PNG
  const borderBuffer = await sharp(Buffer.from(borderSvg))
    .png()
    .toBuffer();

  // Calculate QR position (centered with padding)
  const qrSize = Math.min(finalSize - padding * 2, params.size);
  const qrX = (finalSize - qrSize) / 2;
  const qrY = (finalSize - qrSize) / 2;

  // Resize QR code if needed
  let resizedQr = qrBuffer;
  if (qrSize !== params.size) {
    resizedQr = await sharp(qrBuffer)
      .resize(qrSize, qrSize)
      .png()
      .toBuffer();
  }

  // Composite QR code onto border
  const result = await sharp(borderBuffer)
    .composite([
      {
        input: resizedQr,
        left: Math.round(qrX),
        top: Math.round(qrY)
      }
    ])
    .png()
    .toBuffer();

  return { buffer: result, warnings };
}

// ============ OVERLAY APPLICATION ============

async function applyOverlay(
  qrBuffer: Buffer,
  params: ValidatedQRParams
): Promise<{ buffer: Buffer; warnings: string[] }> {
  const warnings: string[] = [];

  if (!params.overlay) {
    return { buffer: qrBuffer, warnings };
  }

  try {
    // Fetch background photo
    const photoBuffer = await fetchRemoteImage(params.overlay.photo_url, {
      label: 'overlay photo'
    });

    // Get photo metadata
    const photoMeta = await sharp(photoBuffer).metadata();
    if (!photoMeta.width || !photoMeta.height) {
      throw new QRProcessingError('Unable to read overlay photo dimensions', 'OVERLAY_PHOTO_INVALID');
    }

    // Calculate output size (resize photo to requested size)
    const outputSize = params.size;
    const photoAspectRatio = photoMeta.width / photoMeta.height;

    let resizedPhotoWidth: number, resizedPhotoHeight: number;
    if (photoAspectRatio > 1) {
      // Landscape
      resizedPhotoWidth = outputSize;
      resizedPhotoHeight = Math.round(outputSize / photoAspectRatio);
    } else {
      // Portrait or square
      resizedPhotoHeight = outputSize;
      resizedPhotoWidth = Math.round(outputSize * photoAspectRatio);
    }

    // Resize photo
    const resizedPhoto = await sharp(photoBuffer)
      .resize(resizedPhotoWidth, resizedPhotoHeight, { fit: 'cover' })
      .png()
      .toBuffer();

    // Calculate QR size and position
    const qrSizePercent = params.overlay.qr_size || 30;
    const shorterDimension = Math.min(resizedPhotoWidth, resizedPhotoHeight);
    const qrPixelSize = Math.round((shorterDimension * qrSizePercent) / 100);

    // Position calculation
    const qrX = Math.round(params.overlay.position.x * (resizedPhotoWidth - qrPixelSize));
    const qrY = Math.round(params.overlay.position.y * (resizedPhotoHeight - qrPixelSize));

    // Resize QR code
    const resizedQr = await sharp(qrBuffer)
      .resize(qrPixelSize, qrPixelSize)
      .png()
      .toBuffer();

    // Apply opacity if needed
    let finalQr = resizedQr;
    const opacity = params.overlay.opacity || 1.0;

    if (opacity < 0.5) {
      warnings.push('Low QR code opacity may reduce scannability. Consider using opacity 0.5 or higher.');
    }

    if (opacity < 1.0) {
      finalQr = await sharp(resizedQr)
        .composite([{
          input: Buffer.from([255, 255, 255, Math.round(255 * opacity)]),
          raw: { width: 1, height: 1, channels: 4 },
          tile: true,
          blend: 'dest-in'
        }])
        .png()
        .toBuffer();
    }

    // Composite QR onto photo
    const result = await sharp(resizedPhoto)
      .composite([
        {
          input: finalQr,
          left: qrX,
          top: qrY
        }
      ])
      .png()
      .toBuffer();

    return { buffer: result, warnings };

  } catch (error) {
    if (error instanceof QRProcessingError) {
      throw error;
    }

    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new QRProcessingError(
      `Overlay application failed: ${errorMessage}`,
      'OVERLAY_APPLICATION_FAILED'
    );
  }
}

// ============ FORMAT CONVERSION ============

async function convertToFinalFormat(
  imageBuffer: Buffer,
  format: string,
  size: number
): Promise<{ buffer: Buffer; fileSizeBytes: number }> {
  let processor = sharp(imageBuffer);

  // Resize if needed
  const meta = await processor.metadata();
  if (meta.width !== size || meta.height !== size) {
    processor = processor.resize(size, size);
  }

  // Convert to requested format
  let finalBuffer: Buffer;
  switch (format) {
    case 'png':
      finalBuffer = await processor.png({ quality: 95 }).toBuffer();
      break;
    case 'jpeg':
      finalBuffer = await processor.jpeg({ quality: 90 }).toBuffer();
      break;
    case 'webp':
      finalBuffer = await processor.webp({ quality: 90 }).toBuffer();
      break;
    case 'svg':
      // SVG should have been handled earlier in the pipeline
      throw new QRProcessingError('SVG format not supported with image processing', 'SVG_FORMAT_NOT_SUPPORTED');
    default:
      throw new QRProcessingError(`Unsupported output format: ${format}`, 'UNSUPPORTED_FORMAT');
  }

  return {
    buffer: finalBuffer,
    fileSizeBytes: finalBuffer.length
  };
}

// ============ MAIN GENERATION FUNCTION ============

export async function generateQRCodeV2(params: QRParamsV2): Promise<ProcessingResult> {
  const startTime = Date.now();
  let allWarnings: string[] = [];

  try {
    // Step 1: Validate parameters
    const validatedParams = validateQRParams(params);

    // Step 2: Add scannability warnings
    const scannabilityWarnings = validateScannability(validatedParams);
    allWarnings.push(...scannabilityWarnings);

    // Step 3: Handle SVG format early (no image processing)
    if (validatedParams.format === 'svg') {
      // SVG can only be used without image borders or overlays
      if (validatedParams.border?.mode === 'image' || validatedParams.overlay) {
        throw new QRProcessingError(
          'SVG format is not supported with image borders or overlays',
          'SVG_INCOMPATIBLE_FEATURES'
        );
      }

      // Generate styled SVG
      const qrResult = await renderStyledQR(validatedParams);
      allWarnings.push(...qrResult.warnings);

      // TODO: Apply styled border to SVG if needed (not implemented in this phase)
      let finalSvg = qrResult.svg;

      return {
        imageBuffer: Buffer.from(finalSvg),
        format: 'svg',
        size: validatedParams.size,
        fileSizeBytes: Buffer.from(finalSvg).length,
        warnings: allWarnings
      };
    }

    // Step 4: Render styled QR code (as SVG)
    const qrResult = await renderStyledQR(validatedParams);
    allWarnings.push(...qrResult.warnings);

    // Step 5: Embed logo and convert to PNG
    const logoResult = await embedLogo(qrResult.svg, validatedParams);
    allWarnings.push(...logoResult.warnings);

    // Step 6: Apply border
    const borderResult = await applyBorder(logoResult.buffer, validatedParams);
    allWarnings.push(...borderResult.warnings);

    // Step 7: Apply overlay
    const overlayResult = await applyOverlay(borderResult.buffer, validatedParams);
    allWarnings.push(...overlayResult.warnings);

    // Step 8: Convert to final format
    const formatResult = await convertToFinalFormat(
      overlayResult.buffer,
      validatedParams.format,
      validatedParams.size
    );

    const processingTime = Date.now() - startTime;
    console.log(`QR v2 generation completed in ${processingTime}ms`);

    return {
      imageBuffer: formatResult.buffer,
      format: validatedParams.format,
      size: validatedParams.size,
      fileSizeBytes: formatResult.fileSizeBytes,
      warnings: allWarnings
    };

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`QR v2 generation failed after ${processingTime}ms:`, error);

    if (error instanceof QRValidationError || error instanceof QRProcessingError) {
      throw error;
    }

    // Wrap unexpected errors
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new QRProcessingError(
      `QR generation failed: ${errorMessage}`,
      'GENERATION_FAILED'
    );
  }
}

// ============ UTILITY FUNCTIONS ============

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Export types and utilities
export * from './types';
export { validateQRParams } from './validate';
export { renderStyledQR, validateScannability } from './render';
export { fetchRemoteImage } from './fetch-image';