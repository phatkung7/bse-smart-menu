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
}

const LEVEL_LABELS = {
  high: { text: 'สูง', color: '#28a745', bg: '#d4edda', emoji: '🟢' },
  medium: { text: 'ปานกลาง', color: '#856404', bg: '#fff3cd', emoji: '🟡' },
  low: { text: 'ต่ำ', color: '#721c24', bg: '#f8d7da', emoji: '🔴' },
}

export default function ProfileTab({ displayName, pictureUrl, latestResult }: ProfileTabProps) {
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
          <p className="profile-identity-label">ชื่อผู้ใช้ LINE</p>
          <p className="profile-identity-name">{displayName}</p>
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
              <span
                className="quiz-level-badge"
                style={{
                  backgroundColor: LEVEL_LABELS[latestResult.literacy_level].bg,
                  color: LEVEL_LABELS[latestResult.literacy_level].color,
                }}
              >
                {LEVEL_LABELS[latestResult.literacy_level].emoji}{' '}
                {LEVEL_LABELS[latestResult.literacy_level].text}
              </span>
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
