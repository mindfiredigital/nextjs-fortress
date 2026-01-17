import React from "react";

export type AttackSeverity = 'critical' | 'high' | 'medium';
export type AttackCategory = 'injection' | 'xss' | 'deserialization' | 'bypass' | 'dos' | 'encoding' | 'general';

export interface AttackPayload {
  [key: string]: string | number | boolean | object | undefined
  _encoding?: string
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

export interface Attack {
  name: string
  icon: React.ComponentType<{ className?: string }>
  description: string
  payload: AttackPayload
  severity: AttackSeverity
  category: AttackCategory
}

export interface AttackListProps {
  attacks: [string, Attack][]
  selectedAttack: AttackKey
  onAttackSelect: (key: AttackKey) => void
}

export interface AttackListItemProps {
  attackKey: AttackKey
  attack: Attack
  isSelected: boolean
  onSelect: (key: AttackKey) => void
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