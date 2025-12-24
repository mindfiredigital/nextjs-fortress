// components/PayloadPanel.tsx
import { LucideIcon } from 'lucide-react'
import { PayloadPanelProps } from '../types'
import { UI_LABELS, APP_INFO } from '../lib/constants/constants'

export function PayloadPanel({ attack, loading, onTest }: PayloadPanelProps) {
  const AttackIcon = attack.icon as LucideIcon

  return (
    <div className="glass-effect rounded-2xl p-6 animate-slide-up">
      <div className="flex items-center gap-3 mb-4">
        <AttackIcon className="w-6 h-6 text-primary-400" />
        <h2 className="text-xl font-bold text-white">
          {UI_LABELS.PAYLOAD_INSPECTION}
        </h2>
      </div>

      <div className="bg-black/40 rounded-xl p-4 border border-dark-border-primary overflow-x-auto">
        <pre className="text-xs text-danger-light font-mono">
          {JSON.stringify(attack.payload, null, 2)}
        </pre>
      </div>

      <button
        onClick={onTest}
        disabled={loading}
        className={`
          w-full mt-6 
          bg-gradient-to-r from-danger to-pink-600 
          hover:from-danger-dark hover:to-pink-700 
          disabled:from-gray-700 disabled:to-gray-800 
          text-white font-bold py-4 rounded-xl 
          transition-all duration-200 cursor-pointer
          shadow-lg hover:shadow-glow-red
          disabled:cursor-not-allowed disabled:opacity-50
          hover:scale-[1.02] active:scale-[0.98]
          disabled:hover:scale-100
        `}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            {UI_LABELS.TESTING_BUTTON}
          </span>
        ) : (
          APP_INFO.TEST
        )}
      </button>
    </div>
  )
}