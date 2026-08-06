import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'BSE-Smart — ระบบความรอบรู้ด้านสุขภาพดิจิทัล',
  description:
    'แบบสอบถามความรอบรู้ด้านสุขภาพดิจิทัลเกี่ยวกับมะเร็งเต้านมและการตรวจเต้านมด้วยตนเอง',
}

/**
 * LIFF Layout — Full screen, no navigation bar
 * เหมาะสำหรับ LINE's WebView
 */
export default function LiffLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="liff-root">
      {children}
    </div>
  )
}
