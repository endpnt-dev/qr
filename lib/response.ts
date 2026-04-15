import { NextResponse } from 'next/server'
import { ErrorCode } from './config'

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: ErrorCode
    message: string
  }
  meta?: {
    request_id?: string
    processing_ms?: number
    remaining_credits?: number
  }
}

export function successResponse<T>(
  data: T,
  meta?: ApiResponse<T>['meta'],
  status: number = 200
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      meta,
    },
    { status }
  )
}

export function errorResponse(
  code: ErrorCode,
  message: string,
  status: number = 400,
  meta?: ApiResponse['meta']
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
      },
      meta,
    },
    { status }
  )
}

export function generateRequestId(): string {
  return `req_${Math.random().toString(36).substr(2, 8)}`
}

export function getErrorMessage(code: ErrorCode): string {
  const messages: Record<ErrorCode, string> = {
    AUTH_REQUIRED: 'API key is required. Include x-api-key header.',
    INVALID_API_KEY: 'Invalid API key. Check your credentials.',
    RATE_LIMIT_EXCEEDED: 'Rate limit exceeded. Please try again later.',
    DATA_TOO_LONG: 'Data is too long for QR code. Maximum length is 4296 characters.',
    INVALID_PARAMS: 'Invalid parameters. Check the request format.',
    LOGO_FETCH_FAILED: 'Failed to fetch logo image. Check the logo URL.',
    GENERATION_FAILED: 'Failed to generate QR code. Please try again.',
    INTERNAL_ERROR: 'Internal server error. Please try again later.',
  }
  return messages[code]
}