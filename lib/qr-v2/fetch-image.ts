/**
 * Secure Image Fetching Utility
 * Handles remote image downloads with security mitigations and validation
 */

import { QRProcessingError, VALIDATION_LIMITS } from './types';

// ============ SECURITY CONSTANTS ============

// Private/internal IP ranges to block (SSRF protection)
const BLOCKED_IP_RANGES = [
  /^127\./, // 127.0.0.0/8 - localhost
  /^169\.254\./, // 169.254.0.0/16 - link-local
  /^10\./, // 10.0.0.0/8 - private
  /^172\.(1[6-9]|2[0-9]|3[01])\./, // 172.16.0.0/12 - private
  /^192\.168\./, // 192.168.0.0/16 - private
  /^0\./, // 0.0.0.0/8 - invalid
  /^224\./, // 224.0.0.0/4 - multicast
  /^255\./, // 255.0.0.0/8 - broadcast
];

const BLOCKED_HOSTNAMES = [
  'localhost',
  'metadata.google.internal', // GCP metadata
  '169.254.169.254', // AWS/Azure metadata
];

// Valid image content types
const VALID_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'image/bmp'
];

// ============ URL VALIDATION ============

function validateImageUrl(url: string): void {
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(url);
  } catch (error) {
    throw new QRProcessingError('Invalid URL format', 'INVALID_IMAGE_URL');
  }

  // Only allow HTTP/HTTPS protocols
  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    throw new QRProcessingError('URL must use HTTP or HTTPS protocol', 'INVALID_IMAGE_URL');
  }

  // Block dangerous hostnames
  const hostname = parsedUrl.hostname.toLowerCase();
  if (BLOCKED_HOSTNAMES.includes(hostname)) {
    throw new QRProcessingError('Access to this hostname is not allowed', 'BLOCKED_IMAGE_URL');
  }

  // Block private IP ranges
  for (const range of BLOCKED_IP_RANGES) {
    if (range.test(hostname)) {
      throw new QRProcessingError('Access to private/internal IPs is not allowed', 'BLOCKED_IMAGE_URL');
    }
  }

  // Additional hostname validation
  if (hostname.includes('..') || hostname.startsWith('.') || hostname.endsWith('.')) {
    throw new QRProcessingError('Invalid hostname format', 'INVALID_IMAGE_URL');
  }
}

// ============ CONTENT VALIDATION ============

function validateImageContent(buffer: Buffer, contentType: string | null): void {
  // Validate content type
  if (!contentType || !VALID_IMAGE_TYPES.some(type => contentType.toLowerCase().startsWith(type))) {
    throw new QRProcessingError(
      `Invalid image type. Supported types: ${VALID_IMAGE_TYPES.join(', ')}`,
      'INVALID_IMAGE_TYPE'
    );
  }

  // Validate file size
  if (buffer.length > VALIDATION_LIMITS.image_max_size_bytes) {
    throw new QRProcessingError(
      `Image too large. Maximum size: ${Math.round(VALIDATION_LIMITS.image_max_size_bytes / 1024 / 1024)}MB`,
      'IMAGE_TOO_LARGE'
    );
  }

  // Basic file signature validation
  validateImageSignature(buffer, contentType);
}

function validateImageSignature(buffer: Buffer, contentType: string): void {
  if (buffer.length < 8) {
    throw new QRProcessingError('Image file too small or corrupted', 'INVALID_IMAGE_CONTENT');
  }

  const header = buffer.subarray(0, 8);

  // Check magic bytes for common formats
  const signatures = {
    'image/jpeg': [
      [0xFF, 0xD8, 0xFF], // JPEG
    ],
    'image/png': [
      [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A], // PNG
    ],
    'image/gif': [
      [0x47, 0x49, 0x46, 0x38, 0x37, 0x61], // GIF87a
      [0x47, 0x49, 0x46, 0x38, 0x39, 0x61], // GIF89a
    ],
    'image/webp': [
      [0x52, 0x49, 0x46, 0x46], // RIFF (followed by WEBP)
    ],
    'image/bmp': [
      [0x42, 0x4D], // BM
    ]
  };

  const baseContentType = contentType.toLowerCase().split(';')[0];
  const expectedSignatures = signatures[baseContentType as keyof typeof signatures];

  if (expectedSignatures) {
    const matches = expectedSignatures.some(signature =>
      signature.every((byte, index) => header[index] === byte)
    );

    if (!matches) {
      throw new QRProcessingError(
        'Image content does not match declared content type',
        'INVALID_IMAGE_CONTENT'
      );
    }
  }
}

// ============ FETCH OPTIONS ============

interface FetchImageOptions {
  timeoutMs?: number;              // Request timeout in milliseconds
  maxSizeBytes?: number;           // Maximum image size in bytes
  label?: string;                  // For error messages (e.g., "logo", "border image", "overlay photo")
  userAgent?: string;              // Custom user agent
}

// ============ MAIN FETCH FUNCTION ============

export async function fetchRemoteImage(
  url: string,
  options: FetchImageOptions = {}
): Promise<Buffer> {
  const {
    timeoutMs = VALIDATION_LIMITS.image_fetch_timeout_ms,
    maxSizeBytes = VALIDATION_LIMITS.image_max_size_bytes,
    label = 'image',
    userAgent = 'QR-API-v2/1.0'
  } = options;

  try {
    // Validate URL before making request
    validateImageUrl(url);

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    let response: Response;

    try {
      // Make HTTP request with security headers
      response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': userAgent,
          'Accept': VALID_IMAGE_TYPES.join(', '),
          'Cache-Control': 'no-cache'
        },
        signal: controller.signal,
        redirect: 'follow', // Allow up to 20 redirects by default
        // Don't follow redirects to potentially dangerous URLs
      });
    } finally {
      clearTimeout(timeoutId);
    }

    // Check response status
    if (!response.ok) {
      const statusText = response.statusText || 'Unknown error';
      if (response.status === 404) {
        throw new QRProcessingError(`${label} not found (404)`, `${label.toUpperCase().replace(/\s+/g, '_')}_NOT_FOUND`);
      } else if (response.status >= 500) {
        throw new QRProcessingError(`${label} server error (${response.status})`, `${label.toUpperCase().replace(/\s+/g, '_')}_SERVER_ERROR`);
      } else {
        throw new QRProcessingError(
          `Failed to fetch ${label}: ${response.status} ${statusText}`,
          `${label.toUpperCase().replace(/\s+/g, '_')}_FETCH_FAILED`
        );
      }
    }

    // Check content length header
    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > maxSizeBytes) {
      throw new QRProcessingError(
        `${label} too large (${Math.round(parseInt(contentLength, 10) / 1024 / 1024)}MB)`,
        'IMAGE_TOO_LARGE'
      );
    }

    // Get content type
    const contentType = response.headers.get('content-type');

    // Download image data with streaming size check
    const chunks: Buffer[] = [];
    let totalSize = 0;
    const reader = response.body?.getReader();

    if (!reader) {
      throw new QRProcessingError(`Failed to read ${label} data`, `${label.toUpperCase().replace(/\s+/g, '_')}_READ_FAILED`);
    }

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        totalSize += value.length;
        if (totalSize > maxSizeBytes) {
          throw new QRProcessingError(
            `${label} too large during download (exceeded ${Math.round(maxSizeBytes / 1024 / 1024)}MB)`,
            'IMAGE_TOO_LARGE'
          );
        }

        chunks.push(Buffer.from(value));
      }
    } finally {
      reader.releaseLock();
    }

    // Combine chunks
    const imageBuffer = Buffer.concat(chunks);

    // Validate image content
    validateImageContent(imageBuffer, contentType);

    return imageBuffer;

  } catch (error) {
    if (error instanceof QRProcessingError) {
      throw error;
    }

    // Handle fetch-specific errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new QRProcessingError(
        `Network error fetching ${label}: ${error.message}`,
        `${label.toUpperCase().replace(/\s+/g, '_')}_NETWORK_ERROR`
      );
    }

    // Handle timeout errors
    if (error instanceof Error && error.name === 'AbortError') {
      throw new QRProcessingError(
        `Request timeout fetching ${label} (${timeoutMs}ms)`,
        `${label.toUpperCase().replace(/\s+/g, '_')}_TIMEOUT`
      );
    }

    // Generic error wrapper
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new QRProcessingError(
      `Failed to fetch ${label}: ${errorMessage}`,
      `${label.toUpperCase().replace(/\s+/g, '_')}_FETCH_FAILED`
    );
  }
}

// ============ UTILITY FUNCTIONS ============

/**
 * Validates if a URL points to an allowed image source
 * (without actually fetching the image)
 */
export function isValidImageUrl(url: string): boolean {
  try {
    validateImageUrl(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Gets image metadata without downloading the full image
 * (uses HTTP HEAD request)
 */
export async function getImageMetadata(url: string): Promise<{
  contentType: string | null;
  contentLength: number | null;
  lastModified: string | null;
}> {
  validateImageUrl(url);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout for HEAD

  try {
    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'User-Agent': 'QR-API-v2/1.0',
      }
    });

    return {
      contentType: response.headers.get('content-type'),
      contentLength: response.headers.get('content-length')
        ? parseInt(response.headers.get('content-length')!, 10)
        : null,
      lastModified: response.headers.get('last-modified')
    };
  } finally {
    clearTimeout(timeoutId);
  }
}