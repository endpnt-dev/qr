import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'QR Code API - Generate beautiful QR codes with one API call',
  description: 'Fast, reliable QR code generation API with custom colors, logo embedding, multiple formats, and configurable error correction. Perfect for automation and integration.',
  keywords: ['qr code', 'api', 'generator', 'custom colors', 'logo embedding', 'automation'],
  authors: [{ name: 'endpnt.dev' }],
  openGraph: {
    title: 'QR Code API - Generate beautiful QR codes with one API call',
    description: 'Fast, reliable QR code generation API with custom colors, logo embedding, and multiple formats.',
    url: 'https://qr.endpnt.dev',
    siteName: 'QR Code API',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'QR Code API - Generate beautiful QR codes with one API call',
    description: 'Fast, reliable QR code generation API with custom colors, logo embedding, and multiple formats.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  )
}