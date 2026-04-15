import * as qrcode from 'qrcode'
const sharp = require('sharp')
import {
  QRFormat,
  ErrorCorrectionLevel,
  QR_DEFAULTS,
  QR_LIMITS,
  SUPPORTED_FORMATS,
  ERROR_CODES
} from './config'

export interface QRGenerateOptions {
  data: string
  size: number
  format: QRFormat
  color: string
  background: string
  margin: number
  error_correction: ErrorCorrectionLevel
  logo_url?: string
  logo_size?: number
}

export interface QRResult {
  image?: string
  svg?: string
  format: string
  size: number
  file_size_bytes: number
  warnings?: string[]
}

/**
 * Validates QR generation parameters and returns clean typed options
 */
export function validateQRParams(params: any): QRGenerateOptions {
  const errors: string[] = []

  // Validate required data field
  if (!params.data || typeof params.data !== 'string') {
    errors.push('data field is required and must be a string')
  } else if (params.data.length > QR_LIMITS.data_max_length) {
    throw new Error(`DATA_TOO_LONG: Maximum data length is ${QR_LIMITS.data_max_length} characters`)
  }

  // Validate size
  const size = params.size ?? QR_DEFAULTS.size
  if (typeof size !== 'number' || size < QR_LIMITS.size.min || size > QR_LIMITS.size.max) {
    errors.push(`size must be a number between ${QR_LIMITS.size.min} and ${QR_LIMITS.size.max}`)
  }

  // Validate format
  const format = params.format ?? QR_DEFAULTS.format
  if (!SUPPORTED_FORMATS.includes(format)) {
    errors.push(`format must be one of: ${SUPPORTED_FORMATS.join(', ')}`)
  }

  // Validate colors (hex with # prefix, 3 or 6 digits)
  const color = params.color ?? QR_DEFAULTS.color
  const background = params.background ?? QR_DEFAULTS.background

  const hexPattern = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/
  if (!hexPattern.test(color)) {
    errors.push('color must be a valid hex color with # prefix (e.g., #000000 or #000)')
  }
  if (!hexPattern.test(background)) {
    errors.push('background must be a valid hex color with # prefix (e.g., #FFFFFF or #FFF)')
  }

  // Validate margin
  const margin = params.margin ?? QR_DEFAULTS.margin
  if (typeof margin !== 'number' || margin < QR_LIMITS.margin.min || margin > QR_LIMITS.margin.max) {
    errors.push(`margin must be a number between ${QR_LIMITS.margin.min} and ${QR_LIMITS.margin.max}`)
  }

  // Validate error correction level
  const validErrorLevels: ErrorCorrectionLevel[] = ['L', 'M', 'Q', 'H']
  let errorCorrection = params.error_correction ?? QR_DEFAULTS.error_correction
  if (!validErrorLevels.includes(errorCorrection)) {
    errors.push('error_correction must be one of: L, M, Q, H')
  }

  // Validate logo parameters
  let logoUrl = params.logo_url
  let logoSize = params.logo_size ?? QR_DEFAULTS.logo_size

  if (logoUrl) {
    // Auto-upgrade error correction to H for logo compatibility
    errorCorrection = 'H'

    if (typeof logoUrl !== 'string' || !isValidUrl(logoUrl)) {
      errors.push('logo_url must be a valid HTTP/HTTPS URL')
    }

    if (typeof logoSize !== 'number' || logoSize < QR_LIMITS.logo_size.min || logoSize > QR_LIMITS.logo_size.max) {
      errors.push(`logo_size must be a number between ${QR_LIMITS.logo_size.min} and ${QR_LIMITS.logo_size.max}`)
    }
  }

  if (errors.length > 0) {
    throw new Error(`INVALID_PARAMS: ${errors.join(', ')}`)
  }

  return {
    data: params.data,
    size,
    format,
    color,
    background,
    margin,
    error_correction: errorCorrection,
    logo_url: logoUrl,
    logo_size: logoSize,
  }
}

/**
 * Main QR code generation function
 */
export async function generateQRCode(options: QRGenerateOptions): Promise<QRResult> {
  const warnings: string[] = []

  try {
    const qrOptions = {
      errorCorrectionLevel: options.error_correction,
      type: 'png' as const,
      quality: 0.92,
      margin: options.margin,
      color: {
        dark: options.color,
        light: options.background,
      },
      width: options.size,
    }

    // Handle SVG format
    if (options.format === 'svg') {
      if (options.logo_url) {
        return await generateSVGWithLogo(options, warnings)
      } else {
        const svgString = await qrcode.toString(options.data, {
          ...qrOptions,
          type: 'svg',
        })

        return {
          svg: svgString,
          format: options.format,
          size: options.size,
          file_size_bytes: Buffer.byteLength(svgString, 'utf8'),
          warnings: warnings.length > 0 ? warnings : undefined,
        }
      }
    }

    // Handle raster formats (PNG, JPEG, WebP)
    if (options.logo_url) {
      return await generateRasterWithLogo(options, warnings)
    } else {
      return await generateRasterWithoutLogo(options, warnings)
    }

  } catch (error) {
    if (error instanceof Error && error.message.startsWith('LOGO_FETCH_FAILED')) {
      throw error
    }
    throw new Error(`GENERATION_FAILED: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Generate SVG with embedded logo
 */
async function generateSVGWithLogo(options: QRGenerateOptions, warnings: string[]): Promise<QRResult> {
  // Generate base SVG without logo
  const baseSvg = await qrcode.toString(options.data, {
    errorCorrectionLevel: options.error_correction,
    type: 'svg',
    margin: options.margin,
    color: {
      dark: options.color,
      light: options.background,
    },
    width: options.size,
  })

  try {
    // Fetch and validate logo
    const logoBuffer = await fetchLogo(options.logo_url!)
    const logoBase64 = logoBuffer.toString('base64')
    const logoMimeType = getImageMimeType(logoBuffer)

    // Calculate logo size and position
    const logoPixelSize = Math.round(options.size * (options.logo_size! / 100))
    const logoX = (options.size - logoPixelSize) / 2
    const logoY = (options.size - logoPixelSize) / 2

    // Inject logo into SVG
    const logoImage = `<image x="${logoX}" y="${logoY}" width="${logoPixelSize}" height="${logoPixelSize}" href="data:${logoMimeType};base64,${logoBase64}"/>`

    // Insert logo before closing </svg> tag
    const svgWithLogo = baseSvg.replace('</svg>', `${logoImage}</svg>`)

    return {
      svg: svgWithLogo,
      format: options.format,
      size: options.size,
      file_size_bytes: Buffer.byteLength(svgWithLogo, 'utf8'),
      warnings: warnings.length > 0 ? warnings : undefined,
    }
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('LOGO_FETCH_FAILED')) {
      throw error
    }
    warnings.push('Logo could not be embedded, generating QR code without logo')

    return {
      svg: baseSvg,
      format: options.format,
      size: options.size,
      file_size_bytes: Buffer.byteLength(baseSvg, 'utf8'),
      warnings,
    }
  }
}

/**
 * Generate raster format without logo
 */
async function generateRasterWithoutLogo(options: QRGenerateOptions, warnings: string[]): Promise<QRResult> {
  const buffer = await qrcode.toBuffer(options.data, {
    errorCorrectionLevel: options.error_correction,
    type: 'png',
    margin: options.margin,
    color: {
      dark: options.color,
      light: options.background,
    },
    width: options.size,
  })

  // Convert format if needed
  let finalBuffer = buffer
  if (options.format !== 'png') {
    finalBuffer = await convertImageFormat(buffer, options.format)
  }

  return {
    image: finalBuffer.toString('base64'),
    format: options.format,
    size: options.size,
    file_size_bytes: finalBuffer.length,
    warnings: warnings.length > 0 ? warnings : undefined,
  }
}

/**
 * Generate raster format with logo
 */
async function generateRasterWithLogo(options: QRGenerateOptions, warnings: string[]): Promise<QRResult> {
  try {
    // Generate base QR code as PNG
    const qrBuffer = await qrcode.toBuffer(options.data, {
      errorCorrectionLevel: options.error_correction,
      type: 'png',
      margin: options.margin,
      color: {
        dark: options.color,
        light: options.background,
      },
      width: options.size,
    })

    // Fetch and process logo
    const logoBuffer = await fetchLogo(options.logo_url!)
    const logoPixelSize = Math.round(options.size * (options.logo_size! / 100))

    // Resize logo and composite with QR code
    const resizedLogo = await sharp(logoBuffer)
      .resize(logoPixelSize, logoPixelSize, { fit: 'cover' })
      .png()
      .toBuffer()

    const compositeBuffer = await sharp(qrBuffer)
      .composite([{
        input: resizedLogo,
        gravity: 'center',
      }])
      .png()
      .toBuffer()

    // Convert format if needed
    let finalBuffer = compositeBuffer
    if (options.format !== 'png') {
      finalBuffer = await convertImageFormat(compositeBuffer, options.format)
    }

    return {
      image: finalBuffer.toString('base64'),
      format: options.format,
      size: options.size,
      file_size_bytes: finalBuffer.length,
      warnings: warnings.length > 0 ? warnings : undefined,
    }

  } catch (error) {
    if (error instanceof Error && error.message.startsWith('LOGO_FETCH_FAILED')) {
      throw error
    }

    // Fallback to QR without logo
    warnings.push('Logo could not be embedded, generating QR code without logo')
    return await generateRasterWithoutLogo(options, warnings)
  }
}

/**
 * Fetch logo with timeout and validation
 */
async function fetchLogo(logoUrl: string): Promise<Buffer> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

  try {
    const response = await fetch(logoUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'QR-API/1.0.0',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.startsWith('image/')) {
      throw new Error('URL does not point to an image')
    }

    const contentLength = response.headers.get('content-length')
    if (contentLength && parseInt(contentLength) > 5 * 1024 * 1024) { // 5MB limit
      throw new Error('Image is too large (max 5MB)')
    }

    const buffer = await response.arrayBuffer()
    if (buffer.byteLength > 5 * 1024 * 1024) {
      throw new Error('Image is too large (max 5MB)')
    }

    return Buffer.from(buffer)

  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('LOGO_FETCH_FAILED: Request timeout (5s limit)')
      }
      throw new Error(`LOGO_FETCH_FAILED: ${error.message}`)
    }
    throw new Error('LOGO_FETCH_FAILED: Unknown error')
  } finally {
    clearTimeout(timeoutId)
  }
}

/**
 * Convert image to different format using Sharp
 */
async function convertImageFormat(buffer: Buffer, format: QRFormat): Promise<Buffer> {
  const sharpInstance = sharp(buffer)

  switch (format) {
    case 'jpeg':
      return await sharpInstance.jpeg({ quality: 85 }).toBuffer()
    case 'webp':
      return await sharpInstance.webp({ quality: 85 }).toBuffer()
    case 'png':
    default:
      return await sharpInstance.png().toBuffer()
  }
}

/**
 * Get MIME type from image buffer
 */
function getImageMimeType(buffer: Buffer): string {
  // Check magic bytes to determine format
  if (buffer.length >= 8) {
    // PNG signature: 89 50 4E 47 0D 0A 1A 0A
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
      return 'image/png'
    }
    // JPEG signature: FF D8 FF
    if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
      return 'image/jpeg'
    }
    // WebP signature: RIFF...WEBP
    if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
        buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) {
      return 'image/webp'
    }
    // GIF signature: GIF87a or GIF89a
    if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
      return 'image/gif'
    }
  }

  // Default fallback
  return 'image/png'
}

/**
 * Validate URL format
 */
function isValidUrl(url: string): boolean {
  try {
    const urlObj = new URL(url)
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:'
  } catch {
    return false
  }
}