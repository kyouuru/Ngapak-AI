import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Providers } from '@/components/Providers'

export const viewport: Viewport = {
  themeColor: '#0a0a0f',
}

export const metadata: Metadata = {
  title: 'Ngapak AI — Asisten AI saka Banyumas',
  description: 'Ngapak AI iku asisten AI sing pinter lan ramah, nganggo dialek Banyumas sing khas. Takon apa bae, inyong siap mbantu!',
  keywords: ['AI', 'chatbot', 'Banyumas', 'Ngapak', 'asisten AI', 'Indonesia', 'Claude'],
  authors: [{ name: 'Ngapak AI' }],
  openGraph: {
    title: 'Ngapak AI',
    description: 'Asisten AI saka tlatah Banyumas — Powered by Claude',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className="h-full dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="h-full antialiased bg-[#0a0a0f]">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
