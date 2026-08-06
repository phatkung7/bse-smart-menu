import { HeartPulse } from 'lucide-react'

export default function Home() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '16px',
        fontFamily: "'TH Sarabun PSK', 'TH Sarabun New', Sarabun, sans-serif",
        background: '#f8f9ff',
        padding: '24px',
        textAlign: 'center',
      }}
    >
      <HeartPulse size={64} color="#D63384" strokeWidth={1.5} />
      <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#D63384' }}>
        BSE-Smart
      </h1>
      <p style={{ color: '#666', fontSize: '15px', maxWidth: '300px', lineHeight: 1.6 }}>
        ระบบความรอบรู้ด้านสุขภาพดิจิทัลเกี่ยวกับมะเร็งเต้านม
        กรุณาเข้าใช้งานผ่าน LINE Official Account
      </p>
      <p style={{ color: '#aaa', fontSize: '13px' }}>
        เปิดผ่าน LINE &gt; เพิ่มเพื่อน &gt; BSE-Smart
      </p>
    </main>
  )
}
