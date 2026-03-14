import type { Metadata } from 'next'
export const metadata: Metadata = {
  title: 'MCI: The Thin Line Exhibition',
  description: 'Experience & Observe',
}
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body style={{ margin: 0, padding: 0, fontFamily: 'sans-serif' }}>
        {children}
      </body>
    </html>
  )
}
