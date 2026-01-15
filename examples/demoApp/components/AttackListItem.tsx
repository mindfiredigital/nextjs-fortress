// components/AttackListItem.tsx
import { AttackListItemProps } from '../types'
import { getSeverityColor, getSeverityBadgeColor } from '../lib/utils/attackHelpers'

export function AttackListItem({ attackKey, attack, isSelected, onSelect }: AttackListItemProps) {
  const AttackIcon = attack.icon

  return (
    <button
      onClick={() => onSelect(attackKey)}
      className={`
        w-full text-left p-3.5 rounded-lg 
        transition-all duration-200 cursor-pointer border
        hover:translate-x-1
        ${
          isSelected
            ? 'bg-red-900/20 border-red-800/40 shadow-professional'
            : 'bg-zinc-900/30 border-zinc-800/30 hover:bg-zinc-800/40 hover:border-zinc-700/40'
        }
      `}
    >
      <div className="flex items-start gap-3">
        <AttackIcon
          className={`w-5 h-5 mt-0.5 ${getSeverityColor(attack.severity)}`}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <h3 className="font-semibold text-white text-sm truncate">
              {attack.name}
            </h3>
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded border flex-shrink-0 ${getSeverityBadgeColor(attack.severity)}`}
            >
              {attack.severity.toUpperCase()}
            </span>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed">
            {attack.description}
          </p>
        </div>
      </div>
    </button>
  )
}