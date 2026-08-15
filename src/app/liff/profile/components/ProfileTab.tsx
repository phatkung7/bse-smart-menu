'use client'

import { User, BarChart2, Award } from 'lucide-react'

interface QuizResultSummary {
  total_score: number
  literacy_level: 'low' | 'medium' | 'high'
  completed_at: string
}

interface ProfileTabProps {
  displayName: string
  pictureUrl?: string | null
  latestResult?: QuizResultSummary | null
  testerId?: string | null
}

const LEVEL_LABELS = {
  high: { text: 'ความรอบรู้ระดับสูง', bgGrad: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', glowColor: 'rgba(16, 185, 129, 0.6)', borderColor: '#047857' },
  medium: { text: 'ความรอบรู้ระดับปานกลาง', bgGrad: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', glowColor: 'rgba(245, 158, 11, 0.6)', borderColor: '#b45309' },
  low: { text: 'ความรอบรู้ระดับต่ำ', bgGrad: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)', glowColor: 'rgba(239, 68, 68, 0.6)', borderColor: '#991b1b' },
}

export default function ProfileTab({ displayName, pictureUrl, latestResult, testerId }: ProfileTabProps) {
  return (
    <div className="profile-tab-content">
      {/* ข้อมูลผู้ใช้ */}
      <div className="profile-card profile-identity-card">
        <div className="profile-avatar-wrap">
          {pictureUrl ? (
            <img src={pictureUrl} alt={displayName} className="profile-avatar" />
          ) : (
            <div className="profile-avatar-placeholder">
              <User size={40} color="#2563EB" />
            </div>
          )}
        </div>
        <div className="profile-identity-info">
          <div>
            <p className="profile-identity-label">ชื่อผู้ใช้ LINE</p>
            <p className="profile-identity-name">{displayName}</p>
          </div>
          {testerId && (
            <div style={{ marginTop: '8px' }}>
              <p className="profile-identity-label">รหัสผู้ทดสอบ</p>
              <p className="profile-identity-name" style={{ fontSize: '1.1rem', color: 'var(--primary)' }}>{testerId}</p>
            </div>
          )}
        </div>
      </div>

      {/* ผลการประเมินล่าสุด */}
      <div className="profile-card">
        <h2 className="profile-card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BarChart2 size={18} className="text-primary" style={{ flexShrink: 0 }} />
          ผลการประเมินความรอบรู้ล่าสุด
        </h2>
        {latestResult ? (
          <div className="quiz-summary-card">
            <div className="quiz-score-row">
              <span className="quiz-score-label">คะแนน</span>
              <span className="quiz-score-value">{latestResult.total_score} / 72</span>
            </div>
            <div className="quiz-level-row">
              <span className="quiz-level-label">ระดับ</span>
              <div
                className="quiz-level-badge glowing-3d-badge"
                style={{
                  '--bg-grad': LEVEL_LABELS[latestResult.literacy_level].bgGrad,
                  '--glow-color': LEVEL_LABELS[latestResult.literacy_level].glowColor,
                  '--border-color-3d': LEVEL_LABELS[latestResult.literacy_level].borderColor,
                } as React.CSSProperties}
              >
                <span className="pulse-dot"></span>
                <span className="pulse-text">{LEVEL_LABELS[latestResult.literacy_level].text}</span>
              </div>
            </div>
            <p className="quiz-completed-at">
              ประเมินเมื่อ:{' '}
              {new Date(latestResult.completed_at).toLocaleDateString('th-TH', {
                year: 'numeric', month: 'long', day: 'numeric',
              })}
            </p>
          </div>
        ) : (
          <div className="empty-state-box">
            <Award size={36} color="#ccc" />
            <p className="empty-state">ยังไม่มีผลการประเมิน</p>
            <p className="empty-state-sub">ทำแบบสอบถามเพื่อดูระดับความรอบรู้ของคุณ</p>
          </div>
        )}
      </div>
    </div>
  )
}
