/**
 * QR Code API v2 Type Definitions
 * Defines all interfaces and types for the v2 QR generation system
 */

// ============ ENUMS AND CONSTANTS ============

export const DOT_STYLES = [
  'square', 'dot', 'rounded', 'extra-rounded', 'classy', 'classy-rounded'
] as const;

export const EYE_STYLES = [
  'square', 'dot', 'rounded', 'classy'
] as const;

export const GRADIENT_TYPES = ['linear', 'radial'] as const;
export const BORDER_MODES = ['styled', 'image', 'svg'] as const;
export const ERROR_CORRECTION_LEVELS = ['L', 'M', 'Q', 'H'] as const;
export const OUTPUT_FORMATS = ['png', 'svg', 'jpeg', 'webp'] as const;

// ============ BASIC TYPES ============

export type DotStyle = typeof DOT_STYLES[number];
export type EyeStyle = typeof EYE_STYLES[number];
export type GradientType = typeof GRADIENT_TYPES[number];
export type BorderMode = typeof BORDER_MODES[number];
export type ErrorCorrectionLevel = typeof ERROR_CORRECTION_LEVELS[number];
export type OutputFormat = typeof OUTPUT_FORMATS[number];

// ============ V1 COMPATIBLE PARAMETERS ============

export interface BaseQRParams {
  data: string;                    // Required. Text/URL to encode
  size?: number;                   // Image size in px. Default: 400
  format?: OutputFormat;           // Default: "png"
  color?: string;                  // Foreground hex. Default: "#000000"
  background?: string;             // Background hex. Default: "#FFFFFF"
  margin?: number;                 // Quiet zone. Default: 4
  error_correction?: ErrorCorrectionLevel; // Default: "M"
  logo_url?: string;               // Logo image URL
  logo_size?: number;              // Logo size as % of QR code. Default: 20
}

// ============ V2 STYLING PARAMETERS ============

export interface GradientStop {
  offset: number;                  // 0.0 to 1.0
  color: string;                   // hex color
}

export interface GradientConfig {
  type: GradientType;              // "linear" | "radial"
  rotation?: number;               // degrees, 0-360, for linear only. Default: 0
  colors: GradientStop[];          // minimum 2 stops, maximum 5
}

export interface BorderStyledConfig {
  mode: 'styled';
  color?: string;                  // hex color. Default: "#000000"
  width?: number;                  // border width in px. 1-50. Default: 4
  radius?: number;                 // corner radius in px. 0-100. Default: 0
  padding?: number;                // space between QR and border, px. 0-100. Default: 16
  label?: {
    text: string;                  // max 100 chars
    position?: 'top' | 'bottom';   // Default: "bottom"
    font_size?: number;            // 8-48. Default: 14
    font_color?: string;           // hex. Default: same as border color
  };
}

export interface BorderImageConfig {
  mode: 'image';
  image_url: string;               // URL to border image/texture
  width?: number;                  // border frame width in px. 10-200. Default: 40
  padding?: number;                // inner padding. 0-100. Default: 8
  opacity?: number;                // 0.0-1.0. Default: 1.0
}

export interface BorderSvgConfig {
  mode: 'svg';
  svg_path: string;                // SVG path data (d attribute). Max 10,000 chars
  viewBox: string;                 // SVG viewBox, e.g. "0 0 400 400"
  stroke_color?: string;           // hex. Default: "#000000"
  stroke_width?: number;           // 1-10. Default: 2
  fill?: string;                   // hex or "none". Default: "none"
  padding?: number;                // 0-100. Default: 16
}

export type BorderConfig = BorderStyledConfig | BorderImageConfig | BorderSvgConfig;

export interface OverlayConfig {
  photo_url: string;               // URL to background photo
  position: {
    x: number;                     // 0.0-1.0, relative position from left
    y: number;                     // 0.0-1.0, relative position from top
  };
  qr_size?: number;                // QR code size as percentage of photo's shorter dimension. 10-90. Default: 30
  opacity?: number;                // QR code opacity. 0.1-1.0. Default: 1.0
}

export interface V2StyleParams {
  dot_style?: DotStyle;            // Module shape. Default: "square"
  eye_shape?: EyeStyle;            // Finder pattern outer shape. Default: "square"
  eye_inner_shape?: EyeStyle;      // Finder pattern inner shape. Default: "square"
  eye_color?: string;              // Hex color for finder pattern outer. Default: same as color
  eye_inner_color?: string;        // Hex color for finder pattern inner. Default: same as color
  gradient?: GradientConfig;       // Gradient for foreground dots. Default: null
  border?: BorderConfig;           // Border configuration. Default: null
  overlay?: OverlayConfig;         // QR-on-photo overlay. Default: null
}

// ============ COMBINED PARAMETERS ============

export interface QRParamsV2 extends BaseQRParams, V2StyleParams {}

// ============ VALIDATED PARAMETERS ============

export interface ValidatedQRParams extends V2StyleParams {
  // Base params with defaults applied - logo_url remains optional
  data: string;
  size: number;
  format: OutputFormat;
  color: string;
  background: string;
  margin: number;
  error_correction: ErrorCorrectionLevel;
  logo_url?: string;               // Optional - not all QR codes have logos
  logo_size: number;
}

// ============ LIBRARY CONFIGURATION MAPPING ============

// Maps our API parameters to @qr-platform/qr-code.js configuration
export interface QRLibraryConfig {
  data: string;
  width: number;
  height: number;
  margin: number;
  qrOptions: {
    errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H';
  };
  dotsOptions: {
    type: string;  // Library dot type name
    color?: string;
    gradient?: {
      type: 'linear' | 'radial';
      rotation?: number;
      colorStops: Array<{
        offset: number;
        color: string;
      }>;
    };
  };
  cornersSquareOptions?: {
    type: string;   // Library corner type name
    color?: string;
  };
  cornersDotOptions?: {
    type: string;   // Library corner dot type name
    color?: string;
  };
  backgroundOptions: {
    color: string;
  };
}

// ============ PROCESSING PIPELINE TYPES ============

export interface QRGenerationResult {
  svg: string;                     // Raw SVG from library
  warnings: string[];              // Any validation warnings
}

export interface ProcessingOptions {
  inputParams: ValidatedQRParams;
  outputSize: number;
  outputFormat: OutputFormat;
}

export interface ProcessingResult {
  imageBuffer: Buffer;
  format: OutputFormat;
  size: number;
  fileSizeBytes: number;
  warnings: string[];
}

// ============ API RESPONSE TYPES ============

export interface QRResponseData {
  image: string;                   // base64 encoded image
  format: OutputFormat;
  size: number;
  file_size_bytes: number;
  warnings: string[];
}

export interface QRResponseMeta {
  request_id: string;
  processing_ms: number;
  remaining_credits: number;
}

export interface QRResponse {
  success: boolean;
  data?: QRResponseData;
  error?: string;
  meta: QRResponseMeta;
}

// ============ ERROR TYPES ============

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export class QRValidationError extends Error {
  public errors: ValidationError[];

  constructor(errors: ValidationError[]) {
    super(`Validation failed: ${errors.map(e => `${e.field}: ${e.message}`).join(', ')}`);
    this.name = 'QRValidationError';
    this.errors = errors;
  }
}

export class QRProcessingError extends Error {
  public code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = 'QRProcessingError';
    this.code = code;
  }
}

// ============ LIBRARY MAPPING CONSTANTS ============

// Maps our dot style names to library type names
export const DOT_STYLE_MAPPING: Record<DotStyle, string> = {
  'square': 'square',
  'dot': 'dot',
  'rounded': 'rounded',
  'extra-rounded': 'extra-rounded',
  'classy': 'classy',
  'classy-rounded': 'classy-rounded'
};

// Maps our eye style names to library corner type names
export const EYE_STYLE_MAPPING: Record<EyeStyle, string> = {
  'square': 'square',
  'dot': 'dot',
  'rounded': 'rounded',
  'classy': 'classy'
};

// ============ VALIDATION LIMITS ============

export const VALIDATION_LIMITS = {
  data: { max_length: 4296 },                   // QR spec limit
  size: { min: 100, max: 2000 },                // Image dimensions
  margin: { min: 0, max: 10 },                  // Quiet zone modules
  logo_size: { min: 10, max: 30 },              // Logo as % of QR
  gradient_stops: { min: 2, max: 5 },           // Color stops in gradient
  border_styled_width: { min: 1, max: 50 },     // Styled border width
  border_styled_radius: { min: 0, max: 100 },   // Border corner radius
  border_styled_padding: { min: 0, max: 100 },  // Border inner padding
  border_image_width: { min: 10, max: 200 },    // Image border width
  border_label_max_length: 100,                 // Border label text
  border_label_font_size: { min: 8, max: 48 },  // Border label font
  border_svg_path_max_length: 10000,            // SVG path data length
  border_svg_stroke_width: { min: 1, max: 10 }, // SVG stroke width
  overlay_qr_size: { min: 10, max: 90 },        // QR size on photo %
  overlay_opacity: { min: 0.1, max: 1.0 },      // QR opacity on photo
  image_fetch_timeout_ms: 5000,                 // Image download timeout
  image_max_size_bytes: 5 * 1024 * 1024,        // Max 5MB images
} as const;