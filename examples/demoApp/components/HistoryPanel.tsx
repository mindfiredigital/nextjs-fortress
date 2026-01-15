// components/HistoryPanel.tsx
import { Activity, CheckCircle2, XCircle } from 'lucide-react'
import { HistoryPanelProps } from '../types'
import { UI_LABELS, UI_CONFIG } from '../lib/constants'

export function HistoryPanel({ history }: HistoryPanelProps) {
  if (history.length === 0) return null

  return (
    <div className="glass-effect rounded-xl p-6 animate-fade-in shadow-professional-lg">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <Activity className="w-5 h-5 text-red-700" />
        {UI_LABELS.HISTORY_TITLE} ({history.length}/{UI_CONFIG.MAX_HISTORY_ITEMS})
      </h3>
      <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
        {history.map((result, idx) => (
          <div
            key={idx}
            className="bg-black/30 rounded-lg p-3 border border-zinc-800/30 hover:bg-black/40 transition-colors cursor-default"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-white font-medium text-xs">
                {result.attack}
              </span>
              {result.blocked ? (
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              ) : (
                <XCircle className="w-4 h-4 text-red-500" />
              )}
            </div>
            <div className="flex justify-between text-xs text-gray-400">
              <span>{result.details.timestamp}</span>
              <span className="font-mono font-medium">{result.responseStatus}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}