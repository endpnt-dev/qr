/**
 * QR Code Demo API v2 Route Handler
 * Demo endpoint for landing page - no auth required, watermarked output
 */

import { NextRequest, NextResponse } from 'next/server';
import { successResponse, errorResponse, generateRequestId, getErrorMessage } from '@/lib/response';
import { ERROR_CODES } from '@/lib/config';
import { checkDemoRateLimit } from '@/lib/rate-limit';
import { generateQRCodeV2, QRParamsV2, QRValidationError, QRProcessingError } from '@/lib/qr-v2';
import sharp from 'sharp';

function checkOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');

  // Allow localhost for development
  const allowedOrigins = [
    'https://qr.endpnt.dev',
    'http://localhost:3000',
    'http://127.0.0.1:3000'
  ];

  // Check origin header
  if (origin && allowedOrigins.includes(origin)) {
    return true;
  }

  // Check referer as fallback
  if (referer) {
    for (const allowed of allowedOrigins) {
      if (referer.startsWith(allowed)) {
        return true;
      }
    }
  }

  return false;
}

function getClientIP(request: NextRequest): string {
  // Try various headers for IP address
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  // Fallback to connection IP (may not be available in all environments)
  return request.ip || 'unknown';
}

async function addWatermark(imageBuffer: Buffer, format: string): Promise<Buffer> {
  try {
    const image = sharp(imageBuffer);
    const { width, height } = await image.metadata();

    if (!width || !height) {
      return imageBuffer; // Return original if we can't get dimensions
    }

    // Create watermark text
    const watermarkText = 'DEMO - endpnt.dev';
    const fontSize = Math.max(12, Math.floor(Math.min(width, height) * 0.03));
    const padding = Math.floor(fontSize * 0.5);

    // Create SVG text watermark
    const textSvg = `
      <svg width="${width}" height="${height}">
        <text
          x="${width - padding}"
          y="${height - padding}"
          font-family="Arial, sans-serif"
          font-size="${fontSize}"
          fill="rgba(128, 128, 128, 0.7)"
          text-anchor="end"
          dominant-baseline="baseline"
        >
          ${watermarkText}
        </text>
      </svg>
    `;

    // Composite the watermark onto the image
    const watermarkedImage = await image
      .composite([{
        input: Buffer.from(textSvg),
        gravity: 'southeast'
      }])
      .toFormat(format === 'jpeg' ? 'jpeg' : format === 'webp' ? 'webp' : 'png')
      .toBuffer();

    return watermarkedImage;
  } catch (error) {
    console.error('Failed to add watermark:', error);
    return imageBuffer; // Return original on error
  }
}

// Helper to parse request body (same as main API)
async function parseRequestBody(request: NextRequest): Promise<QRParamsV2> {
  const method = request.method;

  if (method === 'GET') {
    // Parse from URL parameters
    const url = new URL(request.url);
    const params: any = {};

    // Basic parameters
    params.data = url.searchParams.get('data') || undefined;
    if (url.searchParams.get('size')) params.size = parseInt(url.searchParams.get('size')!);
    if (url.searchParams.get('format')) params.format = url.searchParams.get('format');
    if (url.searchParams.get('color')) params.color = url.searchParams.get('color');
    if (url.searchParams.get('background')) params.background = url.searchParams.get('background');
    if (url.searchParams.get('margin')) params.margin = parseInt(url.searchParams.get('margin')!);
    if (url.searchParams.get('error_correction')) params.error_correction = url.searchParams.get('error_correction');
    if (url.searchParams.get('logo_url')) params.logo_url = url.searchParams.get('logo_url');
    if (url.searchParams.get('logo_size')) params.logo_size = parseInt(url.searchParams.get('logo_size')!);

    // V2 style parameters
    if (url.searchParams.get('dot_style')) params.dot_style = url.searchParams.get('dot_style');
    if (url.searchParams.get('eye_shape')) params.eye_shape = url.searchParams.get('eye_shape');
    if (url.searchParams.get('eye_inner_shape')) params.eye_inner_shape = url.searchParams.get('eye_inner_shape');
    if (url.searchParams.get('eye_color')) params.eye_color = url.searchParams.get('eye_color');
    if (url.searchParams.get('eye_inner_color')) params.eye_inner_color = url.searchParams.get('eye_inner_color');

    // Gradient (as JSON string)
    if (url.searchParams.get('gradient')) {
      try {
        params.gradient = JSON.parse(url.searchParams.get('gradient')!);
      } catch {
        params.gradient = url.searchParams.get('gradient');
      }
    }

    // Border (as JSON string)
    if (url.searchParams.get('border')) {
      try {
        params.border = JSON.parse(url.searchParams.get('border')!);
      } catch {
        params.border = url.searchParams.get('border');
      }
    }

    // Overlay (as JSON string)
    if (url.searchParams.get('overlay')) {
      try {
        params.overlay = JSON.parse(url.searchParams.get('overlay')!);
      } catch {
        params.overlay = url.searchParams.get('overlay');
      }
    }

    return params;
  } else if (method === 'POST') {
    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return await request.json();
    } else {
      throw new QRProcessingError('POST requests must use Content-Type: application/json', 'INVALID_CONTENT_TYPE');
    }
  } else {
    throw new QRProcessingError(`Method ${method} not allowed`, 'METHOD_NOT_ALLOWED');
  }
}

// Main demo request handler
async function handleDemoQRRequest(request: NextRequest): Promise<NextResponse> {
  const requestId = Math.random().toString(36).substring(2, 15);
  const startTime = Date.now();

  try {
    // Check origin/referer
    if (!checkOrigin(request)) {
      console.log(`[${requestId}] Origin not allowed`);
      return errorResponse(
        'ORIGIN_NOT_ALLOWED' as any,
        'Demo endpoint only accessible from qr.endpnt.dev',
        403,
        { request_id: requestId }
      );
    }

    // Check rate limiting
    const clientIP = getClientIP(request);
    const rateLimitResult = await checkDemoRateLimit(clientIP);

    if (!rateLimitResult.allowed) {
      console.log(`[${requestId}] Rate limited IP: ${clientIP}`);
      return errorResponse(
        ERROR_CODES.RATE_LIMIT_EXCEEDED,
        'Demo rate limit exceeded (5 requests per minute)',
        429,
        {
          request_id: requestId,
          processing_ms: Date.now() - startTime
        }
      );
    }

    // Parse request parameters
    const params = await parseRequestBody(request);

    console.log(`[${requestId}] Demo QR generation:`, {
      data_length: params.data?.length,
      size: params.size,
      format: params.format,
      dot_style: params.dot_style,
      has_gradient: !!params.gradient,
      has_border: !!params.border,
      has_overlay: !!params.overlay,
      client_ip: clientIP
    });

    // Generate QR code (all features available in demo)
    const result = await generateQRCodeV2(params);

    // Add watermark to the generated image
    const watermarkedBuffer = await addWatermark(result.imageBuffer, result.format);

    // Convert to base64
    const base64Image = watermarkedBuffer.toString('base64');

    const response = successResponse(
      {
        image: base64Image,
        format: result.format,
        size: result.size,
        file_size_bytes: watermarkedBuffer.length,
        warnings: [...result.warnings, 'Demo watermark applied - upgrade for clean output'],
        demo: true
      },
      {
        request_id: requestId,
        processing_ms: Date.now() - startTime,
        remaining_credits: rateLimitResult.remaining
      }
    );

    console.log(`[${requestId}] Demo success: ${result.format} ${result.size}x${result.size} (${Math.round(watermarkedBuffer.length / 1024)}KB) in ${Date.now() - startTime}ms`);
    return response;

  } catch (error) {
    const processingMs = Date.now() - startTime;
    console.error(`[${requestId}] Demo error after ${processingMs}ms:`, error);

    if (error instanceof QRValidationError) {
      const errorMessage = `${error.errors.map(e => `${e.field}: ${e.message}`).join(', ')}`;
      return errorResponse(
        ERROR_CODES.INVALID_PARAMS,
        errorMessage,
        400,
        { request_id: requestId, processing_ms: processingMs }
      );
    }

    if (error instanceof QRProcessingError) {
      const statusCode = getStatusCodeForError(error.code);
      return errorResponse(
        error.code as any,
        error.message,
        statusCode,
        { request_id: requestId, processing_ms: processingMs }
      );
    }

    const errorMessage = error instanceof Error ? error.message : String(error);
    return errorResponse(
      ERROR_CODES.INTERNAL_ERROR,
      errorMessage,
      500,
      { request_id: requestId, processing_ms: processingMs }
    );
  }
}

function getStatusCodeForError(code: string): number {
  const statusMap: Record<string, number> = {
    'INVALID_DATA': 400,
    'DATA_TOO_LONG': 400,
    'INVALID_SIZE': 400,
    'INVALID_FORMAT': 400,
    'INVALID_COLOR': 400,
    'INVALID_BACKGROUND': 400,
    'INVALID_MARGIN': 400,
    'INVALID_ERROR_CORRECTION': 400,
    'INVALID_LOGO_URL': 400,
    'INVALID_LOGO_SIZE': 400,
    'INVALID_DOT_STYLE': 400,
    'INVALID_EYE_SHAPE': 400,
    'INVALID_EYE_INNER_SHAPE': 400,
    'INVALID_EYE_COLOR': 400,
    'INVALID_EYE_INNER_COLOR': 400,
    'INVALID_GRADIENT_TYPE': 400,
    'INVALID_GRADIENT_ROTATION': 400,
    'INVALID_GRADIENT_COLORS': 400,
    'INVALID_GRADIENT_COLORS_COUNT': 400,
    'INVALID_GRADIENT_OFFSET': 400,
    'INVALID_GRADIENT_COLOR': 400,
    'INVALID_BORDER_MODE': 400,
    'INVALID_BORDER_WIDTH': 400,
    'INVALID_BORDER_COLOR': 400,
    'INVALID_BORDER_RADIUS': 400,
    'INVALID_BORDER_PADDING': 400,
    'INVALID_BORDER_LABEL_TEXT': 400,
    'BORDER_LABEL_TEXT_TOO_LONG': 400,
    'INVALID_BORDER_LABEL_POSITION': 400,
    'INVALID_BORDER_LABEL_FONT_SIZE': 400,
    'INVALID_BORDER_LABEL_FONT_COLOR': 400,
    'INVALID_BORDER_IMAGE_URL': 400,
    'INVALID_BORDER_OPACITY': 400,
    'INVALID_SVG_PATH': 400,
    'SVG_PATH_TOO_COMPLEX': 400,
    'INVALID_SVG_VIEWBOX': 400,
    'INVALID_SVG_STROKE_COLOR': 400,
    'INVALID_SVG_STROKE_WIDTH': 400,
    'INVALID_SVG_FILL': 400,
    'INVALID_OVERLAY_PHOTO_URL': 400,
    'INVALID_OVERLAY_POSITION': 400,
    'INVALID_OVERLAY_POSITION_X': 400,
    'INVALID_OVERLAY_POSITION_Y': 400,
    'INVALID_OVERLAY_QR_SIZE': 400,
    'INVALID_OVERLAY_OPACITY': 400,
    'SVG_INCOMPATIBLE_FEATURES': 400,
    'SVG_OVERLAY_NOT_SUPPORTED': 400,
    'SVG_IMAGE_BORDER_NOT_SUPPORTED': 400,
    'METHOD_NOT_ALLOWED': 405,
    'INVALID_CONTENT_TYPE': 415,
    'LOGO_NOT_FOUND': 404,
    'BORDER_IMAGE_NOT_FOUND': 404,
    'OVERLAY_PHOTO_NOT_FOUND': 404,
    'IMAGE_TOO_LARGE': 422,
    'BLOCKED_IMAGE_URL': 422,
    'INVALID_IMAGE_URL': 422,
    'INVALID_IMAGE_TYPE': 422,
    'INVALID_IMAGE_CONTENT': 422,
    'QR_GENERATION_FAILED': 500,
    'QR_RENDERING_FAILED': 500,
    'LOGO_EMBEDDING_FAILED': 500,
    'BORDER_APPLICATION_FAILED': 500,
    'OVERLAY_APPLICATION_FAILED': 500,
    'IMAGE_PROCESSING_FAILED': 500,
    'GENERATION_FAILED': 500,
    'LOGO_FETCH_FAILED': 502,
    'LOGO_TIMEOUT': 502,
    'LOGO_NETWORK_ERROR': 502,
    'LOGO_SERVER_ERROR': 502,
    'BORDER_IMAGE_FETCH_FAILED': 502,
    'BORDER_IMAGE_TIMEOUT': 502,
    'BORDER_IMAGE_NETWORK_ERROR': 502,
    'BORDER_IMAGE_SERVER_ERROR': 502,
    'OVERLAY_PHOTO_FETCH_FAILED': 502,
    'OVERLAY_PHOTO_TIMEOUT': 502,
    'OVERLAY_PHOTO_NETWORK_ERROR': 502,
    'OVERLAY_PHOTO_SERVER_ERROR': 502,
  };

  return statusMap[code] || 500;
}

// Export route handlers
export async function GET(request: NextRequest) {
  return handleDemoQRRequest(request);
}

export async function POST(request: NextRequest) {
  return handleDemoQRRequest(request);
}