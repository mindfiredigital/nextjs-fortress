import { AttackKey, AttackSeverity } from "."

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

export interface ResultPanelProps {
  result: TestResult
  onClear: () => void
}

export interface ApiResponse {
  status: number
  headers: Headers
}

export interface SelectiveResultPanelProps {
  result: TestResult
  selectedAttack: AttackKey
  onClear: () => void
}