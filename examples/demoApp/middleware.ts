// middleware.ts
import { createFortressMiddleware } from 'nextjs-fortress'
import { fortressConfig } from './fortress.config'
import { NextRequest, NextResponse } from 'next/server'

// Option 1: Simple
// export const middleware = createFortressMiddleware(fortressConfig)

// Option 2: With custom logic - NO TYPE ERRORS
async function myMiddleware(request: NextRequest) {
  const response = NextResponse.next()
  response.headers.set('x-custom', 'value')
  return response
}

export const middleware = createFortressMiddleware(fortressConfig, myMiddleware)