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
          <div key={group.category} className="glass-effect rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Icon className="w-6 h-6 text-primary-400" />
              <h2 className="text-xl font-bold text-white">
                {group.category}
              </h2>
            </div>
            
            <p className="text-sm text-dark-text-secondary mb-4">
              {group.description}
            </p>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-4">
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
                      <AttackIcon className="w-5 h-5 mt-1 text-primary-400" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-white text-sm">
                          {attack.name}
                        </h3>
                        <p className="text-xs text-dark-text-secondary mt-1">
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