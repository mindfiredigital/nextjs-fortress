import Link from 'next/link'
import { Home, ArrowLeft, Shield } from 'lucide-react'

/**
 * 404 Not Found Page
 * Displayed when a user navigates to a non-existent route
 */
export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
      <div className="max-w-2xl w-full text-center">
        {/* Shield Icon with Animation */}
        <div className="flex justify-center mb-8 animate-fade-in">
          <div className="relative">
            <Shield className="w-24 h-24 text-blue-400 animate-pulse-slow" />
            <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl animate-pulse-slow" />
          </div>
        </div>

        {/* 404 Error Code */}
        <h1 className="text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 mb-4 animate-slide-up">
          404
        </h1>

        {/* Error Title */}
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 animate-slide-up">
          Page Not Found
        </h2>

        {/* Error Description */}
        <p className="text-lg text-blue-200 mb-8 max-w-md mx-auto animate-slide-up">
          The page you're looking for doesn't exist or has been moved to another
          location.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-slide-up">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-glow-blue"
          >
            <Home className="w-5 h-5" />
            Go Home
          </Link>

          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition-all border border-white/20"
          >
            <ArrowLeft className="w-5 h-5" />
            Go Back
          </button>
        </div>

        {/* Additional Help Links */}
        <div className="mt-12 pt-8 border-t border-white/10 animate-fade-in">
          <p className="text-sm text-gray-400 mb-4">
            Looking for something specific?
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/"
              className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
            >
              Demo Application
            </Link>
            <span className="text-gray-600">•</span>
            <a
              href="https://github.com/lakinmindfire/nextjs-fortress"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
            >
              Documentation
            </a>
            <span className="text-gray-600">•</span>
            <a
              href="https://github.com/lakinmindfire/nextjs-fortress/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
            >
              Report Issue
            </a>
          </div>
        </div>

        {/* Fun Security-Themed Message */}
        <div className="mt-8 p-4 bg-blue-500/10 rounded-xl border border-blue-400/30 animate-fade-in">
          <p className="text-sm text-blue-300">
            🛡️ <strong>Security Tip:</strong> This 404 page is also protected
            by Fortress middleware, ensuring even error pages are secure!
          </p>
        </div>
      </div>
    </div>
  )
}