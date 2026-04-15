// QR Code v2 Type Definitions

export interface QRParamsV2 {
  // Basic parameters (same as v1)
  data: string;
  size?: number;
  format?: 'png' | 'svg' | 'jpeg' | 'webp';
  color?: string;
  background?: string;
  margin?: number;
  error_correction?: 'L' | 'M' | 'Q' | 'H';
  logo_url?: string;
  logo_size?: number;

  // V2 styling features
  dot_style?: 'square' | 'dot' | 'rounded' | 'extra-rounded' | 'classy' | 'classy-rounded';
  eye_shape?: 'square' | 'dot' | 'rounded' | 'classy';
  eye_inner_shape?: 'square' | 'dot' | 'rounded' | 'classy';
  eye_color?: string;
  eye_inner_color?: string;
  gradient?: QRGradient;

  // Borders (discriminated union)
  border?: BorderStyled | BorderImage | BorderSVG;

  // Overlay
  overlay?: QROverlay;
}

export interface QRGradient {
  type: 'linear' | 'radial';
  rotation?: number; // degrees, 0-360
  colors: QRGradientStop[];
}

export interface QRGradientStop {
  offset: number; // 0-1
  color: string;  // hex color
}

export interface BorderStyled {
  mode: 'styled';
  width: number;
  color: string;
  radius?: number;
  padding?: number;
  label?: {
    text: string;
    position?: 'top' | 'bottom';
    font_size?: number;
    font_color?: string;
  };
}

export interface BorderImage {
  mode: 'image';
  image_url: string;
  width: number;
  padding?: number;
  opacity?: number;
}

export interface BorderSVG {
  mode: 'svg';
  svg_path: string;
  viewBox?: string; // format: "x y width height"
  stroke_color?: string;
  stroke_width?: number;
  fill?: string;
}

export interface QROverlay {
  photo_url: string;
  position: {
    x: number; // 0-1, normalized coordinates
    y: number; // 0-1, normalized coordinates
  };
  qr_size?: number; // 10-80, percentage of photo's shorter dimension
  opacity?: number; // 0.1-1
}

export interface QRResultV2 {
  imageBuffer: Buffer;
  format: string;
  size: number;
  fileSizeBytes: number;
  warnings: string[];
}

// Error classes
export class QRValidationError extends Error {
  public errors: { field: string; message: string }[];

  constructor(errors: { field: string; message: string }[]) {
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

// Internal validated parameters type (after validation and defaults applied)
export interface ValidatedQRParams {
  data: string;
  size: number;
  format: 'png' | 'svg' | 'jpeg' | 'webp';
  color: string;
  background: string;
  margin: number;
  error_correction: 'L' | 'M' | 'Q' | 'H';
  logo_url?: string;
  logo_size?: number;
  dot_style: 'square' | 'dot' | 'rounded' | 'extra-rounded' | 'classy' | 'classy-rounded';
  eye_shape: 'square' | 'dot' | 'rounded' | 'classy';
  eye_inner_shape: 'square' | 'dot' | 'rounded' | 'classy';
  eye_color?: string;
  eye_inner_color?: string;
  gradient?: QRGradient;
  border?: BorderStyled | BorderImage | BorderSVG;
  overlay?: QROverlay;
}
