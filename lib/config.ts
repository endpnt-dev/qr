export const API_VERSION = '1.0.0'

export const TIER_LIMITS = {
  free: {
    requests_per_minute: 10,
    requests_per_month: 100
  },
  starter: {
    requests_per_minute: 60,
    requests_per_month: 5000
  },
  pro: {
    requests_per_minute: 300,
    requests_per_month: 25000
  },
  enterprise: {
    requests_per_minute: 1000,
    requests_per_month: 100000
  },
} as const

export const QR_DEFAULTS = {
  size: 400,
  format: 'png' as const,
  color: '#000000',
  background: '#FFFFFF',
  margin: 4,
  error_correction: 'M' as const,
  logo_size: 20,
}

export const QR_LIMITS = {
  size: { min: 100, max: 2000 },
  margin: { min: 0, max: 10 },
  logo_size: { min: 10, max: 30 },
  data_max_length: 4296,
}

export const QR_V2_LIMITS = {
  border_width: { min: 1, max: 200 },
  border_padding: { min: 0, max: 50 },
  border_radius: { min: 0, max: 50 },
  border_opacity: { min: 0, max: 1 },
  border_label_max_length: 50,
  border_label_font_size: { min: 8, max: 48 },
  svg_path_max_length: 10000,
  svg_path_max_commands: 500,
  svg_stroke_width: { min: 0, max: 20 },
  overlay_qr_size: { min: 10, max: 80 },
  overlay_opacity: { min: 0.1, max: 1 },
  overlay_photo_max_mb: 10,
  border_image_max_mb: 5,
  max_image_dimension: 4096,
  image_fetch_timeout_ms: 5000,
  gradient_max_stops: 5,
}

export const QR_V2_DEFAULTS = {
  border_width: 20,
  border_padding: 10,
  border_radius: 0,
  border_opacity: 1,
  border_label_position: 'bottom' as const,
  border_label_font_size: 14,
  border_label_font_color: '#FFFFFF',
  svg_stroke_color: '#000000',
  svg_stroke_width: 2,
  svg_fill: 'none',
  svg_viewBox: '0 0 200 200',
  overlay_qr_size: 25,
  overlay_opacity: 1,
  dot_style: 'square' as const,
  eye_shape: 'square' as const,
  eye_inner_shape: 'square' as const,
}

export const SUPPORTED_FORMATS = ['png', 'svg', 'jpeg', 'webp'] as const

export const ERROR_CODES = {
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  INVALID_API_KEY: 'INVALID_API_KEY',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  DATA_TOO_LONG: 'DATA_TOO_LONG',
  INVALID_PARAMS: 'INVALID_PARAMS',
  LOGO_FETCH_FAILED: 'LOGO_FETCH_FAILED',
  GENERATION_FAILED: 'GENERATION_FAILED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const

export type QRFormat = typeof SUPPORTED_FORMATS[number]
export type ErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H'
export type ApiTier = keyof typeof TIER_LIMITS
export type ErrorCode = keyof typeof ERROR_CODES