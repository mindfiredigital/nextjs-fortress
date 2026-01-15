// components/AttackList.tsx
import { AlertTriangle } from 'lucide-react'
import { AttackKey, AttackListProps } from '../types'
import { UI_LABELS } from '../lib/constants'
import { AttackListItem } from './AttackListItem'

export function AttackList({ attacks, selectedAttack, onAttackSelect }: AttackListProps) {
  return (
    <div className="glass-effect rounded-xl p-6 animate-slide-up shadow-professional-lg">
      <h2 className="text-xl font-semibold text-white mb-5 flex items-center gap-2">
        <AlertTriangle className="w-5 h-5 text-red-700" />
        {UI_LABELS.THREAT_VECTORS} ({attacks.length})
      </h2>

      <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin">
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