/**
 * QR Code API v2 Route Handler
 * Handles QR code generation requests with premium styling features
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { successResponse, errorResponse, generateRequestId, getErrorMessage } from '@/lib/response';
import { ERROR_CODES } from '@/lib/config';
import { generateQRCodeV2, QRParamsV2, QRValidationError, QRProcessingError } from '@/lib/qr-v2';

// Inlined auth functions to avoid module resolution issues
interface ApiKey {
  tier: string;
  name: string;
}

interface ApiKeys {
  [key: string]: ApiKey;
}

function getApiKeyFromHeaders(headers: Headers): string | null {
  const key = headers.get('x-api-key');
  return key ? key.trim() : null;
}

function validateApiKey(key: string | null): ApiKey | null {
  if (!key) return null;
  const hardcodedKeys: ApiKeys = {
    "ek_live_QCXYt6dKWCMn2W4K": { tier: "pro", name: "JK Admin" },
    "ek_live_74qlNSbK5jTwQ28Y": { tier: "free", name: "Demo Key" },
    "ek_test_FkZRpDLFI4BrHlBo": { tier: "free", name: "Dev Testing" }
  };
  return hardcodedKeys[key] || null;
}

// Helper to parse request body from different methods
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
        // Invalid JSON will be caught by validation
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
    // Parse from JSON body
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

// Main request handler
async function handleQRRequest(request: NextRequest): Promise<NextResponse> {
  const requestId = Math.random().toString(36).substring(2, 15);
  const startTime = Date.now();

  try {
    console.log(`[${requestId}] === V2 ROUTE CALLED === ${request.method} ${request.url}`);
    console.log(`[${requestId}] QR v2 request: ${request.method} ${request.url}`);

    // Parse request parameters
    const params = await parseRequestBody(request);

    // Validate API key
    let apiKey = getApiKeyFromHeaders(request.headers);

    // For GET requests, also accept api_key as query parameter
    if (!apiKey && request.method === 'GET') {
      const url = new URL(request.url);
      apiKey = url.searchParams.get('api_key');
    }

    if (!apiKey) {
      console.log(`[${requestId}] No API key provided`);
      return errorResponse(
        ERROR_CODES.AUTH_REQUIRED,
        getErrorMessage(ERROR_CODES.AUTH_REQUIRED),
        401
      );
    }

    const keyInfo = validateApiKey(apiKey);
    if (!keyInfo) {
      console.log(`[${requestId}] Invalid API key`);
      return errorResponse(
        ERROR_CODES.INVALID_API_KEY,
        getErrorMessage(ERROR_CODES.INVALID_API_KEY),
        401
      );
    }

    // Check tier-based feature gating
    const tier = keyInfo.tier;
    const isImageFeatureRequest =
      (params.border && ['image', 'svg'].includes((params.border as any).mode)) ||
      params.overlay;

    if (isImageFeatureRequest && tier === 'free') {
      console.log(`[${requestId}] Image features blocked on free tier`);
      return errorResponse(
        'FEATURE_TIER_RESTRICTED' as any,
        'Image borders, SVG borders, and overlays require Starter tier or higher',
        403,
        {
          request_id: requestId,
          processing_ms: Date.now() - startTime
        }
      );
    }

    // Rate limiting
    const rateLimitResult = await checkRateLimit(apiKey, tier as "free" | "starter" | "pro" | "enterprise");
    if (!rateLimitResult.allowed) {
      console.log(`[${requestId}] Rate limited`);
      return errorResponse(
        ERROR_CODES.RATE_LIMIT_EXCEEDED,
        getErrorMessage(ERROR_CODES.RATE_LIMIT_EXCEEDED),
        429,
        {
          request_id: requestId,
          processing_ms: Date.now() - startTime
        }
      );
    }

    // Generate QR code
    console.log(`[${requestId}] Generating QR with params:`, {
      data_length: params.data?.length,
      size: params.size,
      format: params.format,
      dot_style: params.dot_style,
      has_gradient: !!params.gradient,
      has_border: !!params.border,
      has_overlay: !!params.overlay,
      tier
    });

    const result = await generateQRCodeV2(params);

    // Convert buffer to base64
    const base64Image = result.imageBuffer.toString('base64');

    const response = successResponse(
      {
        image: base64Image,
        format: result.format,
        size: result.size,
        file_size_bytes: result.fileSizeBytes,
        warnings: result.warnings
      },
      {
        request_id: requestId,
        processing_ms: Date.now() - startTime,
        remaining_credits: rateLimitResult.remaining
      }
    );

    console.log(`[${requestId}] Success: ${result.format} ${result.size}x${result.size} (${Math.round(result.fileSizeBytes / 1024)}KB) in ${Date.now() - startTime}ms`);
    return response;

  } catch (error) {
    const processingMs = Date.now() - startTime;
    console.error(`[${requestId}] Error after ${processingMs}ms:`, error);

    if (error instanceof QRValidationError) {
      const errorMessage = `${error.errors.map(e => `${e.field}: ${e.message}`).join(', ')}`;
      return errorResponse(
        ERROR_CODES.INVALID_PARAMS,
        errorMessage,
        400,
        {
          request_id: requestId,
          processing_ms: processingMs
        }
      );
    }

    if (error instanceof QRProcessingError) {
      const statusCode = getStatusCodeForError(error.code);
      return errorResponse(
        error.code as any,
        error.message,
        statusCode,
        {
          request_id: requestId,
          processing_ms: processingMs
        }
      );
    }

    // Unexpected error
    const errorMessage = error instanceof Error ? error.message : String(error);
    return errorResponse(
      ERROR_CODES.INTERNAL_ERROR,
      errorMessage,
      500,
      {
        request_id: requestId,
        processing_ms: processingMs
      }
    );
  }
}

// Map error codes to HTTP status codes
function getStatusCodeForError(code: string): number {
  const statusMap: Record<string, number> = {
    // Client errors (400s)
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

    // Resource not found (404s)
    'LOGO_NOT_FOUND': 404,
    'BORDER_IMAGE_NOT_FOUND': 404,
    'OVERLAY_PHOTO_NOT_FOUND': 404,

    // Resource errors (422s)
    'IMAGE_TOO_LARGE': 422,
    'BLOCKED_IMAGE_URL': 422,
    'INVALID_IMAGE_URL': 422,
    'INVALID_IMAGE_TYPE': 422,
    'INVALID_IMAGE_CONTENT': 422,

    // Server errors (500s)
    'QR_GENERATION_FAILED': 500,
    'QR_RENDERING_FAILED': 500,
    'LOGO_EMBEDDING_FAILED': 500,
    'BORDER_APPLICATION_FAILED': 500,
    'OVERLAY_APPLICATION_FAILED': 500,
    'IMAGE_PROCESSING_FAILED': 500,
    'GENERATION_FAILED': 500,

    // Network/timeout errors (502s)
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
  return handleQRRequest(request);
}

export async function POST(request: NextRequest) {
  return handleQRRequest(request);
}