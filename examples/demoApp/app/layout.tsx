import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
})

/**
 * Application metadata configuration
 * Includes SEO optimization and social media tags
 */
export const metadata: Metadata = {
  // Basic metadata
  title: {
    default: 'nextjs-fortress | Security Validation Framework',
    template: '%s | nextjs-fortress',
  },
  description:
    'A high-performance, developer-first security middleware for Next.js that protects against CVE-2025-55182, SQL injection, XSS, CSRF, and more.',
  keywords: [
    'nextjs',
    'security',
    'middleware',
    'firewall',
    'validation',
    'CVE-2025-55182',
    'SQL injection',
    'XSS protection',
    'CSRF protection',
    'rate limiting',
    'penetration testing',
    'web security',
    'Next.js security',
  ],
  authors: [
    {
      name: 'Mindfire Digital',
      url: 'https://github.com/lakinmindfire',
    },
  ],
  creator: 'Mindfire Digital Security Research Team',
  publisher: 'Mindfire Digital',
  
  // Open Graph metadata (Facebook, LinkedIn)
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://github.com/lakinmindfire/nextjs-fortress',
    title: 'nextjs-fortress | Security Validation Framework',
    description:
      'Protect your Next.js applications with enterprise-grade security middleware',
    siteName: 'nextjs-fortress',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'nextjs-fortress Security Framework',
      },
    ],
  },
  
  // Twitter Card metadata
  twitter: {
    card: 'summary_large_image',
    title: 'nextjs-fortress | Security Validation Framework',
    description:
      'Enterprise-grade security middleware for Next.js applications',
    images: ['/twitter-image.png'],
    creator: '@mindfiredigital',
  },
  
  // Robots configuration
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  
  // Icons
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  
  // Manifest
  manifest: '/site.webmanifest',
  
  // Additional metadata
  category: 'technology',
  applicationName: 'nextjs-fortress',
}

/**
 * Viewport configuration
 */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#3b82f6' },
    { media: '(prefers-color-scheme: dark)', color: '#1e40af' },
  ],
}

/**
 * Root layout component
 * Provides global styles, fonts, and metadata
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Additional head elements can go here */}
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        {/* Skip to main content link for accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary-600 focus:text-white focus:rounded-lg"
        >
          Skip to main content
        </a>

        <main id="main-content">{children}</main>

        {/* Analytics script placeholder */}
        {process.env.NODE_ENV === 'production' && (
          <>
            {/* Add analytics scripts here */}
          </>
        )}
      </body>
    </html>
  )
}