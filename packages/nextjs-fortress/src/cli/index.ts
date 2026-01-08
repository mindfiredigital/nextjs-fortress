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

    if (
      packageJson.dependencies?.['@mindfiredigital/nextjs-fortress'] ||
      packageJson.devDependencies?.['@mindfiredigital/nextjs-fortress']
    ) {
      log('✅ Package already installed, skipping...', 'green')
      return
    }

    execSync('npm install @mindfiredigital/nextjs-fortress', {
      stdio: 'inherit',
    })
    log('✅ Dependencies installed successfully', 'green')
  } catch (error) {
    log(
      `❌ Failed to install dependencies: ${error instanceof Error ? error.message : String(error)}`,
      'red'
    )
    log(
      'Please run manually: npm install @mindfiredigital/nextjs-fortress',
      'yellow'
    )
  }
}

function handleExistingMiddleware(): boolean {
  console.warn('')
  log('⚠️  EXISTING MIDDLEWARE DETECTED', 'yellow')
  console.warn('')
  log('Your project already has a middleware.ts file.', 'cyan')
  log('Fortress will NOT override your existing middleware.', 'cyan')
  console.warn('')
  log('📖 To integrate Fortress with your existing middleware:', 'bright')
  console.warn('')
  log('Please read the integration guide in the README:', 'yellow')
  log('  → https://github.com/mindfiredigital/nextjs-fortress#middleware-integration', 'blue')
  console.warn('')
  log('Or check the documentation for manual setup:', 'yellow')
  log('  → https://github.com/mindfiredigital/nextjs-fortress/blob/main/docs/INTEGRATION.md', 'blue')
  console.warn('')
  
  return false // Indicates middleware was not created
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

  let middlewareCreated = false

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
    middlewareCreated = handleExistingMiddleware()
  } else {
    fs.writeFileSync(middlewarePath, createMiddleware())
    log('✅ Created middleware.ts', 'green')
    middlewareCreated = true
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
  
  // Different messages based on whether middleware was created
  if (middlewareCreated) {
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
  } else {
    log('⚠️  Fortress setup partially complete', 'yellow')
    console.warn('')
    log('✅ Created: fortress.config.ts', 'green')
    log('⚠️  Skipped: middleware.ts (already exists)', 'yellow')
    console.warn('')
    log('📚 Required action:', 'bright')
    log('You must manually integrate Fortress into your existing middleware.', 'cyan')
    log('Please follow the integration guide in the README.', 'cyan')
  }

  console.warn('')
  log('📖 Documentation:', 'bright')
  log('   https://github.com/mindfiredigital/nextjs-fortress', 'blue')
  console.warn('')
}

function showHelp() {
  logHeader()

  log('Usage:', 'bright')
  log(
    '  npx fortress init         Initialize Fortress in current project',
    'cyan'
  )
  log('  npx fortress help         Show this help message', 'cyan')
  log('  npx fortress version      Show version', 'cyan')
  console.warn('')

  log('What "fortress init" does:', 'bright')
  log('  1. Creates fortress.config.ts with security settings', 'cyan')
  log('  2. Creates middleware.ts (if not present)', 'cyan')
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
  log(
    '  Issues: https://github.com/mindfiredigital/nextjs-fortress/issues',
    'blue'
  )
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