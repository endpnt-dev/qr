import { NextRequest } from 'next/server'
import { successResponse } from '@/lib/response'
import { API_VERSION } from '@/lib/config'

export async function GET(request: NextRequest) {
  return successResponse({
    status: 'ok',
    version: API_VERSION,
    service: 'qr',
    timestamp: new Date().toISOString(),
  })
}

export async function HEAD(request: NextRequest) {
  return new Response(null, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}