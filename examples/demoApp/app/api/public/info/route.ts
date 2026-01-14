import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Public endpoint - No Fortress protection',
    protections: 'None (excluded path)',
    timestamp: new Date().toISOString(),
  })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  
  return NextResponse.json({
    success: true,
    message: 'Public POST - Accepts anything (no validation)',
    received: body,
    note: 'This endpoint is EXCLUDED from Fortress protection'
  })
}