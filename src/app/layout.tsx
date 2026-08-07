import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Providers } from '@/components/Providers'

export const viewport: Viewport = {
  themeColor: '#f4e6ca',
}

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXTAUTH_URL ?? 'https://ngapak-ai.vercel.app',
  ),
  title: 'Ngapak AI - AI Indonesia dengan Crypto Checkout',
  description: 'Ngapak AI adalah asisten AI Indonesia untuk coding, belajar, menulis, dan analisis file. Mulai gratis, upgrade dengan crypto EVM atau Solana.',
  keywords: ['AI', 'chatbot', 'Banyumas', 'Ngapak', 'asisten AI', 'Indonesia', 'crypto payment', 'Solana', 'EVM'],
  authors: [{ name: 'Ngapak AI' }],
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
  openGraph: {
    title: 'Ngapak AI',
    description: 'Asisten AI Indonesia dengan crypto checkout EVM dan Solana.',
    type: 'website',
    images: [{ url: '/logo.png', width: 512, height: 512, alt: 'Ngapak AI' }],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className="h-full dark" data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Calistoga&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="h-full antialiased bg-[#f4e6ca]">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
