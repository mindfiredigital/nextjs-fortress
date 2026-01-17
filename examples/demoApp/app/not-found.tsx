'use client'

import Link from 'next/link'
import { Shield, Home, ArrowLeft } from 'lucide-react'
import {NOT_FOUND_PAGE} from "../lib/constants"
import { useRouter } from 'next/navigation'

export default function NotFound() {
  const router = useRouter()
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center">
        {/* Animated Shield Icon */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <Shield className="w-24 h-24 text-primary-400 animate-pulse-slow" />
            <div className="absolute inset-0 bg-primary-400/20 rounded-full blur-2xl animate-pulse-slow"></div>
          </div>
        </div>

        {/* Error Message */}
        <div className="bg-dark-bg-secondary/50 backdrop-blur-sm border border-dark-border-primary rounded-2xl p-8 shadow-2xl">
          <h1 className="text-6xl font-bold text-white mb-4">{NOT_FOUND_PAGE.NOT_FOUND}</h1>
          <h2 className="text-2xl font-semibold text-primary-300 mb-4">
            {NOT_FOUND_PAGE.ROUTE_NOT_FOUND}
          </h2>
          <p className="text-dark-text-secondary mb-8 text-lg">
            {NOT_FOUND_PAGE.PAGE_DOES_NOT_EXIST}
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-glow-blue cursor-pointer"
            >
              <Home className="w-5 h-5" />
              {NOT_FOUND_PAGE.GO_HOME}
            </Link>
            
            <button
              onClick={() => router.back()}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-dark-bg-tertiary hover:bg-dark-bg-secondary border border-dark-border-primary text-white font-semibold rounded-xl transition-all duration-200 cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
              {NOT_FOUND_PAGE.GO_BACK}
            </button>
          </div>

          {/* Info Section */}
          <div className="mt-8 pt-8 border-t border-dark-border-primary">
            <p className="text-sm text-dark-text-tertiary">
              Protected by{' '}
              <span className="text-primary-400 font-semibold">{NOT_FOUND_PAGE.FORTRESS}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}