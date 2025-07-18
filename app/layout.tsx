import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Abberant - Trippy Side Scroller',
  description: 'A psychedelic side-scrolling platformer game built with Next.js',
  keywords: ['game', 'platformer', 'side-scroller', 'nextjs'],
  authors: [{ name: 'Abberant Team' }],
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
} 