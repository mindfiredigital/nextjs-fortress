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
  | 'publicTest'      
  | 'adminTest'       
  | 'secureTest'      

export interface ResultPanelProps {
  result: TestResult
  onClear: () => void
}

export interface PayloadPanelProps {
  attack: Attack
  loading: boolean
  onTest: () => void
}

export interface HistoryPanelProps {
  history: TestResult[]
}

export interface FooterProps {
  history: TestResult[]
}

export interface CategoryFiltersProps {
  selectedCategory: AttackCategory | 'all'
  onCategoryChange: (category: AttackCategory | 'all') => void
}

export interface AttackListItemProps {
  attackKey: AttackKey
  attack: Attack
  isSelected: boolean
  onSelect: (key: AttackKey) => void
}

export interface AttackListProps {
  attacks: [string, Attack][]
  selectedAttack: AttackKey
  onAttackSelect: (key: AttackKey) => void
}

export interface ApiResponse {
  status: number
  headers: Headers
}

export interface SelectiveAttackGroup {
  category: string
  icon: React.ComponentType<{ className?: string }>
  description: string
  attacks: AttackKey[]
  expectedBehavior: string
}

export interface SelectiveAttackGroupsProps {
  selectedAttack: AttackKey
  onAttackSelect: (attackKey: AttackKey) => void
}

export interface SelectiveResultPanelProps {
  result: TestResult
  selectedAttack: AttackKey
  onClear: () => void
}