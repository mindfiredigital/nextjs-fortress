import { createFortressMiddleware } from 'nextjs-fortress'
import { fortressConfig } from './fortress.config'

export const middleware = createFortressMiddleware(fortressConfig)

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}

// import { NextResponse } from 'next/server'

// export function middleware() {
//   return NextResponse.next()
// }
