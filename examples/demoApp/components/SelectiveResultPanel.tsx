// components/SelectiveResultPanel.tsx
import { Shield, XCircle, CheckCircle2, X } from 'lucide-react'
import { SelectiveResultPanelProps } from '@/types'
import { getTestStatus } from '@/lib/utils/attackHelpers'
import { getResultBorderColor, getResultTextColor } from '@/lib/utils/attackHelpers'
import { APP_INFO } from '@/lib/constants'

export function SelectiveResultPanel({ 
  result, 
  selectedAttack, 
  onClear 
}: SelectiveResultPanelProps) {
  const testStatus = getTestStatus(selectedAttack, result.responseStatus)

  return (
    <div className="glass-effect rounded-xl p-6 animate-slide-up shadow-professional-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {result.blocked ? (
            <Shield className="w-5 h-5 text-green-500" />
          ) : (
            <XCircle className="w-5 h-5 text-red-500" />
          )}
          <h2 className="text-xl font-semibold text-white">{APP_INFO.TEST_RESULT}</h2>
        </div>
        <button
          onClick={onClear}
          className="p-1.5 rounded-lg bg-zinc-800/50 hover:bg-zinc-700/50 text-gray-400 hover:text-gray-300 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Result Status */}
      <div className={`border rounded-lg p-4 mb-4 ${getResultBorderColor(result.blocked)}`}>
        <span className={`font-medium text-sm ${getResultTextColor(result.blocked)}`}>
          {result.message}
        </span>
      </div>

      {/* Test Validation - UNIQUE TO SELECTIVE TESTING */}
      <div
        className={`p-3.5 rounded-lg mb-4 flex items-center gap-3 border ${
          testStatus === 'pass'
            ? 'bg-green-950/20 border-green-800/30'
            : 'bg-yellow-950/20 border-yellow-800/30'
        }`}
      >
        {testStatus === 'pass' ? (
          <>
            <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
            <div>
              <div className="font-semibold text-green-300 text-sm">
                {APP_INFO.TEST_PASSED}
              </div>
              <div className="text-xs text-green-400/80 mt-0.5">
                {APP_INFO.BEHAVIOUR_MATCHES}
              </div>
            </div>
          </>
        ) : (
          <>
            <XCircle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
            <div>
              <div className="font-semibold text-yellow-300 text-sm">
                {APP_INFO.UNEXPECTED_RESULT}
              </div>
              <div className="text-xs text-yellow-400/80 mt-0.5">
                {APP_INFO.CHECK_MID_CONFIG}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="bg-black/30 p-3 rounded-lg border border-zinc-800/30">
          <span className="text-gray-500 block mb-1 text-xs font-medium uppercase tracking-wider">
            {APP_INFO.RULE}
          </span>
          <span className="text-gray-300 font-mono text-xs">
            {result.details.rule}
          </span>
        </div>
        <div className="bg-black/30 p-3 rounded-lg border border-zinc-800/30">
          <span className="text-gray-500 block mb-1 text-xs font-medium uppercase tracking-wider">
            {APP_INFO.STATUS}
          </span>
          <span className="text-white font-mono font-semibold">{result.responseStatus}</span>
        </div>
        <div className="bg-black/30 p-3 rounded-lg border border-zinc-800/30">
          <span className="text-gray-500 block mb-1 text-xs font-medium uppercase tracking-wider">
            {APP_INFO.CONFIDENCE}
          </span>
          <span className="text-white font-mono font-semibold">
            {result.details.confidence * 100}%
          </span>
        </div>
        <div className="bg-black/30 p-3 rounded-lg border border-zinc-800/30">
          <span className="text-gray-500 block mb-1 text-xs font-medium uppercase tracking-wider">
            {APP_INFO.TIME}
          </span>
          <span className="text-gray-300 font-mono text-xs">
            {result.details.timestamp}
          </span>
        </div>
      </div>

      <div className="bg-black/30 p-3 rounded-lg border border-zinc-800/30 mt-3">
        <span className="text-gray-500 block mb-1 text-xs font-medium uppercase tracking-wider">
          {APP_INFO.ACTION}
        </span>
        <span className="text-gray-300 text-xs">
          {result.details.action}
        </span>
      </div>
    </div>
  )
}