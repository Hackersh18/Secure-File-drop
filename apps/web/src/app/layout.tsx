import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Secure File Drop',
  description: 'Encrypt and share files securely',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
