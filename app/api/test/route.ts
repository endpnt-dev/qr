import { NextRequest, NextResponse } from 'next/server'
import * as QRCode from 'qrcode'

export async function GET(request: NextRequest) {
  try {
    // Test QR code generation
    const testData = 'https://example.com'
    const qrCodeDataURL = await QRCode.toDataURL(testData)

    return NextResponse.json({
      success: true,
      message: 'QR API dependencies are working',
      qrCodeLength: qrCodeDataURL.length,
      testData
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}