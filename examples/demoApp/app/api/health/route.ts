import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    message: ' Health check - No Fortress protection',
    timestamp: new Date().toISOString(),
    note: 'This endpoint is EXCLUDED from Fortress'
  })
}