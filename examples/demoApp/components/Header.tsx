// components/Header.tsx
import { Shield, CheckCircle2 } from 'lucide-react'
import { APP_INFO, UI_LABELS } from '../lib/constants/constants'

export function Header() {
  return (
    <div className="text-center mb-8 animate-fade-in">
      <div className="flex items-center justify-center gap-3 mb-4">
        <Shield className="w-10 h-10 md:w-12 md:h-12 text-primary-400" />
        <h1 className="text-4xl md:text-5xl font-bold text-white font-sans">
          {APP_INFO.NAME}
        </h1>
      </div>
      <p className="text-lg md:text-xl text-primary-200 mb-4">
        {APP_INFO.DESCRIPTION}
      </p>
      <div className="inline-flex items-center gap-2 px-4 py-2 glass-effect rounded-full">
        <CheckCircle2 className="w-5 h-5 text-success" />
        <span className="text-success-light font-medium">
          {UI_LABELS.ACTIVE_PROTECTION}
        </span>
      </div>
    </div>
  )
}