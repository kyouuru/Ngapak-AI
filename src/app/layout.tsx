import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Ngapak AI - Asisten AI saka Banyumas',
  description: 'Ngapak AI iku asisten AI sing pinter lan ramah, nganggo dialek Banyumas sing khas. Takon apa bae, inyong siap mbantu!',
  keywords: ['AI', 'chatbot', 'Banyumas', 'Ngapak', 'asisten AI', 'Indonesia'],
  authors: [{ name: 'Ngapak AI' }],
  openGraph: {
    title: 'Ngapak AI',
    description: 'Asisten AI saka tlatah Banyumas',
    type: 'website',
  },
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id" className="h-full">
      <body className="h-full antialiased">{children}</body>
    </html>
  )
}
