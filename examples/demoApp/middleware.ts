import { createSelectiveFortressMiddleware } from 'nextjs-fortress'
import { fortressConfig } from './fortress.config'
import { NextResponse } from 'next/server'

// Your existing custom middleware logic
async function myMiddleware( ) {
  const response = NextResponse.next()
  response.headers.set('x-custom', 'value')
  response.headers.set('x-app-version', '1.0.0')
  return response
}

export const middleware = createSelectiveFortressMiddleware(
  fortressConfig,
  {
    // Routes that MUST be protected by Fortress
    protectedPaths: [
      '/api/test',           // Your test endpoint
      '/api/admin/*',        // All admin routes
      '/api/secure/*',       // All secure routes
    ],
    
    // Routes that should NEVER be protected
    excludedPaths: [
      '/api/public/*',       // Public endpoints
      '/api/health',         // Health check
    ],
    
    // Your custom middleware runs on ALL routes
    customMiddleware: myMiddleware
  }
)

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}