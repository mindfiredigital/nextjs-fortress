// components/ResultPanel.tsx
import { Shield, XCircle } from 'lucide-react'
import { ResultPanelProps } from '../types'
import { UI_LABELS } from '../lib/constants/constants'
import { getResultBorderColor, getResultTextColor } from '../lib/utils/attackHelpers'


export function ResultPanel({ result, onClear }: ResultPanelProps) {
  return (
    <div className="glass-effect rounded-2xl p-6 animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {result.blocked ? (
            <Shield className="w-6 h-6 text-success" />
          ) : (
            <XCircle className="w-6 h-6 text-danger" />
          )}
          <h2 className="text-xl font-bold text-white">{UI_LABELS.RESULT_TITLE}</h2>
        </div>
        <button
          onClick={onClear}
          className="text-xs text-dark-text-secondary hover:text-white transition-colors cursor-pointer px-3 py-1 rounded-lg hover:bg-dark-bg-tertiary/50"
        >
          {UI_LABELS.CLEAR_BUTTON}
        </button>
      </div>

      <div
        className={`border rounded-xl p-4 mb-4 ${getResultBorderColor(result.blocked)}`}
      >
        <span className={`font-bold ${getResultTextColor(result.blocked)}`}>
          {result.message}
        </span>
      </div>

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
          <span className="text-white">
            {result.responseStatus}
          </span>
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
    </div>
  )
}