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
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Shield className="w-10 h-10 md:w-12 md:h-12 text-blue-400" />
            <h1 className="text-4xl md:text-5xl font-bold text-white">
              nextjs-fortress
            </h1>
          </div>
          <p className="text-lg md:text-xl text-blue-200 mb-4">
            Security Validation Framework
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/20 rounded-full border border-blue-400/30">
            <CheckCircle2 className="w-5 h-5 text-green-400" />
            <span className="text-green-300 font-medium">
              Active Protection
            </span>
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-blue-500/30 border border-blue-400 text-white'
                      : 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{cat.name}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Attack List Panel */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Activity className="w-6 h-6 text-red-400" />
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
                    className={`w-full text-left p-3 rounded-xl transition-all ${
                      selectedAttack === key
                        ? 'bg-blue-500/30 border-2 border-blue-400'
                        : 'bg-white/5 border-2 border-transparent hover:bg-white/10'
                    }`}
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
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${getSeverityBadgeColor(attack.severity)}`}
                          >
                            {attack.severity.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-xs text-gray-300 mt-1">
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
            {/* Payload Inspection Panel */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <div className="flex items-center gap-3 mb-4">
                <CurrentIcon className="w-6 h-6 text-blue-400" />
                <h2 className="text-xl font-bold text-white">
                  Payload Inspection
                </h2>
              </div>

              <div className="bg-black/40 rounded-xl p-4 border border-white/10 overflow-x-auto">
                <pre className="text-xs text-red-300 font-mono">
                  {JSON.stringify(currentAttack.payload, null, 2)}
                </pre>
              </div>

              <button
                onClick={() => simulateAttack(selectedAttack)}
                disabled={loading}
                className="w-full mt-6 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 disabled:from-gray-700 disabled:to-gray-800 text-white font-bold py-4 rounded-xl transition-all"
              >
                {loading ? 'Testing...' : '🔥 Test Firewall Logic'}
              </button>
            </div>

            {/* Test Result Panel */}
            {testResult && (
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <div className="flex items-center gap-3 mb-4">
                  {testResult.blocked ? (
                    <Shield className="w-6 h-6 text-green-400" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-400" />
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
                    <span className="text-gray-500 block mb-1 text-[10px]">
                      RULE
                    </span>
                    <span className="text-blue-300">
                      {testResult.details.rule}
                    </span>
                  </div>
                  <div className="bg-black/30 p-3 rounded-lg">
                    <span className="text-gray-500 block mb-1 text-[10px]">
                      STATUS
                    </span>
                    <span className="text-white">
                      {testResult.responseStatus}
                    </span>
                  </div>
                  <div className="bg-black/30 p-3 rounded-lg">
                    <span className="text-gray-500 block mb-1 text-[10px]">
                      CONFIDENCE
                    </span>
                    <span className="text-white">
                      {testResult.details.confidence * 100}%
                    </span>
                  </div>
                  <div className="bg-black/30 p-3 rounded-lg">
                    <span className="text-gray-500 block mb-1 text-[10px]">
                      TIME
                    </span>
                    <span className="text-white">
                      {testResult.details.timestamp}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Test History Panel */}
            {testHistory.length > 0 && (
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-purple-400" />
                  History ({testHistory.length})
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {testHistory.map((result, idx) => (
                    <div
                      key={idx}
                      className="bg-black/20 rounded-lg p-3 text-xs"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-white font-medium">
                          {result.attack}
                        </span>
                        {result.blocked ? (
                          <CheckCircle2 className="w-4 h-4 text-green-400" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-400" />
                        )}
                      </div>
                      <div className="flex justify-between text-gray-400">
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

        {/* Footer */}
        <footer className="mt-12 text-center text-slate-500 text-xs font-mono">
          <p>
            nextjs-fortress v0.1.0 •{' '}
            {testHistory.filter((t) => t.blocked).length}/{testHistory.length}{' '}
            blocked
          </p>
        </footer>
      </div>
    </div>
  )
}