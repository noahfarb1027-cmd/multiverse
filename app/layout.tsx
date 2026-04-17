import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Multiverse Fantasy',
  description: 'The ultimate multi-sport fantasy platform — MLB, NFL, NBA, NHL in one league.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
