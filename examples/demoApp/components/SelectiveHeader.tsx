// components/SelectiveHeader.tsx
import { Shield, Activity, Home } from 'lucide-react'
import Link from 'next/link'
import { APP_INFO } from '@/lib/constants'

export function SelectiveHeader() {
  return (
    <div className="text-center mb-12 animate-fade-in">
      <div className="flex items-center justify-center gap-4 mb-6">
        <Shield className="w-12 h-12 text-red-700" />
        <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
          {APP_INFO.SELECT_MIDDLEWARE}
        </h1>
      </div>
      <p className="text-lg md:text-xl text-gray-300 mb-8 font-normal">
        {APP_INFO.TEST_PATH_SPECIFIC}
      </p>
      
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-zinc-900/60 border border-yellow-800/30 rounded-lg backdrop-blur-sm">
          <Activity className="w-5 h-5 text-yellow-500" />
          <span className="text-yellow-400 font-medium text-sm">
            {APP_INFO.TESTING_MODE}
          </span>
        </div>

        {/* Navigation Button back to Home */}
        <Link 
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-zinc-900/40 hover:bg-zinc-800/50 border border-zinc-700/50 hover:border-zinc-600/50 text-gray-300 hover:text-white font-medium rounded-lg transition-all duration-200 cursor-pointer"
        >
          <Home className="w-4 h-4" />
          {APP_INFO.RETURN_HOME}
        </Link>
      </div>
    </div>
  )
}