// components/ResultPanel.tsx
import { Shield, XCircle, X } from 'lucide-react'
import { ResultPanelProps } from '../types'
import { UI_LABELS, APP_INFO } from '../lib/constants'
import { getResultBorderColor, getResultTextColor } from '../lib/utils/attackHelpers'

export function ResultPanel({ result, onClear }: ResultPanelProps) {
  return (
    <div className="glass-effect rounded-xl p-6 animate-slide-up shadow-professional-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {result.blocked ? (
            <Shield className="w-5 h-5 text-green-500" />
          ) : (
            <XCircle className="w-5 h-5 text-red-500" />
          )}
          <h2 className="text-xl font-semibold text-white">{UI_LABELS.RESULT_TITLE}</h2>
        </div>
        <button
          onClick={onClear}
          className="p-1.5 rounded-lg bg-zinc-800/50 hover:bg-zinc-700/50 text-gray-400 hover:text-gray-300 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div
        className={`border rounded-lg p-4 mb-5 ${getResultBorderColor(result.blocked)}`}
      >
        <span className={`font-medium text-sm ${getResultTextColor(result.blocked)}`}>
          {result.message}
        </span>
      </div>

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
          <span className="text-white font-mono font-semibold">
            {result.responseStatus}
          </span>
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
    </div>
  )
}