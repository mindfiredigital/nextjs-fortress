import { Globe, Shield, Activity } from 'lucide-react'
import { AttackKey, SelectiveAttackGroup } from '@/types'

export const SELECTIVE_ATTACKS: SelectiveAttackGroup[] = [
  {
    category: '🌐 Public Routes (Should Allow)',
    icon: Globe,
    description: 'These routes are EXCLUDED from Fortress protection',
    attacks: ['publicTest'],
    expectedBehavior: 'Malicious payloads should be ALLOWED (200 OK)',
  },
  {
    category: '🛡️ Protected Routes (Should Block)',
    icon: Shield,
    description: 'These routes are PROTECTED by Fortress',
    attacks: ['adminTest', 'secureTest'],
    expectedBehavior: 'Malicious payloads should be BLOCKED (403 Forbidden)',
  },
  {
    category: '⚡ Default Route Tests',
    icon: Activity,
    description: 'Standard tests on /api/test endpoint',
    attacks: ['prototypePollution', 'sqlUnion', 'xssScript', 'validRequest'],
    expectedBehavior: 'Varies based on payload',
  },
]

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