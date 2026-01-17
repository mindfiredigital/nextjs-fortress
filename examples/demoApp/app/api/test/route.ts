import { NextRequest, NextResponse } from 'next/server'

// This endpoint is protected by Fortress middleware
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    return NextResponse.json({
      success: true,
      message: 'Request validated by Fortress',
      received: body,
    })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Fortress Active',
    protections: [
      'Deserialization (CVE-2025-55182)',
      'SQL Injection',
      'XSS Attacks',
      'Command Injection',
      'Encoding Bypass (Ghost Mode)',
      'Rate Limiting',
      'Security Headers',
    ],
  })
}
