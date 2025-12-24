'use client'

import { useState } from 'react'
import { Shield, CheckCircle2, XCircle, Activity } from 'lucide-react'

import { AttackKey, AttackCategory } from '../../types'
import { ATTACKS } from '../../lib/constants/attacks'
import { CATEGORIES } from '../../lib/constants/categories'
import { useAttackTesting } from '../../lib/hooks/useAttackTesting'
import { 
  filterAttacksByCategory, 
  getSeverityColor, 
  getSeverityBadgeColor,
  getResultBorderColor,
  getResultTextColor
} from '../../lib/utils/attackHelpers'

import { UI_CONFIG, APP_INFO } from '../../lib/constants/constants'

export default function FortressDemo() {
  const [selectedCategory, setSelectedCategory] = useState<AttackCategory | 'all'>('all')
  
  const {
    selectedAttack,
    setSelectedAttack,
    testResult,
    loading,
    testHistory,
    simulateAttack,
  } = useAttackTesting()

  const currentAttack = ATTACKS[selectedAttack]
  const CurrentIcon = currentAttack.icon
  const filteredAttacks = filterAttacksByCategory(ATTACKS, selectedCategory)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header - UPDATED: Using Tailwind config colors */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Shield className="w-10 h-10 md:w-12 md:h-12 text-primary-400" />
            <h1 className="text-4xl md:text-5xl font-bold text-white font-sans">
              {APP_INFO.NAME}
            </h1>
          </div>
          <p className="text-lg md:text-xl text-primary-200 mb-4">
            {APP_INFO.DESCRIPTION}
          </p>
          {/* UPDATED: Using design system classes */}
          <div className="inline-flex items-center gap-2 px-4 py-2 glass-effect rounded-full">
            <CheckCircle2 className="w-5 h-5 text-success" />
            <span className="text-success-light font-medium">
              Active Protection
            </span>
          </div>

          {/* Category Filters - UPDATED: Using Tailwind config */}
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg 
                    transition-all duration-[var(--transition-base)]
                    ${
                      selectedCategory === cat.id
                        ? 'bg-primary-500/30 border border-primary-400 text-white shadow-glow-blue'
                        : 'bg-dark-bg-secondary/50 border border-dark-border-primary text-dark-text-secondary hover:bg-dark-bg-tertiary/50'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{cat.name}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Attack List Panel - UPDATED */}
          <div className="glass-effect rounded-2xl p-6 animate-slide-up">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Activity className="w-6 h-6 text-danger" />
              Threat Vectors ({filteredAttacks.length})
            </h2>

            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
              {filteredAttacks.map(([key, attack]) => {
                const AttackIcon = attack.icon
                const attackKey = key as AttackKey
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedAttack(attackKey)}
                    className={`
                      w-full text-left p-3 rounded-xl 
                      transition-all duration-[var(--transition-base)]
                      card-hover
                      ${
                        selectedAttack === key
                          ? 'bg-primary-500/30 border-2 border-primary-400 shadow-glow-blue'
                          : 'bg-dark-bg-secondary/30 border-2 border-transparent hover:bg-dark-bg-tertiary/50'
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
              })}
            </div>
          </div>

          <div className="space-y-6">
            {/* Payload Inspection Panel - UPDATED */}
            <div className="glass-effect rounded-2xl p-6 animate-slide-up">
              <div className="flex items-center gap-3 mb-4">
                <CurrentIcon className="w-6 h-6 text-primary-400" />
                <h2 className="text-xl font-bold text-white">
                  Payload Inspection
                </h2>
              </div>

              <div className="bg-black/40 rounded-xl p-4 border border-dark-border-primary overflow-x-auto">
                <pre className="text-xs text-danger-light font-mono">
                  {JSON.stringify(currentAttack.payload, null, 2)}
                </pre>
              </div>

              <button
                onClick={() => simulateAttack(selectedAttack)}
                disabled={loading}
                className={`
                  w-full mt-6 
                  bg-gradient-to-r from-danger to-pink-600 
                  hover:from-danger-dark hover:to-pink-700 
                  disabled:from-gray-700 disabled:to-gray-800 
                  text-white font-bold py-4 rounded-xl 
                  transition-all duration-[var(--transition-base)]
                  shadow-lg hover:shadow-glow-red
                  disabled:cursor-not-allowed
                `}
              >
                {loading ? 'Testing...' : '🔥 Test Firewall Logic'}
              </button>
            </div>

            {/* Test Result Panel - UPDATED */}
            {testResult && (
              <div className="glass-effect rounded-2xl p-6 animate-slide-up">
                <div className="flex items-center gap-3 mb-4">
                  {testResult.blocked ? (
                    <Shield className="w-6 h-6 text-success" />
                  ) : (
                    <XCircle className="w-6 h-6 text-danger" />
                  )}
                  <h2 className="text-xl font-bold text-white">Result</h2>
                </div>

                <div
                  className={`border rounded-xl p-4 mb-4 ${getResultBorderColor(testResult.blocked)}`}
                >
                  <span className={`font-bold ${getResultTextColor(testResult.blocked)}`}>
                    {testResult.message}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                  <div className="bg-black/30 p-3 rounded-lg">
                    <span className="text-dark-text-tertiary block mb-1 text-2xs">
                      RULE
                    </span>
                    <span className="text-primary-300">
                      {testResult.details.rule}
                    </span>
                  </div>
                  <div className="bg-black/30 p-3 rounded-lg">
                    <span className="text-dark-text-tertiary block mb-1 text-2xs">
                      STATUS
                    </span>
                    <span className="text-white">
                      {testResult.responseStatus}
                    </span>
                  </div>
                  <div className="bg-black/30 p-3 rounded-lg">
                    <span className="text-dark-text-tertiary block mb-1 text-2xs">
                      CONFIDENCE
                    </span>
                    <span className="text-white">
                      {testResult.details.confidence * 100}%
                    </span>
                  </div>
                  <div className="bg-black/30 p-3 rounded-lg">
                    <span className="text-dark-text-tertiary block mb-1 text-2xs">
                      TIME
                    </span>
                    <span className="text-white">
                      {testResult.details.timestamp}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Test History Panel - UPDATED */}
            {testHistory.length > 0 && (
              <div className="glass-effect rounded-2xl p-6 animate-fade-in">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-warning" />
                  History ({testHistory.length}/{UI_CONFIG.MAX_HISTORY_ITEMS})
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {testHistory.map((result, idx) => (
                    <div
                      key={idx}
                      className="bg-black/20 rounded-lg p-3 text-xs hover:bg-black/30 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-white font-medium">
                          {result.attack}
                        </span>
                        {result.blocked ? (
                          <CheckCircle2 className="w-4 h-4 text-success" />
                        ) : (
                          <XCircle className="w-4 h-4 text-danger" />
                        )}
                      </div>
                      <div className="flex justify-between text-dark-text-secondary">
                        <span>{result.details.timestamp}</span>
                        <span>{result.responseStatus}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer - UPDATED */}
        <footer className="mt-12 text-center text-slate-500 text-xs font-mono animate-fade-in">
          <p>
            {APP_INFO.NAME} v{APP_INFO.VERSION} •{' '}
            {testHistory.filter((t) => t.blocked).length}/{testHistory.length}{' '}
            blocked
          </p>
        </footer>
      </div>
    </div>
  )
}