#!/usr/bin/env node

// cli/index.ts - Fortress CLI tool for easy setup

import * as fs from 'fs'
import * as path from 'path'
import { execSync } from 'child_process'

interface FortressOptions {
  mode: string
  logLevel: string
  maxDepth: number
  enableCSRF: boolean
  enableRateLimit: boolean
  rateLimitRequests: number
  rateLimitWindow: number
  maxPayloadSize: number
}

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
}

function log(message: string, color: keyof typeof COLORS = 'reset') {
  console.warn(`${COLORS[color]}${message}${COLORS.reset}`)
}

function logHeader() {
  console.warn('')
  log('╔═══════════════════════════════════════════╗', 'cyan')
  log('║                                           ║', 'cyan')
  log('║   @mindfiredigital/nextjs-fortress v0.1.0 ║', 'cyan')
  log('║   Universal Security Validation Framework ║', 'cyan')
  log('║                                           ║', 'cyan')
  log('╚═══════════════════════════════════════════╝', 'cyan')
  console.warn('')
}

function checkNextJsProject(): boolean {
  const packageJsonPath = path.join(process.cwd(), 'package.json')

  if (!fs.existsSync(packageJsonPath)) {
    log('❌ Error: package.json not found', 'red')
    log('Please run this command in a Next.js project directory', 'yellow')
    return false
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))

  if (!packageJson.dependencies?.next && !packageJson.devDependencies?.next) {
    log('❌ Error: Next.js not found in dependencies', 'red')
    log('Please run this command in a Next.js project directory', 'yellow')
    return false
  }

  return true
}

function detectNextJsVersion(): string {
  try {
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf-8')
    )
    const nextVersion =
      packageJson.dependencies?.next || packageJson.devDependencies?.next
    return nextVersion?.replace('^', '').replace('~', '').split('.')[0] || '14'
  } catch {
    return '14'
  }
}

function hasAppDirectory(): boolean {
  return fs.existsSync(path.join(process.cwd(), 'app'))
}

function hasSrcDirectory(): boolean {
  return fs.existsSync(path.join(process.cwd(), 'src'))
}

function createFortressConfig(options: FortressOptions) {
  const config = `import { FortressConfig } from '@mindfiredigital/nextjs-fortress';

export const fortressConfig: FortressConfig = {
  enabled: true,
  mode: '${options.mode}',
  
  logging: {
    enabled: true,
    level: '${options.logLevel}',
    destination: 'console',
  },

  modules: {
    // 1. Deserialization Protection (CVE-2025-55182)
    deserialization: {
      enabled: true,
      native: false,
      maxDepth: ${options.maxDepth},
      detectCircular: true,
    },

    // 2. Injection Detection (SQL, XSS, Command, Code)
    injection: {
      enabled: true,
      checks: ['sql', 'command', 'xss', 'codeInjection'],
    },

    // 3. Encoding Validation (Ghost Mode Protection)
    encoding: {
      enabled: true,
      blockNonUTF8: true,
      detectBOM: true,
    },

    // 4. CSRF Protection
    csrf: {
      enabled: ${options.enableCSRF},
      cookieName: '_csrf',
      tokenSecret: process.env.CSRF_SECRET,
    },

    // 5. Rate Limiting
    rateLimit: {
      enabled: ${options.enableRateLimit},
      byIP: { 
        requests: ${options.rateLimitRequests}, 
        window: ${options.rateLimitWindow}
      },
    },

    // 6. Content Validation
    content: {
      enabled: true,
      maxPayloadSize: ${options.maxPayloadSize},
    },

    // 7. Security Headers
    securityHeaders: {
      enabled: true,
    },
  },

  whitelist: {
    paths: ['/_next', '/favicon.ico', '/api/health'],
    ips: process.env.WHITELIST_IPS?.split(',') || [],
  },

  onSecurityEvent: async (event) => {
    // Log security events
    console.warn(\`🚨 Security Event [\${event.type}]:\`, {
      severity: event.severity,
      message: event.message,
      path: event.request.path,
      ip: event.request.ip,
    });

    // Send to external monitoring (optional)
    // if (event.severity === 'critical') {
    //   await sendToSentry(event);
    // }
  },
};
`

  return config
}

function createMiddleware() {
  return `import { createFortressMiddleware } from '@mindfiredigital/nextjs-fortress';
import { fortressConfig } from './fortress.config';

export const middleware = createFortressMiddleware(fortressConfig);

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
`
}

function createMiddlewareIntegrationGuide() {
  return `// ============================================
// FORTRESS MIDDLEWARE INTEGRATION GUIDE
// ============================================

import { createFortressMiddleware } from '@mindfiredigital/nextjs-fortress';
import { fortressConfig } from './fortress.config';

// Create Fortress middleware
const fortressMiddleware = createFortressMiddleware(fortressConfig);

// OPTION 1: Use Fortress as your only middleware
// ------------------------------------------------
// Replace your existing middleware export with:

export const middleware = fortressMiddleware;

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};


// OPTION 2: Combine with existing middleware
// -------------------------------------------
// If you have existing middleware logic:

import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  // 1. Run Fortress security checks first
  const fortressResponse = await fortressMiddleware(request);
  
  // If Fortress blocks the request, return immediately
  if (fortressResponse.status !== 200 && fortressResponse.status !== 304) {
    return fortressResponse;
  }
  
  // 2. Run your existing middleware logic
  // ... your custom logic here ...
  
  // 3. Return response
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};


// OPTION 3: Chain multiple middleware functions
// ----------------------------------------------
// For complex middleware chains:

import { NextRequest, NextResponse } from 'next/server';

type MiddlewareFactory = (middleware: MiddlewareFunction) => MiddlewareFunction;
type MiddlewareFunction = (request: NextRequest) => Promise<NextResponse>;

function chain(functions: MiddlewareFactory[], index = 0): MiddlewareFunction {
  const current = functions[index];
  
  if (current) {
    const next = chain(functions, index + 1);
    return current(next);
  }
  
  return () => Promise.resolve(NextResponse.next());
}

// Your existing middleware
function withAuth(middleware: MiddlewareFunction): MiddlewareFunction {
  return async (request: NextRequest) => {
    // Your auth logic
    return middleware(request);
  };
}

function withLogging(middleware: MiddlewareFunction): MiddlewareFunction {
  return async (request: NextRequest) => {
    console.log('Request:', request.url);
    return middleware(request);
  };
}

// Wrap Fortress middleware in factory pattern
function withFortress(middleware: MiddlewareFunction): MiddlewareFunction {
  return async (request: NextRequest) => {
    const fortressResponse = await fortressMiddleware(request);
    if (fortressResponse.status !== 200 && fortressResponse.status !== 304) {
      return fortressResponse;
    }
    return middleware(request);
  };
}

export const middleware = chain([
  withFortress,  // Run Fortress first for security
  withAuth,      // Then auth
  withLogging,   // Then logging
]);

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};


// OPTION 4: Selective path protection
// ------------------------------------
// Apply Fortress only to specific paths:

import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Apply Fortress to API routes and specific paths
  if (path.startsWith('/api') || path.startsWith('/admin')) {
    const fortressResponse = await fortressMiddleware(request);
    if (fortressResponse.status !== 200 && fortressResponse.status !== 304) {
      return fortressResponse;
    }
  }
  
  // Your other middleware logic for other paths
  // ...
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
`
}

function createEnvExample(options: FortressOptions) {
  return `# ============================================
# Fortress Configuration (Mode: ${options.mode})
# ============================================

# CSRF Secret (generate with: openssl rand -hex 32)
# REQUIRED for production when CSRF is enabled
CSRF_SECRET=your-secret-key-here-min-32-chars

# Whitelisted IPs (comma-separated)
# These IPs will bypass rate limiting
WHITELIST_IPS=127.0.0.1

# External Security Log Endpoint (optional)
# Send security events to external monitoring
# SECURITY_LOG_ENDPOINT=https://your-siem.com/events

# ============================================
# Fortress Module Settings (Optional)
# Override config values via environment
# ============================================

# FORTRESS_MODE=production
# FORTRESS_LOG_LEVEL=warn
# FORTRESS_MAX_DEPTH=10
# FORTRESS_RATE_LIMIT_REQUESTS=100
# FORTRESS_RATE_LIMIT_WINDOW=60000
# FORTRESS_MAX_PAYLOAD_SIZE=1048576
`
}

function createExampleApiRoute() {
  return `import { NextRequest, NextResponse } from 'next/server';
import { createWithFortress } from '@mindfiredigital/nextjs-fortress';
import { fortressConfig } from '@/fortress.config';

const withFortress = createWithFortress(fortressConfig);

// This endpoint is protected by Fortress
export const POST = withFortress(
  async (request: NextRequest) => {
    try {
      const body = await request.json();
      
      // Your business logic here
      // Input is automatically validated by Fortress
      
      return NextResponse.json({ 
        success: true, 
        message: '✅ Request validated by Fortress',
        data: body,
        protections: [
          'Deserialization (CVE-2025-55182)',
          'SQL Injection',
          'XSS Attacks',
          'Command Injection',
          'Encoding Bypass',
        ]
      });
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid request' }, 
        { status: 400 }
      );
    }
  },
  {
    // Route-specific options
    rateLimit: { requests: 10, window: 60000 },
    maxPayloadSize: 512 * 1024, // 512KB
    requireCSRF: false,
  }
);

export async function GET() {
  return NextResponse.json({ 
    status: '🛡️ Fortress Active',
    version: '0.1.0',
    protections: [
      'Deserialization (CVE-2025-55182)',
      'SQL Injection',
      'XSS Attacks',
      'Command Injection',
      'Encoding Bypass (Ghost Mode)',
      'Rate Limiting',
      'CSRF Protection',
      'Security Headers',
    ]
  });
}
`
}

function installDependencies() {
  log('\n📦 Installing @mindfiredigital/nextjs-fortress...', 'blue')

  try {
    // Check if already installed
    const packageJsonPath = path.join(process.cwd(), 'package.json')
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
    
    if (packageJson.dependencies?.['@mindfiredigital/nextjs-fortress'] || 
        packageJson.devDependencies?.['@mindfiredigital/nextjs-fortress']) {
      log('✅ Package already installed, skipping...', 'green')
      return
    }

    execSync('npm install @mindfiredigital/nextjs-fortress', { stdio: 'inherit' })
    log('✅ Dependencies installed successfully', 'green')
  } catch (error) {
    log(
      `❌ Failed to install dependencies: ${error instanceof Error ? error.message : String(error)}`,
      'red'
    )
    log('Please run manually: npm install @mindfiredigital/nextjs-fortress', 'yellow')
  }
}

function handleExistingMiddleware(): void {
  const middlewarePath = path.join(process.cwd(), 'middleware.ts')
  const backupPath = path.join(process.cwd(), 'middleware.backup.ts')
  
  // Create backup
  fs.copyFileSync(middlewarePath, backupPath)
  log(`📋 Created backup: middleware.backup.ts`, 'cyan')
  
  // Create integration guide
  const guidePath = path.join(process.cwd(), 'fortress-middleware-integration.ts')
  fs.writeFileSync(guidePath, createMiddlewareIntegrationGuide())
  log(`📖 Created integration guide: fortress-middleware-integration.ts`, 'green')
  
  console.warn('')
  log('⚠️  EXISTING MIDDLEWARE DETECTED', 'yellow')
  console.warn('')
  log('Your existing middleware.ts has been backed up to:', 'cyan')
  log('  → middleware.backup.ts', 'bright')
  console.warn('')
  log('Integration guide created at:', 'cyan')
  log('  → fortress-middleware-integration.ts', 'bright')
  console.warn('')
  log('Please choose one of these integration options:', 'yellow')
  console.warn('')
  log('OPTION 1: Replace with Fortress (simplest)', 'bright')
  log('  - Use Fortress as your only middleware', 'cyan')
  log('  - Copy code from fortress-middleware-integration.ts', 'cyan')
  console.warn('')
  log('OPTION 2: Combine with existing logic', 'bright')
  log('  - Run Fortress checks first, then your logic', 'cyan')
  log('  - See examples in fortress-middleware-integration.ts', 'cyan')
  console.warn('')
  log('OPTION 3: Chain multiple middleware', 'bright')
  log('  - Advanced: Use middleware factory pattern', 'cyan')
  log('  - Full example in fortress-middleware-integration.ts', 'cyan')
  console.warn('')
  log('OPTION 4: Selective path protection', 'bright')
  log('  - Apply Fortress only to specific routes', 'cyan')
  log('  - Example: /api/* and /admin/* only', 'cyan')
  console.warn('')
}

function init() {
  logHeader()

  // Check if in Next.js project
  if (!checkNextJsProject()) {
    process.exit(1)
  }

  const nextVersion = detectNextJsVersion()
  const hasAppDir = hasAppDirectory()
  const hasSrc = hasSrcDirectory()

  log(`✅ Next.js ${nextVersion} detected`, 'green')
  log(`✅ Using ${hasAppDir ? 'App Router' : 'Pages Router'}`, 'green')
  log(`✅ ${hasSrc ? 'src/' : ''} directory structure`, 'green')
  console.warn('')

  // Configuration options
  const options: FortressOptions = {
    mode: 'development',
    logLevel: 'debug',
    maxDepth: 10,
    enableCSRF: false,
    enableRateLimit: true,
    rateLimitRequests: 100,
    rateLimitWindow: 60000,
    maxPayloadSize: 1024 * 1024,
  }

  log('📝 Creating configuration files...', 'blue')
  console.warn('')

  // Create fortress.config.ts
  const configPath = path.join(process.cwd(), 'fortress.config.ts')
  if (fs.existsSync(configPath)) {
    log('⏭️  fortress.config.ts already exists, skipping...', 'yellow')
  } else {
    fs.writeFileSync(configPath, createFortressConfig(options))
    log('✅ Created fortress.config.ts', 'green')
  }

  // Handle middleware.ts
  const middlewarePath = path.join(process.cwd(), 'middleware.ts')
  if (fs.existsSync(middlewarePath)) {
    handleExistingMiddleware()
  } else {
    fs.writeFileSync(middlewarePath, createMiddleware())
    log('✅ Created middleware.ts', 'green')
  }

  // Create .env.example
  const envExamplePath = path.join(process.cwd(), '.env.example')
  if (!fs.existsSync(envExamplePath)) {
    fs.writeFileSync(envExamplePath, createEnvExample(options))
    log('✅ Created .env.example', 'green')
  } else {
    log('⏭️  .env.example already exists, skipping...', 'yellow')
  }

  // Install dependencies
  installDependencies()

  // Create example API route
  if (hasAppDir) {
    const apiDir = path.join(process.cwd(), 'app', 'api', 'fortress-test')
    if (!fs.existsSync(apiDir)) {
      fs.mkdirSync(apiDir, { recursive: true })
      fs.writeFileSync(path.join(apiDir, 'route.ts'), createExampleApiRoute())
      log('✅ Created example API: /app/api/fortress-test/route.ts', 'green')
    }
  }

  console.warn('')
  log('🎉 Fortress setup complete!', 'green')
  console.warn('')

  log('📚 Next steps:', 'bright')
  console.warn('')
  log('1. Add CSRF secret to .env:', 'cyan')
  log('   CSRF_SECRET=$(openssl rand -hex 32)', 'magenta')
  console.warn('')
  log('2. Start dev server:', 'cyan')
  log('   npm run dev', 'magenta')
  console.warn('')
  log('3. Test protection:', 'cyan')
  log('   curl -X POST http://localhost:3000/api/fortress-test \\', 'magenta')
  log('   -H "Content-Type: application/json" \\', 'magenta')
  log('   -d \'{"__proto__": {"hacked": true}}\'', 'magenta')
  console.warn('')
  log('   Expected: 403 Forbidden (blocked by Fortress)', 'yellow')
  console.warn('')
  log('📖 Documentation:', 'bright')
  log('   https://github.com/mindfiredigital/nextjs-fortress', 'blue')
  console.warn('')
}

function showHelp() {
  logHeader()

  log('Usage:', 'bright')
  log('  npx fortress init         Initialize Fortress in current project', 'cyan')
  log('  npx fortress help         Show this help message', 'cyan')
  log('  npx fortress version      Show version', 'cyan')
  console.warn('')

  log('What "fortress init" does:', 'bright')
  log('  1. Creates fortress.config.ts with security settings', 'cyan')
  log('  2. Creates or updates middleware.ts', 'cyan')
  log('  3. Creates .env.example with required variables', 'cyan')
  log('  4. Creates example protected API route', 'cyan')
  log('  5. Installs @mindfiredigital/nextjs-fortress', 'cyan')
  console.warn('')

  log('Protection Features:', 'bright')
  log('  🛡️  Deserialization protection (CVE-2025-55182)', 'green')
  log('  🛡️  SQL/XSS/Command injection detection', 'green')
  log('  🛡️  Encoding bypass protection (Ghost Mode)', 'green')
  log('  🛡️  CSRF protection', 'green')
  log('  🛡️  Rate limiting', 'green')
  log('  🛡️  Security headers', 'green')
  console.warn('')

  log('Need help?', 'bright')
  log('  GitHub: https://github.com/mindfiredigital/nextjs-fortress', 'blue')
  log('  Issues: https://github.com/mindfiredigital/nextjs-fortress/issues', 'blue')
  console.warn('')
}

function showVersion() {
  log('@mindfiredigital/nextjs-fortress v0.1.0', 'cyan')
}

// CLI Entry Point
const args = process.argv.slice(2)
const command = args[0]

switch (command) {
  case 'init':
    init()
    break
  case 'help':
  case '--help':
  case '-h':
    showHelp()
    break
  case 'version':
  case '--version':
  case '-v':
    showVersion()
    break
  default:
    if (!command) {
      showHelp()
    } else {
      log(`❌ Unknown command: ${command}`, 'red')
      log('Run "npx fortress help" for usage information', 'yellow')
    }
}