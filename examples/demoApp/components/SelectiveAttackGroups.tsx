// components/SelectiveAttackGroups.tsx
import { ATTACKS } from '@/lib/mock/attacks'
import { SELECTIVE_ATTACKS } from '@/lib/constants/selectiveAttacks'
import { SelectiveAttackGroupsProps} from '@/types'

export function SelectiveAttackGroups({ 
  selectedAttack, 
  onAttackSelect 
}: SelectiveAttackGroupsProps) {
  return (
    <div className="space-y-6">
      {SELECTIVE_ATTACKS.map((group) => {
        const Icon = group.icon
        return (
          <div key={group.category} className="glass-effect rounded-xl p-6 shadow-professional-lg">
            <div className="flex items-center gap-2 mb-4">
              <Icon className="w-5 h-5 text-red-700" />
              <h2 className="text-xl font-semibold text-white">
                {group.category}
              </h2>
            </div>
            
            <p className="text-sm text-gray-400 mb-4 leading-relaxed">
              {group.description}
            </p>

            <div className="bg-blue-950/20 border border-blue-800/30 rounded-lg p-3 mb-4">
              <p className="text-xs text-blue-300">
                <span className="font-semibold">Expected:</span> {group.expectedBehavior}
              </p>
            </div>

            <div className="space-y-2">
              {group.attacks.map((attackKey) => {
                const attack = ATTACKS[attackKey]
                const AttackIcon = attack.icon
                const isSelected = selectedAttack === attackKey

                return (
                  <button
                    key={attackKey}
                    onClick={() => onAttackSelect(attackKey)}
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
                      <AttackIcon className="w-5 h-5 mt-0.5 text-gray-400" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white text-sm mb-1">
                          {attack.name}
                        </h3>
                        <p className="text-xs text-gray-400 leading-relaxed">
                          {attack.description}
                        </p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}