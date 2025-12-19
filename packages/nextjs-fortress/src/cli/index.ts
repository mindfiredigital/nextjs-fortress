#!/usr/bin/env node

// cli/index.ts - Fortress CLI tool for easy setup

import * as fs from 'fs'
import * as path from 'path'
import { execSync } from 'child_process'

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
}

function log(message: string, color: keyof typeof COLORS = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`)
}

function logHeader() {
  console.log('')
  log('╔═══════════════════════════════════════════╗', 'cyan')
  log('║                                           ║', 'cyan')
  log('║      🛡️  nextjs-fortress CLI v0.1.0       ║', 'cyan')
  log('║   Universal Security Validation Framework ║', 'cyan')
  log('║                                           ║', 'cyan')
  log('╚═══════════════════════════════════════════╝', 'cyan')
  console.log('')
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

function createFortressConfig(options: any) {
  const config = `import { FortressConfig } from 'nextjs-fortress';

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
    console.log(\`🚨 Security Event [\${event.type}]:\`, {
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

function createMiddleware(hasAppDir: boolean) {
  const middleware = `import { createFortressMiddleware } from 'nextjs-fortress';
import { fortressConfig } from './fortress.config';

// Create Fortress middleware with your configuration
export const middleware = createFortressMiddleware(fortressConfig);

// Configure which routes to protect
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
`

  return middleware
}

function createEnvExample(options: any) {
  return `# Fortress Configuration

# CSRF Secret (generate with: openssl rand -hex 32)
CSRF_SECRET=your-secret-key-here

# Whitelisted IPs (comma-separated)
WHITELIST_IPS=127.0.0.1

# External Security Log Endpoint (optional)
SECURITY_LOG_ENDPOINT=https://your-siem.com/events
`
}

function createExampleApiRoute() {
  return `import { NextRequest, NextResponse } from 'next/server';

// This endpoint is automatically protected by Fortress middleware
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Your business logic here
    // Input is automatically validated by Fortress
    
    return NextResponse.json({ 
      success: true, 
      message: '✅ Request validated by Fortress',
      data: body 
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request' }, 
      { status: 400 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: '🛡️ Fortress Active',
    protections: [
      'Deserialization (CVE-2025-55182)',
      'SQL Injection',
      'XSS Attacks',
      'Command Injection',
      'Encoding Bypass (Ghost Mode)',
      'Rate Limiting',
      'Security Headers',
    ]
  });
}
`
}

function installDependencies() {
  log('\n📦 Installing nextjs-fortress...', 'blue')

  try {
    execSync('npm install nextjs-fortress', { stdio: 'inherit' })
    log('✅ Dependencies installed successfully', 'green')
  } catch (error) {
    log('❌ Failed to install dependencies', 'red')
    log('Please run: npm install nextjs-fortress', 'yellow')
  }
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

  log(`✓ Next.js ${nextVersion} detected`, 'green')
  log(`✓ Using ${hasAppDir ? 'App Router' : 'Pages Router'}`, 'green')
  log(`✓ ${hasSrc ? 'src/' : ''} directory structure`, 'green')
  console.log('')

  // Configuration options (you can make these interactive with prompts)
  const options = {
    mode: 'development',
    logLevel: 'debug',
    maxDepth: 10,
    enableCSRF: false,
    enableRateLimit: true,
    rateLimitRequests: 10,
    rateLimitWindow: 60000,
    maxPayloadSize: 1024 * 1024,
  }

  log('🔧 Creating configuration files...', 'blue')
  console.log('')

  // Create fortress.config.ts
  const configPath = path.join(process.cwd(), 'fortress.config.ts')
  if (fs.existsSync(configPath)) {
    log('⚠️  fortress.config.ts already exists, skipping...', 'yellow')
  } else {
    fs.writeFileSync(configPath, createFortressConfig(options))
    log('✅ Created fortress.config.ts', 'green')
  }

  // Create middleware.ts
  const middlewarePath = path.join(process.cwd(), 'middleware.ts')
  if (fs.existsSync(middlewarePath)) {
    log('⚠️  middleware.ts already exists, skipping...', 'yellow')
  } else {
    fs.writeFileSync(middlewarePath, createMiddleware(hasAppDir))
    log('✅ Created middleware.ts', 'green')
  }

  // Create .env.example
  const envExamplePath = path.join(process.cwd(), '.env.example')
  if (!fs.existsSync(envExamplePath)) {
    fs.writeFileSync(envExamplePath, createEnvExample(options))
    log('✅ Created .env.example', 'green')
  }

  // Create example API route
  if (hasAppDir) {
    const apiDir = path.join(process.cwd(), 'app', 'api', 'test')
    if (!fs.existsSync(apiDir)) {
      fs.mkdirSync(apiDir, { recursive: true })
      fs.writeFileSync(path.join(apiDir, 'route.ts'), createExampleApiRoute())
      log('✅ Created example API route: /app/api/test/route.ts', 'green')
    }
  }

  console.log('')
  log('🎉 Fortress setup complete!', 'green')
  console.log('')

  log('Next steps:', 'bright')
  log('1. Install dependencies: npm install', 'cyan')
  log('2. Start dev server: npm run dev', 'cyan')
  log(
    '3. Test protection: curl -X POST http://localhost:3000/api/test \\',
    'cyan'
  )
  log('   -H "Content-Type: application/json" \\', 'cyan')
  log('   -d \'{"__proto__": {"hacked": true}}\'', 'cyan')
  console.log('')
  log(
    '📚 Documentation: https://github.com/lakinmindfire/nextjs-fortress',
    'blue'
  )
  console.log('')
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
  console.log('')

  log('Features:', 'bright')
  log('  • Deserialization protection (CVE-2025-55182)', 'green')
  log('  • SQL/XSS/Command injection detection', 'green')
  log('  • Encoding bypass protection (Ghost Mode)', 'green')
  log('  • CSRF protection', 'green')
  log('  • Rate limiting', 'green')
  log('  • Security headers', 'green')
  console.log('')
}

function showVersion() {
  log('nextjs-fortress v0.1.0', 'cyan')
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
