'use client'

import { AlertTriangle } from 'lucide-react'

export default function AppointmentPage() {
  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="profile-header-logo">
          <img src="/logo-bse.png" alt="BSE" style={{ height: '40px', width: 'auto', objectFit: 'contain', borderRadius: '8px', backgroundColor: 'white' }} />
        </div>
        <h1 className="profile-header-title">นัดหมายแพทย์และแจ้งเตือน</h1>
      </div>

      <div className="profile-content" style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center' }}>
        <AlertTriangle size={64} color="var(--primary)" strokeWidth={1.5} style={{ marginBottom: '16px' }} />
        <h2 style={{ color: 'var(--text-primary)', marginBottom: '8px', fontSize: '1.4rem' }}>ปิดปรับปรุงชั่วคราว</h2>
        <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>ฟีเจอร์นัดหมายแพทย์และการแจ้งเตือนกำลังอยู่ระหว่างการปรับปรุง ขออภัยในความไม่สะดวกครับ</p>
      </div>
    </div>
  )
}
