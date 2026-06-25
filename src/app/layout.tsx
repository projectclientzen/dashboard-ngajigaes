import type { Metadata } from 'next'
import { Inter, Bitter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const bitter = Bitter({ subsets: ['latin'], weight: ['600', '700'], variable: '--font-bitter' })

export const metadata: Metadata = {
  title: 'NgajiGaes Dashboard',
  description: 'Dashboard performa tim NgajiGaes',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${inter.variable} ${bitter.variable}`}>
      <body className="font-sans antialiased bg-[#F4EFDF] text-[#2B2A24]">
        {children}
      </body>
    </html>
  )
}
