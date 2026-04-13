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