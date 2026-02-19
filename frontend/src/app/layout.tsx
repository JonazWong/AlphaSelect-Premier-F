import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import ClientLayout from './ClientLayout'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AlphaSelect Premier F - MEXC AI Trading Platform',
  description: 'AI-driven cryptocurrency analysis monitoring platform for MEXC contract trading',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-TW">
      <body className={`${inter.className} bg-background text-white min-h-screen`}>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  )
}
