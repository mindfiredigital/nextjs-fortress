// components/SelectiveHeader.tsx
import { Shield, Activity, Home } from 'lucide-react' // Added Home icon 
import Link from 'next/link'
import { APP_INFO } from '@/lib/constants'

export function SelectiveHeader() {
  return (
    <div className="text-center mb-8 animate-fade-in">
      <div className="flex items-center justify-center gap-3 mb-4">
        <Shield className="w-12 h-12 text-primary-400" />
        <h1 className="text-4xl md:text-5xl font-bold text-white">
          {APP_INFO.SELECT_MIDDLEWARE}
        </h1>
      </div>
      <p className="text-xl text-primary-200 mb-4">
        {APP_INFO.TEST_PATH_SPECIFIC}
      </p>
      
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 glass-effect rounded-full">
          <Activity className="w-5 h-5 text-warning" />
          <span className="text-warning-light font-medium">
            {APP_INFO.TESTING_MODE}
          </span>
        </div>

        {/* Navigation Button back to Home */}
        <Link 
          href="/"
          className="inline-flex items-center gap-2 px-6 py-2 bg-dark-bg-tertiary hover:bg-dark-bg-secondary border border-dark-border-primary text-white font-semibold rounded-full transition-all duration-200 cursor-pointer"
        >
          <Home className="w-4 h-4" />
          {APP_INFO.RETURN_HOME}
        </Link>
      </div>
    </div>
  )
}