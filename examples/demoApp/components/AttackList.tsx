// components/AttackList.tsx
import { Activity } from 'lucide-react'
import { AttackKey, AttackListProps } from '../types'
import { UI_LABELS } from '../lib/constants'
import { AttackListItem } from './AttackListItem'

export function AttackList({ attacks, selectedAttack, onAttackSelect }: AttackListProps) {
  return (
    <div className="glass-effect rounded-2xl p-6 animate-slide-up">
      <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        <Activity className="w-6 h-6 text-danger" />
        {UI_LABELS.THREAT_VECTORS} ({attacks.length})
      </h2>

      <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-primary-500/50 scrollbar-track-transparent">
        {attacks.map(([key, attack]) => (
          <AttackListItem
            key={key}
            attackKey={key as AttackKey}
            attack={attack}
            isSelected={selectedAttack === key}
            onSelect={onAttackSelect}
          />
        ))}
      </div>
    </div>
  )
}