import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey, getApiKeyFromHeaders } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const apiKey = getApiKeyFromHeaders(request.headers);
  if (!apiKey) return NextResponse.json({ valid: false }, { status: 401 });
  const keyInfo = validateApiKey(apiKey);
  if (!keyInfo) return NextResponse.json({ valid: false }, { status: 401 });
  return NextResponse.json({ valid: true, tier: keyInfo.tier, name: keyInfo.name });
}