import { NextRequest } from 'next/server'
import { successResponse, errorResponse, generateRequestId, getErrorMessage } from '@/lib/response'
import { validateApiKey, getApiKeyFromHeaders } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rate-limit'
import { validateQRParams, generateQRCode } from '@/lib/qr'
import { ERROR_CODES } from '@/lib/config'

interface RequestParams {
  data?: string
  size?: string | number
  format?: string
  color?: string
  background?: string
  margin?: string | number
  error_correction?: string
  logo_url?: string
  logo_size?: string | number
}

function parseQRParams(params: RequestParams) {
  if (!params.data) {
    throw new Error('data parameter is required')
  }

  const parsedParams: any = {
    data: params.data,
  }

  // Parse numeric parameters
  if (params.size !== undefined) {
    const size = typeof params.size === 'string' ? parseInt(params.size) : params.size
    if (isNaN(size)) throw new Error('size must be a number')
    parsedParams.size = size
  }

  if (params.margin !== undefined) {
    const margin = typeof params.margin === 'string' ? parseInt(params.margin) : params.margin
    if (isNaN(margin)) throw new Error('margin must be a number')
    parsedParams.margin = margin
  }

  if (params.logo_size !== undefined) {
    const logoSize = typeof params.logo_size === 'string' ? parseInt(params.logo_size) : params.logo_size
    if (isNaN(logoSize)) throw new Error('logo_size must be a number')
    parsedParams.logo_size = logoSize
  }

  // Parse string parameters
  if (params.format) {
    parsedParams.format = params.format
  }

  if (params.color) {
    parsedParams.color = params.color
  }

  if (params.background) {
    parsedParams.background = params.background
  }

  if (params.error_correction) {
    parsedParams.error_correction = params.error_correction
  }

  if (params.logo_url) {
    parsedParams.logo_url = params.logo_url
  }

  return parsedParams
}

async function handleGenerateRequest(request: NextRequest): Promise<Response> {
  const startTime = Date.now()
  const requestId = generateRequestId()

  try {
    // 1. Validate API key
    let apiKey = getApiKeyFromHeaders(request.headers)

    // For GET requests, also accept api_key as query parameter
    if (!apiKey && request.method === 'GET') {
      const url = new URL(request.url)
      apiKey = url.searchParams.get('api_key')
    }

    if (!apiKey) {
      return errorResponse(
        ERROR_CODES.AUTH_REQUIRED,
        getErrorMessage(ERROR_CODES.AUTH_REQUIRED),
        401
      )
    }

    const keyInfo = validateApiKey(apiKey)
    if (!keyInfo) {
      return errorResponse(
        ERROR_CODES.INVALID_API_KEY,
        getErrorMessage(ERROR_CODES.INVALID_API_KEY),
        401
      )
    }

    // 2. Check rate limit
    const rateLimitResult = await checkRateLimit(apiKey, keyInfo.tier)
    if (!rateLimitResult.allowed) {
      return errorResponse(
        ERROR_CODES.RATE_LIMIT_EXCEEDED,
        getErrorMessage(ERROR_CODES.RATE_LIMIT_EXCEEDED),
        429,
        {
          request_id: requestId,
          remaining_credits: rateLimitResult.remaining,
        }
      )
    }

    // 3. Parse parameters
    let params: RequestParams

    if (request.method === 'GET') {
      const url = new URL(request.url)
      params = Object.fromEntries(url.searchParams.entries())
    } else {
      const contentType = request.headers.get('content-type')
      if (contentType?.includes('application/json')) {
        params = await request.json()
      } else {
        const formData = await request.formData()
        params = Object.fromEntries(formData.entries())
      }
    }

    const qrParams = parseQRParams(params)

    // 4. Validate QR parameters
    const validatedOptions = validateQRParams(qrParams)

    // 5. Generate QR code
    const result = await generateQRCode(validatedOptions)

    const processingTime = Date.now() - startTime

    return successResponse(
      result,
      {
        request_id: requestId,
        processing_ms: processingTime,
        remaining_credits: rateLimitResult.remaining - 1,
      }
    )
  } catch (error) {
    console.error('QR API error:', error)

    const processingTime = Date.now() - startTime

    if (error instanceof Error) {
      const message = error.message

      // Determine error type based on message
      if (message.startsWith('DATA_TOO_LONG')) {
        return errorResponse(
          ERROR_CODES.DATA_TOO_LONG,
          message.replace('DATA_TOO_LONG: ', ''),
          400,
          { request_id: requestId, processing_ms: processingTime }
        )
      }

      if (message.startsWith('INVALID_PARAMS')) {
        return errorResponse(
          ERROR_CODES.INVALID_PARAMS,
          message.replace('INVALID_PARAMS: ', ''),
          400,
          { request_id: requestId, processing_ms: processingTime }
        )
      }

      if (message.startsWith('LOGO_FETCH_FAILED')) {
        return errorResponse(
          ERROR_CODES.LOGO_FETCH_FAILED,
          message.replace('LOGO_FETCH_FAILED: ', ''),
          400,
          { request_id: requestId, processing_ms: processingTime }
        )
      }

      if (message.startsWith('GENERATION_FAILED')) {
        return errorResponse(
          ERROR_CODES.GENERATION_FAILED,
          message.replace('GENERATION_FAILED: ', ''),
          500,
          { request_id: requestId, processing_ms: processingTime }
        )
      }

      if (
        message.includes('must be') ||
        message.includes('required') ||
        message.includes('Format') ||
        message.includes('Parameter')
      ) {
        return errorResponse(
          ERROR_CODES.INVALID_PARAMS,
          message,
          400,
          { request_id: requestId, processing_ms: processingTime }
        )
      }
    }

    return errorResponse(
      ERROR_CODES.INTERNAL_ERROR,
      getErrorMessage(ERROR_CODES.INTERNAL_ERROR),
      500,
      { request_id: requestId, processing_ms: processingTime }
    )
  }
}

export async function GET(request: NextRequest) {
  return handleGenerateRequest(request)
}

export async function POST(request: NextRequest) {
  return handleGenerateRequest(request)
}