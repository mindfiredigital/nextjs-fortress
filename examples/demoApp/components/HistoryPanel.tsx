// components/HistoryPanel.tsx
import { Activity, CheckCircle2, XCircle } from 'lucide-react'
import { HistoryPanelProps } from '../types'
import { UI_LABELS, UI_CONFIG } from '../lib/constants'

export function HistoryPanel({ history }: HistoryPanelProps) {
  if (history.length === 0) return null

  return (
    <div className="glass-effect rounded-2xl p-6 animate-fade-in">
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <Activity className="w-5 h-5 text-warning" />
        {UI_LABELS.HISTORY_TITLE} ({history.length}/{UI_CONFIG.MAX_HISTORY_ITEMS})
      </h3>
      <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-primary-500/50 scrollbar-track-transparent">
        {history.map((result, idx) => (
          <div
            key={idx}
            className="bg-black/20 rounded-lg p-3 text-xs hover:bg-black/30 transition-colors cursor-default"
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
  )
}