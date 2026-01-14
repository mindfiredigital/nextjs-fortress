import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    return NextResponse.json({
      success: true,
      message: '🔒 Secure endpoint - Fortress validated',
      received: body,
      note: 'This endpoint is PROTECTED by Fortress'
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request' }, 
      { status: 400 }
    )
  }
}