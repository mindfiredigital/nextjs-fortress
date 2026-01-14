import { Attack, AttackSeverity, AttackCategory, AttackKey } from '../../types'

export const getSeverityColor = (severity: AttackSeverity): string => {
  const colors: Record<AttackSeverity, string> = {
    critical: 'text-red-400',
    high: 'text-orange-400',
    medium: 'text-yellow-400',
  }
  return colors[severity]
}

export const getSeverityBadgeColor = (severity: AttackSeverity): string => {
  const colors: Record<AttackSeverity, string> = {
    critical: 'bg-red-500/20 text-red-300',
    high: 'bg-orange-500/20 text-orange-300',
    medium: 'bg-yellow-500/20 text-yellow-300',
  }
  return colors[severity]
}

export const filterAttacksByCategory = (
  attacks: Record<string, Attack>,
  category: AttackCategory | 'all'
): [string, Attack][] => {
  const entries = Object.entries(attacks)
  
  if (category === 'all') {
    return entries
  }
  
  return entries.filter(([ , attack]) => attack.category === category)
}

export const getResultBorderColor = (blocked: boolean): string => {
  return blocked
    ? 'bg-green-500/10 border-green-500/30'
    : 'bg-red-500/10 border-red-500/30'
}

export const getResultTextColor = (blocked: boolean): string => {
  return blocked ? 'text-green-400' : 'text-red-400'
}

export function getTestStatus(attackKey: AttackKey, status: number): 'pass' | 'fail' {
  if (attackKey === 'publicTest') {
    return status === 200 ? 'pass' : 'fail'
  } else if (attackKey === 'adminTest' || attackKey === 'secureTest') {
    return status === 403 ? 'pass' : 'fail'
  } else if (attackKey === 'validRequest') {
    return status === 200 ? 'pass' : 'fail'
  } else {
    return status === 403 ? 'pass' : 'fail'
  }
}