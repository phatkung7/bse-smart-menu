'use client'

import { TOTAL_QUESTIONS } from '@/data/questions'

interface UserProfile {
  userId: string
  displayName: string
  pictureUrl?: string
}

interface IntroScreenProps {
  profile: UserProfile
  onStart: () => void
}

import { ClipboardList, Clock, BarChart2, ShieldCheck, HeartPulse, Rocket } from 'lucide-react'

/**
 * Intro Screen — แนะนำแบบสอบถามก่อนเริ่ม
 */
export default function IntroScreen({ profile, onStart }: IntroScreenProps) {
  return (
    <div className="intro-screen">
      {/* Header */}
      <div className="intro-header">
        <div className="ribbon-logo flex justify-center">
          <img src="/logo-bse.png" alt="BSE Logo" style={{ height: '140px', width: 'auto', objectFit: 'contain', borderRadius: '24px', backgroundColor: 'white' }} />
        </div>
        <p className="intro-subtitle" style={{ marginTop: '4px' }}>ระบบความรอบรู้ด้านสุขภาพดิจิทัล</p>
      </div>

      {/* User greeting */}
      <div className="intro-greeting">
        {profile.pictureUrl && (
          <img
            src={profile.pictureUrl}
            alt={profile.displayName}
            className="user-avatar"
          />
        )}
        <p className="greeting-text">
          สวัสดีคุณ <strong>{profile.displayName}</strong> 👋
        </p>
      </div>

      {/* Info cards */}
      <div className="intro-content">
        <div className="info-card">
          <div className="info-card-title flex items-center gap-2">
            <ClipboardList size={20} className="text-primary-dark" />
            เกี่ยวกับการประเมิน
          </div>
          <p className="info-card-text">
            แบบสอบถามนี้จะประเมินระดับความรอบรู้ด้านสุขภาพดิจิทัลของคุณ
            เกี่ยวกับมะเร็งเต้านมและการตรวจเต้านมด้วยตนเอง
          </p>
        </div>

        <div className="info-items">
          <div className="info-item">
            <span className="info-icon text-primary"><ClipboardList size={24} /></span>
            <div>
              <span className="info-label">จำนวนข้อ</span>
              <span className="info-value">{TOTAL_QUESTIONS} ข้อ</span>
            </div>
          </div>
          <div className="info-item">
            <span className="info-icon text-primary"><Clock size={24} /></span>
            <div>
              <span className="info-label">เวลาโดยประมาณ</span>
              <span className="info-value">5–7 นาที</span>
            </div>
          </div>
          <div className="info-item">
            <span className="info-icon text-primary"><BarChart2 size={24} /></span>
            <div>
              <span className="info-label">การประเมิน</span>
              <span className="info-value">3 ระดับ (ต่ำ / ปานกลาง / สูง)</span>
            </div>
          </div>
          <div className="info-item">
            <span className="info-icon text-primary"><ShieldCheck size={24} /></span>
            <div>
              <span className="info-label">ความเป็นส่วนตัว</span>
              <span className="info-value">ข้อมูลเก็บเป็นความลับ</span>
            </div>
          </div>
        </div>

        <div className="info-note">
          <p>
            <strong>คำชี้แจง:</strong> โปรดตอบตามความเป็นจริง
            ไม่มีคำตอบถูกหรือผิด ผลลัพธ์จะช่วยให้คุณเข้าใจระดับ
            ความรอบรู้ด้านสุขภาพดิจิทัลของตนเอง
          </p>
        </div>
      </div>

      {/* Start button */}
      <div className="intro-footer">
        <button
          id="btn-start-quiz"
          className="btn btn-primary btn-large flex items-center justify-center gap-2"
          onClick={onStart}
        >
          <Rocket size={20} />
          เริ่มทำแบบสอบถาม
        </button>
      </div>
    </div>
  )
}
