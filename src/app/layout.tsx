import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'BSE-Smart-Menu',
  description: 'ระบบความรอบรู้ด้านสุขภาพดิจิทัลเกี่ยวกับมะเร็งเต้านมและการตรวจเต้านมด้วยตนเอง',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  )
}
