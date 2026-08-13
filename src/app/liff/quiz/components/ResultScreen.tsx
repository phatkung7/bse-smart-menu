'use client'

import { useEffect, useState } from 'react'
import type Liff from '@line/liff'
import { calculateScorePercentage, type QuizResult } from '@/lib/quiz-calculator'
import { HeartPulse, Share2, CheckCircle2, AlertTriangle, Lightbulb } from 'lucide-react'

interface UserProfile {
  userId: string
  displayName: string
  pictureUrl?: string
}

interface ResultScreenProps {
  result: QuizResult
  sessionId: string
  liff: typeof Liff | null
  profile: UserProfile | null
}

const LEVEL_STYLES = {
  high: {
    gradient: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
    badgeBg: '#d4edda',
    badgeColor: '#155724',
    borderColor: '#28a745',
    label: '🟢 ระดับสูง',
  },
  medium: {
    gradient: 'linear-gradient(135deg, #ffc107 0%, #fd7e14 100%)',
    badgeBg: '#fff3cd',
    badgeColor: '#856404',
    borderColor: '#ffc107',
    label: '🟡 ระดับปานกลาง',
  },
  low: {
    gradient: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)',
    badgeBg: '#f8d7da',
    badgeColor: '#721c24',
    borderColor: '#dc3545',
    label: '🔴 ระดับต่ำ',
  },
}

/**
 * Result Screen — แสดงผลการประเมินความรอบรู้
 */
export default function ResultScreen({
  result,
  sessionId,
  liff,
  profile,
}: ResultScreenProps) {
  const [animatedScore, setAnimatedScore] = useState(0)
  const levelStyle = LEVEL_STYLES[result.literacyLevel]
  const scorePercent = calculateScorePercentage(result.totalScore)

  // Animate score counter
  useEffect(() => {
    const target = result.totalScore
    const duration = 1200
    const step = target / (duration / 16)
    let current = 0

    const timer = setInterval(() => {
      current += step
      if (current >= target) {
        setAnimatedScore(target)
        clearInterval(timer)
      } else {
        setAnimatedScore(Math.round(current))
      }
    }, 16)

    return () => clearInterval(timer)
  }, [result.totalScore])

  const handleClose = () => {
    if (liff) liff.closeWindow()
  }

  const handleShare = async () => {
    if (!liff) return
    try {
      await liff.shareTargetPicker([
        {
          type: 'text',
          text: `ฉันทำแบบสอบถาม BSE smart menu แล้ว!\nระดับความรอบรู้ด้านสุขภาพดิจิทัล: ${levelStyle.label}\nคะแนน: ${result.totalScore}/72\n\nมาทำด้วยกันได้เลย! 🎗️`,
        },
      ])
    } catch (err) {
      console.error('[LIFF] shareTargetPicker error:', err)
    }
  }

  return (
    <div className="result-screen">
      {/* Header */}
      <div className="result-header" style={{ background: levelStyle.gradient }}>
        <div className="result-header-icon flex justify-center">
          <img src="/logo-bse.png" alt="BSE Logo" style={{ height: '80px', width: 'auto', objectFit: 'contain', borderRadius: '16px', backgroundColor: 'white' }} />
        </div>
        <h1 className="result-header-title">ผลการประเมินของคุณ</h1>
        {profile && (
          <p className="result-header-name">{profile.displayName}</p>
        )}
      </div>

      {/* Score circle */}
      <div className="score-section">
        <div
          className="score-circle"
          style={{ borderColor: levelStyle.borderColor }}
        >
          <div className="score-number">{animatedScore}</div>
          <div className="score-max">/ 72</div>
        </div>

        <div
          className="level-badge"
          style={{
            backgroundColor: levelStyle.badgeBg,
            color: levelStyle.badgeColor,
          }}
        >
          {levelStyle.label}
        </div>
      </div>

      {/* Score bar */}
      <div className="score-bar-section">
        <div className="score-bar-track">
          <div
            className="score-bar-fill"
            style={{
              width: `${scorePercent}%`,
              background: levelStyle.gradient,
            }}
          />
        </div>
        <div className="score-bar-labels">
          <span>ต่ำ (24)</span>
          <span>ปานกลาง (40)</span>
          <span>สูง (57)</span>
          <span>72</span>
        </div>
      </div>

      {/* Description */}
      <div className="result-card">
        <h2 className="result-card-title">ความหมายของระดับนี้</h2>
        <p className="result-description">{result.levelDescription}</p>
      </div>

      {/* Recommendation */}
      <div className="result-card result-card--recommendation">
        <h2 className="result-card-title flex items-center gap-2">
          <Lightbulb size={20} className="text-yellow-500" /> คำแนะนำสำหรับคุณ
        </h2>
        <p className="result-recommendation">{result.recommendation}</p>
      </div>

      {/* Average score detail */}
      <div className="result-detail">
        <div className="detail-item">
          <span className="detail-label">คะแนนเฉลี่ยต่อข้อ</span>
          <span className="detail-value">{result.averageScore.toFixed(2)}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">รหัสผลการประเมิน</span>
          <span className="detail-value detail-value--small">
            {sessionId.slice(0, 8)}...
          </span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="result-actions">
        <button
          id="btn-share-result"
          className="btn btn-outline flex items-center justify-center gap-2"
          onClick={handleShare}
        >
          <Share2 size={18} /> แชร์ผลลัพธ์
        </button>
        <button
          id="btn-close-liff"
          className="btn btn-primary flex items-center justify-center gap-2"
          onClick={handleClose}
        >
          <CheckCircle2 size={18} /> เสร็จสิ้น
        </button>
      </div>

      {/* Disclaimer */}
      <p className="result-disclaimer flex items-start gap-2 justify-center px-6 text-center text-muted">
        <AlertTriangle size={16} className="text-yellow-500 shrink-0 mt-1" />
        <span>
          ผลการประเมินนี้เป็นเพียงการคัดกรองเบื้องต้นเท่านั้น
          ไม่สามารถใช้แทนคำแนะนำทางการแพทย์ได้
        </span>
      </p>
    </div>
  )
}
