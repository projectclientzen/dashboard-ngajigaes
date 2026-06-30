import type { Metadata, Viewport } from 'next'
import { Inter, Bitter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/lib/providers'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const bitter = Bitter({ subsets: ['latin'], weight: ['600', '700'], variable: '--font-bitter' })

export const metadata: Metadata = {
  title: 'NgajiGaes Dashboard',
  description: 'Dashboard performa tim NgajiGaes',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'NgajiGaes',
  },
  formatDetection: { telephone: false },
}

export const viewport: Viewport = {
  themeColor: '#7E997B',
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${inter.variable} ${bitter.variable}`}>
      <head>
        <link rel="apple-touch-icon" sizes="192x192" href="/icons/icon-192x192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="NgajiGaes" />
      </head>
      <body className="font-sans antialiased bg-[#F4EFDF] text-[#2B2A24]">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
