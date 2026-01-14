// components/Header.tsx
import { Shield, CheckCircle2, FlaskConical } from 'lucide-react' // Added FlaskConical [cite: 46]
import Link from 'next/link'
import { APP_INFO, UI_LABELS } from '../lib/constants'

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
      
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 glass-effect rounded-full">
          <CheckCircle2 className="w-5 h-5 text-success" />
          <span className="text-success-light font-medium">
            {UI_LABELS.ACTIVE_PROTECTION}
          </span>
        </div>

        <Link 
          href="/testSelective"
          className="inline-flex items-center gap-2 px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-full transition-all duration-200 shadow-lg hover:shadow-glow-blue cursor-pointer"
        >
          <FlaskConical className="w-4 h-4" />
          {APP_INFO.CUSTOM}
        </Link>
      </div>
    </div>
  )
}