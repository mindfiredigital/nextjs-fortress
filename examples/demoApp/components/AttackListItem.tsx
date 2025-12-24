// components/AttackListItem.tsx
import { AttackListItemProps } from '../types'
import { getSeverityColor, getSeverityBadgeColor } from '../lib/utils/attackHelpers'



export function AttackListItem({ attackKey, attack, isSelected, onSelect }: AttackListItemProps) {
  const AttackIcon = attack.icon

  return (
    <button
      onClick={() => onSelect(attackKey)}
      className={`
        w-full text-left p-3 rounded-xl 
        transition-all duration-200 cursor-pointer
        hover:scale-[1.02] active:scale-[0.98]
        ${
          isSelected
            ? 'bg-primary-500/30 border-2 border-primary-400 shadow-glow-blue'
            : 'bg-dark-bg-secondary/30 border-2 border-transparent hover:bg-dark-bg-tertiary/50 hover:border-primary-400/30'
        }
      `}
    >
      <div className="flex items-start gap-3">
        <AttackIcon
          className={`w-5 h-5 mt-1 ${getSeverityColor(attack.severity)}`}
        />
        <div className="flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-white text-sm">
              {attack.name}
            </h3>
            <span
              className={`text-2xs font-bold px-2 py-0.5 rounded-full ${getSeverityBadgeColor(attack.severity)}`}
            >
              {attack.severity.toUpperCase()}
            </span>
          </div>
          <p className="text-xs text-dark-text-secondary mt-1">
            {attack.description}
          </p>
        </div>
      </div>
    </button>
  )
}