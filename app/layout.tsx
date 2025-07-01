import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Zarcero',
  description: 'Nicolás Zarcero\'s Portfolio',
  openGraph: {
    title: 'Zarcero',
    description: 'Nicolás Zarcero\'s Portfolio',
    url: 'https://zarcero.com',
    siteName: 'Zarcero',
    locale: 'en_US',
    type: 'website',
  },
  themeColor: '#000000',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
