// components/PayloadPanel.tsx
import { Code } from 'lucide-react'
import { PayloadPanelProps } from '../types'
import { UI_LABELS, APP_INFO } from '../lib/constants'

export function PayloadPanel({ attack, loading, onTest }: PayloadPanelProps) {
  return (
    <div className="glass-effect rounded-xl p-6 animate-slide-up shadow-professional-lg">
      <div className="flex items-center gap-2 mb-4">
        <Code className="w-5 h-5 text-red-700" />
        <h2 className="text-xl font-semibold text-white">
          {UI_LABELS.PAYLOAD_INSPECTION}
        </h2>
      </div>

      <div className="bg-black/50 rounded-lg p-4 border border-zinc-800/50 overflow-x-auto mb-5">
        <pre className="text-xs text-gray-300 font-mono leading-relaxed">
          {JSON.stringify(attack.payload, null, 2)}
        </pre>
      </div>

      <button
        onClick={onTest}
        disabled={loading}
        className={`
          w-full py-3 rounded-lg font-semibold text-sm
          transition-all duration-200 cursor-pointer border
          ${
            loading
              ? 'bg-zinc-800/50 border-zinc-700/50 text-gray-500 cursor-not-allowed'
              : 'bg-red-900/30 border-red-800/50 text-red-300 hover:bg-red-900/40 hover:border-red-700/60 hover:text-red-200'
          }
        `}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-gray-500/30 border-t-gray-500 rounded-full animate-spin"></div>
            {UI_LABELS.TESTING_BUTTON}
          </span>
        ) : (
          APP_INFO.TEST
        )}
      </button>
    </div>
  )
}