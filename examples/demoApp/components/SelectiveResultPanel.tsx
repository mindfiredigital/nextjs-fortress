import { Shield, XCircle, CheckCircle2 } from 'lucide-react'
import { SelectiveResultPanelProps } from '@/types'
import { getTestStatus } from '@/lib/constants/selectiveAttacks'
import { getResultBorderColor, getResultTextColor } from '@/lib/utils/attackHelpers'

export function SelectiveResultPanel({ 
  result, 
  selectedAttack, 
  onClear 
}: SelectiveResultPanelProps) {
  const testStatus = getTestStatus(selectedAttack, result.responseStatus)

  return (
    <div className="glass-effect rounded-2xl p-6 animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {result.blocked ? (
            <Shield className="w-6 h-6 text-success" />
          ) : (
            <XCircle className="w-6 h-6 text-danger" />
          )}
          <h2 className="text-xl font-bold text-white">Test Result</h2>
        </div>
        <button
          onClick={onClear}
          className="text-xs text-dark-text-secondary hover:text-white transition-colors cursor-pointer px-3 py-1 rounded-lg hover:bg-dark-bg-tertiary/50"
        >
          Clear
        </button>
      </div>

      {/* Result Status */}
      <div className={`border rounded-xl p-4 mb-4 ${getResultBorderColor(result.blocked)}`}>
        <span className={`font-bold ${getResultTextColor(result.blocked)}`}>
          {result.message}
        </span>
      </div>

      {/* Test Validation - UNIQUE TO SELECTIVE TESTING */}
      <div
        className={`p-4 rounded-xl mb-4 flex items-center gap-3 ${
          testStatus === 'pass'
            ? 'bg-green-500/20 border border-green-500/40'
            : 'bg-yellow-500/20 border border-yellow-500/40'
        }`}
      >
        {testStatus === 'pass' ? (
          <>
            <CheckCircle2 className="w-6 h-6 text-green-400" />
            <div>
              <div className="font-bold text-green-300 text-sm">
                 Test Passed
              </div>
              <div className="text-xs text-green-400/80">
                Behavior matches expectations
              </div>
            </div>
          </>
        ) : (
          <>
            <XCircle className="w-6 h-6 text-yellow-400" />
            <div>
              <div className="font-bold text-yellow-300 text-sm">
                 Unexpected Result
              </div>
              <div className="text-xs text-yellow-400/80">
                Check middleware configuration
              </div>
            </div>
          </>
        )}
      </div>

      {/* Details Grid - Reusing same structure as ResultPanel */}
      <div className="grid grid-cols-2 gap-3 text-xs font-mono">
        <div className="bg-black/30 p-3 rounded-lg">
          <span className="text-dark-text-tertiary block mb-1 text-2xs">
            RULE
          </span>
          <span className="text-primary-300">
            {result.details.rule}
          </span>
        </div>
        <div className="bg-black/30 p-3 rounded-lg">
          <span className="text-dark-text-tertiary block mb-1 text-2xs">
            STATUS
          </span>
          <span className="text-white">{result.responseStatus}</span>
        </div>
        <div className="bg-black/30 p-3 rounded-lg">
          <span className="text-dark-text-tertiary block mb-1 text-2xs">
            CONFIDENCE
          </span>
          <span className="text-white">
            {result.details.confidence * 100}%
          </span>
        </div>
        <div className="bg-black/30 p-3 rounded-lg">
          <span className="text-dark-text-tertiary block mb-1 text-2xs">
            TIME
          </span>
          <span className="text-white">
            {result.details.timestamp}
          </span>
        </div>
      </div>

      <div className="bg-black/30 p-3 rounded-lg mt-3">
        <span className="text-dark-text-tertiary block mb-1 text-2xs">
          ACTION
        </span>
        <span className="text-white text-xs">
          {result.details.action}
        </span>
      </div>
    </div>
  )
}