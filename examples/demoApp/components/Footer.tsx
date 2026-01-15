// components/Footer.tsx
import { FooterProps } from '../types'
import { APP_INFO, UI_LABELS } from '../lib/constants'

export function Footer({ history }: FooterProps) {
  const blockedCount = history.filter((t) => t.blocked).length

  return (
    <footer className="mt-12 text-center text-gray-500 text-xs font-mono animate-fade-in">
      <p>
        {APP_INFO.NAME} v{APP_INFO.VERSION} •{' '}
        {blockedCount}/{history.length}{' '}
        {UI_LABELS.STATS_BLOCKED}
      </p>
    </footer>
  )
}