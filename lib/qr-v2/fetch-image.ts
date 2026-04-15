import { QRProcessingError } from './types';
import { QR_V2_LIMITS } from '../config';
import { lookup } from 'dns/promises';

interface FetchImageOptions {
  maxSizeMB: number;
  timeoutMs?: number;
  label: string; // for error mapping: 'logo', 'border_image', 'overlay_photo'
}

/**
 * Securely fetch an image from a URL with SSRF protection and validation
 */
export async function fetchImage(url: string, options: FetchImageOptions): Promise<Buffer> {
  const { maxSizeMB, timeoutMs = QR_V2_LIMITS.image_fetch_timeout_ms, label } = options;
  
  try {
    // Validate URL format
    const parsedUrl = new URL(url);
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      throw new QRProcessingError('URL must use HTTP or HTTPS protocol', getErrorCode(label, 'INVALID_URL'));
    }

    // SSRF Protection: Check for private/internal IP addresses
    await validateHostname(parsedUrl.hostname, label);

    // Fetch with timeout and size limits
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'EndpntQR/1.0 Image Fetcher',
        },
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new QRProcessingError(
          `HTTP ${response.status}: ${response.statusText}`,
          getErrorCode(label, 'SERVER_ERROR')
        );
      }

      // Validate content type
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.startsWith('image/')) {
        throw new QRProcessingError(
          `Invalid content type: ${contentType}. Expected image/*`,
          getErrorCode(label, 'INVALID_TYPE')
        );
      }

      // Check content length if available
      const contentLength = response.headers.get('content-length');
      if (contentLength) {
        const sizeBytes = parseInt(contentLength, 10);
        const maxSizeBytes = maxSizeMB * 1024 * 1024;
        if (sizeBytes > maxSizeBytes) {
          throw new QRProcessingError(
            `Image too large: ${(sizeBytes / 1024 / 1024).toFixed(1)}MB. Maximum: ${maxSizeMB}MB`,
            getErrorCode(label, 'TOO_LARGE')
          );
        }
      }

      // Read response body
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Validate actual size
      const maxSizeBytes = maxSizeMB * 1024 * 1024;
      if (buffer.length > maxSizeBytes) {
        throw new QRProcessingError(
          `Image too large: ${(buffer.length / 1024 / 1024).toFixed(1)}MB. Maximum: ${maxSizeMB}MB`,
          getErrorCode(label, 'TOO_LARGE')
        );
      }

      // Validate image format by magic bytes
      await validateImageFormat(buffer, label);

      return buffer;
      
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new QRProcessingError(
          `Request timed out after ${timeoutMs}ms`,
          getErrorCode(label, 'TIMEOUT')
        );
      }
      
      if (error instanceof QRProcessingError) {
        throw error;
      }
      
      throw new QRProcessingError(
        `Network error: ${error.message}`,
        getErrorCode(label, 'NETWORK_ERROR')
      );
    }
    
  } catch (error) {
    if (error instanceof QRProcessingError) {
      throw error;
    }
    
    throw new QRProcessingError(
      `Failed to fetch image: ${error.message}`,
      getErrorCode(label, 'FETCH_FAILED')
    );
  }
}

/**
 * Validate hostname to prevent SSRF attacks
 */
async function validateHostname(hostname: string, label: string): Promise<void> {
  try {
    const addresses = await lookup(hostname, { all: true });
    
    for (const { address, family } of addresses) {
      if (family === 4) {
        // IPv4 private ranges
        if (isPrivateIPv4(address)) {
          throw new QRProcessingError(
            `Access to private IP address blocked: ${address}`,
            getErrorCode(label, 'BLOCKED_URL')
          );
        }
      } else if (family === 6) {
        // IPv6 private ranges
        if (isPrivateIPv6(address)) {
          throw new QRProcessingError(
            `Access to private IP address blocked: ${address}`,
            getErrorCode(label, 'BLOCKED_URL')
          );
        }
      }
    }
  } catch (error) {
    if (error instanceof QRProcessingError) {
      throw error;
    }
    throw new QRProcessingError(
      `DNS resolution failed for ${hostname}`,
      getErrorCode(label, 'NETWORK_ERROR')
    );
  }
}

/**
 * Check if IPv4 address is in private range
 */
function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4) return false;
  
  const [a, b, c, d] = parts;
  
  // 10.0.0.0/8
  if (a === 10) return true;
  
  // 172.16.0.0/12
  if (a === 172 && b >= 16 && b <= 31) return true;
  
  // 192.168.0.0/16
  if (a === 192 && b === 168) return true;
  
  // 127.0.0.0/8 (localhost)
  if (a === 127) return true;
  
  // 169.254.0.0/16 (link-local)
  if (a === 169 && b === 254) return true;
  
  return false;
}

/**
 * Check if IPv6 address is in private range
 */
function isPrivateIPv6(ip: string): boolean {
  // ::1 (localhost)
  if (ip === '::1') return true;
  
  // fc00::/7 (unique local addresses)
  if (ip.startsWith('fc') || ip.startsWith('fd')) return true;
  
  // fe80::/10 (link-local)
  if (ip.toLowerCase().startsWith('fe8') || ip.toLowerCase().startsWith('fe9') ||
      ip.toLowerCase().startsWith('fea') || ip.toLowerCase().startsWith('feb')) return true;
  
  return false;
}

/**
 * Validate image format by checking magic bytes
 */
async function validateImageFormat(buffer: Buffer, label: string): Promise<void> {
  if (buffer.length < 8) {
    throw new QRProcessingError('Invalid image: file too small', getErrorCode(label, 'INVALID_CONTENT'));
  }
  
  const header = buffer.slice(0, 8);
  
  // Check for supported formats
  const isPNG = header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4E && header[3] === 0x47;
  const isJPEG = header[0] === 0xFF && header[1] === 0xD8 && header[2] === 0xFF;
  const isWebP = buffer.slice(8, 12).toString() === 'WEBP' && buffer.slice(0, 4).toString() === 'RIFF';
  const isGIF = header.slice(0, 3).toString() === 'GIF';
  
  if (!isPNG && !isJPEG && !isWebP && !isGIF) {
    throw new QRProcessingError(
      'Unsupported image format. Supported: PNG, JPEG, WebP, GIF',
      getErrorCode(label, 'INVALID_TYPE')
    );
  }
}

/**
 * Map label and error type to specific error codes
 */
function getErrorCode(label: string, errorType: string): string {
  const prefix = label.toUpperCase();
  return `${prefix}_${errorType}`;
}
