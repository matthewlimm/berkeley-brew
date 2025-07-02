import { AuthProvider } from '@/contexts/AuthContext'
import { BookmarkProvider } from '@/contexts/BookmarkContext'
import './globals.css'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
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
