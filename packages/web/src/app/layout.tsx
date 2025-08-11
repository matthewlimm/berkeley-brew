import { AuthProvider } from '@/contexts/AuthContext'
import { BookmarkProvider } from '@/contexts/BookmarkContext'
import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Berkeley Brew - Your Guide to Berkeley\'s Best Coffee',
  description: 'Discover the best coffee shops around UC Berkeley. Find study spots, read reviews, and explore Berkeley\'s vibrant coffee scene.',
  keywords: 'Berkeley coffee, UC Berkeley cafes, coffee shops, study spots, Berkeley restaurants',
  authors: [{ name: 'Berkeley Brew Team' }],
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/logo.png', type: 'image/png' }
    ],
    shortcut: '/favicon.svg',
    apple: '/logo.png'
  },
  openGraph: {
    title: 'Berkeley Brew - Your Guide to Berkeley\'s Best Coffee',
    description: 'Discover the best coffee shops around UC Berkeley. Find study spots, read reviews, and explore Berkeley\'s vibrant coffee scene.',
    type: 'website',
    locale: 'en_US',
    siteName: 'Berkeley Brew'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Berkeley Brew - Your Guide to Berkeley\'s Best Coffee',
    description: 'Discover the best coffee shops around UC Berkeley. Find study spots, read reviews, and explore Berkeley\'s vibrant coffee scene.'
  },
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#F59E0B'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="alternate icon" href="/logo.png" type="image/png" />
        <link rel="apple-touch-icon" href="/logo.png" />
      </head>
      <body>
        <AuthProvider>
          <BookmarkProvider>
            {children}
          </BookmarkProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
