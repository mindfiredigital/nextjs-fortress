export type AttackSeverity = 'critical' | 'high' | 'medium'
export type AttackCategory = 'deserialization' | 'injection' | 'encoding' | 'general'

export interface AttackPayload {
  [key: string]: string | number | boolean | object | undefined
  _encoding?: string
}

export interface Attack {
  name: string
  icon: React.ComponentType<{ className?: string }>
  description: string
  payload: AttackPayload
  severity: AttackSeverity
  category: AttackCategory
}

export interface TestResultDetails {
  rule: string
  pattern: string
  confidence: number
  action: string
  timestamp: string
}

export interface TestResult {
  blocked: boolean
  attack: string
  severity: AttackSeverity
  responseStatus: number
  message: string
  details: TestResultDetails
}

export interface Category {
  id: AttackCategory | 'all'
  name: string
  icon: React.ComponentType<{ className?: string }>
}

export type AttackKey = 
  | 'prototypePollution'
  | 'constructorInjection'
  | 'deepNesting'
  | 'sqlUnion'
  | 'sqlBoolean'
  | 'sqlTimeBased'
  | 'xssScript'
  | 'xssEventHandler'
  | 'xssIframe'
  | 'cmdShell'
  | 'cmdBackticks'
  | 'evalInjection'
  | 'utf16leBypass'
  | 'rateLimitTest'
  | 'validRequest'