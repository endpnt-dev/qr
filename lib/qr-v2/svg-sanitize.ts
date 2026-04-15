import { QR_V2_LIMITS } from '../config';

export interface SanitizationResult {
  valid: boolean;
  sanitized: string;
  error?: string;
}

/**
 * Sanitize SVG path for security and complexity limits
 */
export function sanitizeSVGPath(path: string): SanitizationResult {
  // Basic length check
  if (path.length > QR_V2_LIMITS.svg_path_max_length) {
    return {
      valid: false,
      sanitized: '',
      error: `SVG path too long: ${path.length} chars. Maximum: ${QR_V2_LIMITS.svg_path_max_length}`
    };
  }

  // Remove any potentially dangerous content
  const dangerousPatterns = [
    /javascript:/gi,
    /data:/gi,
    /url\(/gi,
    /<script/gi,
    /on\w+=/gi,
    /xlink:href/gi,
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(path)) {
      return {
        valid: false,
        sanitized: '',
        error: 'SVG path contains potentially dangerous content'
      };
    }
  }

  // Allow only valid SVG path commands and coordinates
  // Valid characters: M,L,H,V,C,S,Q,T,A,Z (and lowercase), digits, decimal point, comma, space, minus
  const validPattern = /^[MLHVCSQTAZmlhvcsqtaz0-9.,\s\-]*$/;
  
  if (!validPattern.test(path)) {
    return {
      valid: false,
      sanitized: '',
      error: 'SVG path contains invalid characters'
    };
  }

  // Count path commands to prevent complexity bombs
  const commandPattern = /[MLHVCSQTAZmlhvcsqtaz]/g;
  const commands = path.match(commandPattern) || [];
  
  if (commands.length > QR_V2_LIMITS.svg_path_max_commands) {
    return {
      valid: false,
      sanitized: '',
      error: `Too many path commands: ${commands.length}. Maximum: ${QR_V2_LIMITS.svg_path_max_commands}`
    };
  }

  // Basic coordinate bounds check (prevent integer overflow)
  const numberPattern = /-?\d+(?:\.\d+)?/g;
  const numbers = path.match(numberPattern) || [];
  
  for (const num of numbers) {
    const value = parseFloat(num);
    if (Math.abs(value) > 1000000) { // 1M coordinate limit
      return {
        valid: false,
        sanitized: '',
        error: 'Coordinate values too large (max: ±1,000,000)'
      };
    }
  }

  // Clean up whitespace and normalize
  const sanitized = path
    .replace(/\s+/g, ' ')
    .trim();

  return {
    valid: true,
    sanitized,
  };
}

/**
 * Validate viewBox format
 */
export function validateViewBox(viewBox: string): { valid: boolean; error?: string } {
  if (!viewBox) {
    return { valid: true }; // viewBox is optional
  }

  const viewBoxPattern = /^-?\d+(?:\.\d+)?\s+-?\d+(?:\.\d+)?\s+\d+(?:\.\d+)?\s+\d+(?:\.\d+)?$/;
  
  if (!viewBoxPattern.test(viewBox)) {
    return {
      valid: false,
      error: 'ViewBox must be in format "x y width height" (e.g., "0 0 200 200")'
    };
  }

  const values = viewBox.split(/\s+/).map(parseFloat);
  const [x, y, width, height] = values;

  if (width <= 0 || height <= 0) {
    return {
      valid: false,
      error: 'ViewBox width and height must be positive'
    };
  }

  if (Math.abs(x) > 10000 || Math.abs(y) > 10000 || width > 10000 || height > 10000) {
    return {
      valid: false,
      error: 'ViewBox values too large (max: ±10,000)'
    };
  }

  return { valid: true };
}
