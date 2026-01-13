import { Shield, Activity } from 'lucide-react'

export function SelectiveHeader() {
  return (
    <div className="text-center mb-8 animate-fade-in">
      <div className="flex items-center justify-center gap-3 mb-4">
        <Shield className="w-12 h-12 text-primary-400" />
        <h1 className="text-4xl md:text-5xl font-bold text-white">
          Selective Middleware Test
        </h1>
      </div>
      <p className="text-xl text-primary-200 mb-4">
        Test path-specific Fortress protection
      </p>
      <div className="inline-flex items-center gap-2 px-4 py-2 glass-effect rounded-full">
        <Activity className="w-5 h-5 text-warning" />
        <span className="text-warning-light font-medium">
          Testing Mode Active
        </span>
      </div>
    </div>
  )
}