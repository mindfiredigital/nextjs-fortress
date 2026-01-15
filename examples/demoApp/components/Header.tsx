// components/Header.tsx
import { Shield, CheckCircle2, FlaskConical } from 'lucide-react'
import Link from 'next/link'
import { APP_INFO, UI_LABELS } from '../lib/constants'

export function Header() {
  return (
    <div className="text-center mb-12 animate-fade-in">
      <div className="flex items-center justify-center gap-4 mb-6">
        <Shield className="w-12 h-12 text-red-700" />
        <h1 className="text-5xl md:text-6xl font-bold text-white font-sans tracking-tight">
          {APP_INFO.NAME}
        </h1>
      </div>
      <p className="text-lg md:text-xl text-gray-300 mb-8 font-normal">
        {APP_INFO.DESCRIPTION}
      </p>
      
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-zinc-900/60 border border-green-800/30 rounded-lg backdrop-blur-sm">
          <CheckCircle2 className="w-5 h-5 text-green-500" />
          <span className="text-green-400 font-medium text-sm">
            {UI_LABELS.ACTIVE_PROTECTION}
          </span>
        </div>

        <Link 
          href="/testSelective"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-900/20 hover:bg-red-900/30 border border-red-800/40 hover:border-red-700/60 text-red-300 hover:text-red-200 font-medium rounded-lg transition-all duration-200 cursor-pointer"
        >
          <FlaskConical className="w-4 h-4" />
          {APP_INFO.CUSTOM}
        </Link>
      </div>
    </div>
  )
}