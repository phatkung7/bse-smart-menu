'use client'

import { useEffect, useState } from 'react'
import type Liff from '@line/liff'
import IntroScreen from './components/IntroScreen'
import QuizScreen from './components/QuizScreen'
import ResultScreen from './components/ResultScreen'
import { TOTAL_QUESTIONS } from '@/data/questions'
import { calculateQuizResult, QuizResult } from '@/lib/quiz-calculator'
import { HeartPulse, Loader2, Send, AlertTriangle, Check } from 'lucide-react'

type AppState = 'loading' | 'intro' | 'quiz' | 'submitting' | 'result' | 'error' | 'already-done'

interface UserProfile {
  userId: string
  displayName: string
  pictureUrl?: string
}

/**
 * LIFF Quiz Page — Main Entry Point
 * /liff/quiz
 */
export default function QuizPage() {
  const [appState, setAppState] = useState<AppState>('loading')
  const [liff, setLiff] = useState<typeof Liff | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [result, setResult] = useState<QuizResult | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string>('')
  const [testerId, setTesterId] = useState<string>('')

  // Initialize LIFF
  useEffect(() => {
    const liffId = process.env.NEXT_PUBLIC_LIFF_ID

    // [Mock Mode] สำหรับทดสอบใน Local โดยไม่ต้องใช้ LIFF ID
    if (!liffId && process.env.NODE_ENV === 'development') {
      console.warn('[Mock Mode] Running without LIFF ID in development.')
      setProfile({
        userId: 'mock-user-id-1234',
        displayName: 'นักพัฒนา (Mock)',
        pictureUrl: 'https://ui-avatars.com/api/?name=Dev&background=D63384&color=fff',
      })
      setTesterId('MOCK001')
      setAppState('intro')
      return
    }

    if (!liffId) {
      setErrorMsg('LIFF ID ไม่ถูกตั้งค่า กรุณาติดต่อผู้ดูแลระบบ')
      setAppState('error')
      return
    }

    ;(async () => {
      try {
        const liffModule = (await import('@line/liff')).default
        await liffModule.init({ liffId })

        if (!liffModule.isLoggedIn()) {
          liffModule.login()
          return
        }

        const userProfile = await liffModule.getProfile()
        setLiff(liffModule)
        setProfile({
          userId: userProfile.userId,
          displayName: userProfile.displayName,
          pictureUrl: userProfile.pictureUrl ?? undefined,
        })
        
        try {
          const res = await fetch(`/api/user/profile?line_user_id=${userProfile.userId}`)
          if (res.ok) {
            const json = await res.json()
            if (json.data?.tester_id) {
              setTesterId(json.data.tester_id)
            }
            if (json.has_completed_quiz) {
              setAppState('already-done')
              return
            }
          }
        } catch (e) {
          console.error('[QuizPage] Failed to fetch user profile', e)
        }

        setAppState('intro')
      } catch (err) {
        console.error('[LIFF] Init error:', err)
        setErrorMsg('ไม่สามารถเชื่อมต่อ LINE ได้ กรุณาเปิดผ่าน LINE แอป')
        setAppState('error')
      }
    })()
  }, [])

  // Handle quiz submission
  const handleSubmit = async (finalAnswers: Record<number, number>) => {
    if (!profile) return
    setAppState('submitting')

    const answersArray = Object.entries(finalAnswers).map(([q, score]) => ({
      question_number: Number(q),
      score,
    }))

    try {
      // [Mock Mode] จำลองการส่งข้อมูล
      if (!process.env.NEXT_PUBLIC_LIFF_ID && process.env.NODE_ENV === 'development') {
        console.log('[Mock Mode] Submitting answers:', answersArray)
        await new Promise(resolve => setTimeout(resolve, 1500)) // delay จำลอง
        
        const scores = Object.values(finalAnswers)
        const quizResult = calculateQuizResult(scores)
        
        setSessionId('mock-session-id-5678')
        setResult(quizResult)
        setAppState('result')
        return
      }

      const idToken = liff?.getIDToken() ?? null

      const res = await fetch('/api/quiz/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_token: idToken,
          line_user_id: profile.userId,
          display_name: profile.displayName,
          picture_url: profile.pictureUrl,
          tester_id: testerId,
          answers: answersArray,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Submit failed')
      }

      const data = await res.json()
      setSessionId(data.session_id)

      // คำนวณผลสำหรับแสดงใน LIFF
      const scores = Object.values(finalAnswers)
      const quizResult = calculateQuizResult(scores)
      setResult(quizResult)
      setAppState('result')
    } catch (err: any) {
      console.error('[Quiz] Submit error:', err)
      setErrorMsg('เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง')
      setAppState('error')
    }
  }

  const handleStart = (finalTesterId: string) => {
    setTesterId(finalTesterId)
    setAnswers({})
    setAppState('quiz')
  }

  const handleRetry = () => {
    setErrorMsg('')
    setAppState('intro')
  }

  return (
    <div className="quiz-app">
      {appState === 'loading' && <LoadingScreen />}
      {appState === 'intro' && profile && (
        <IntroScreen profile={profile} initialTesterId={testerId} onStart={handleStart} />
      )}
      {appState === 'quiz' && (
        <QuizScreen
          answers={answers}
          setAnswers={setAnswers}
          onSubmit={handleSubmit}
        />
      )}
      {appState === 'submitting' && <SubmittingScreen />}
      {appState === 'result' && result && (
        <ResultScreen
          result={result}
          sessionId={sessionId ?? ''}
          liff={liff}
          profile={profile}
        />
      )}
      {appState === 'error' && <ErrorScreen message={errorMsg} onRetry={handleRetry} />}
      {appState === 'already-done' && <AlreadyDoneScreen liff={liff} />}
    </div>
  )
}

function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="loading-ribbon">
        <img src="/logo-bse.png" alt="BSE Logo" style={{ height: '100px', width: 'auto', objectFit: 'contain', borderRadius: '20px', backgroundColor: 'white' }} />
      </div>
      <Loader2 size={40} className="loading-spinner text-primary" />
      <p className="loading-text">กำลังโหลด BSE smart menu</p>
    </div>
  )
}

function SubmittingScreen() {
  return (
    <div className="loading-screen">
      <div className="loading-ribbon">
        <img src="/logo-bse.png" alt="BSE Logo" style={{ height: '100px', width: 'auto', objectFit: 'contain', borderRadius: '20px', backgroundColor: 'white' }} />
      </div>
      <Loader2 size={40} className="loading-spinner text-primary" />
      <p className="loading-text">กำลังบันทึกข้อมูล...</p>
      <p className="loading-subtext">กรุณารอสักครู่</p>
    </div>
  )
}

function ErrorScreen({
  message,
  onRetry,
}: {
  message: string
  onRetry: () => void
}) {
  return (
    <div className="error-screen">
      <div className="error-icon">
        <AlertTriangle size={64} color="var(--red)" strokeWidth={1.5} />
      </div>
      <h2 className="error-title">เกิดข้อผิดพลาด</h2>
      <p className="error-message">{message}</p>
      <button className="btn btn-primary" onClick={onRetry}>
        ลองใหม่อีกครั้ง
      </button>
    </div>
  )
}

function AlreadyDoneScreen({ liff }: { liff: typeof Liff | null }) {
  const handleClose = () => {
    if (liff) {
      liff.closeWindow()
    } else {
      window.close()
    }
  }

  return (
    <div className="loading-screen" style={{ textAlign: 'center' }}>
      <div style={{ marginBottom: '24px' }}>
        <img src="/logo-bse.png" alt="BSE Logo" style={{ height: '100px', width: 'auto', objectFit: 'contain', borderRadius: '20px', backgroundColor: 'white' }} />
      </div>

      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '32px 24px',
        margin: '0 20px',
        boxShadow: '0 8px 32px rgba(37, 99, 235, 0.12)',
        border: '1px solid rgba(37, 99, 235, 0.1)',
      }}>
        <div style={{ marginBottom: '16px' }}>
          <Check size={56} color="#10b981" strokeWidth={2.5} />
        </div>
        <h2 style={{ color: 'var(--text-primary)', fontSize: '1.3rem', fontWeight: 700, marginBottom: '12px', lineHeight: 1.4 }}>
          ท่านได้ทำแบบประเมินระดับ<br/>ความรอบรู้ด้านสุขภาพดิจิทัลแล้ว
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '24px' }}>
          ขอบคุณที่สละเวลาทำแบบประเมิน<br/>ท่านสามารถดูผลการประเมินได้ที่หน้าโปรไฟล์
        </p>
        <button
          className="btn btn-primary btn-large"
          onClick={handleClose}
          style={{ width: '100%', maxWidth: '280px', padding: '14px 24px', fontSize: '1.1rem' }}
        >
          ปิดหน้าต่าง
        </button>
      </div>
    </div>
  )
}
