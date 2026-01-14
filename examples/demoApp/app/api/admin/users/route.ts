import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    return NextResponse.json({
      success: true,
      message: '🛡️ Admin endpoint - Protected by Fortress',
      data: body,
      note: 'This endpoint is PROTECTED by Fortress'
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request' }, 
      { status: 400 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: '🛡️ Admin endpoint - Protected by Fortress',
    users: [
      { id: 1, name: 'Admin User' },
      { id: 2, name: 'Test User' }
    ]
  })
}