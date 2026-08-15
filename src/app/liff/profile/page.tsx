'use client'

import { useEffect, useState } from 'react'
import type Liff from '@line/liff'
import { User, Calendar, ClipboardList, Loader2, AlertTriangle, Droplet } from 'lucide-react'
import ProfileTab from './components/ProfileTab'
import MenstrualTab from './components/MenstrualTab'
import SelfExamTab from './components/SelfExamTab'

type TabId = 'profile' | 'menstrual' | 'selfexam'
type AppState = 'loading' | 'ready' | 'error'

interface UserProfile {
  userId: string
  displayName: string
  pictureUrl?: string | null
}

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'profile', label: 'ข้อมูลของฉัน', icon: <User size={18} /> },
  { id: 'menstrual', label: 'บันทึกประจำเดือน', icon: <Droplet size={18} /> },
  { id: 'selfexam', label: 'บันทึกผลตรวจ', icon: <ClipboardList size={18} /> },
]

export default function ProfilePage() {
  const [appState, setAppState] = useState<AppState>('loading')
  const [activeTab, setActiveTab] = useState<TabId>('profile')
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [idToken, setIdToken] = useState<string | null>(null)
  const [latestResult, setLatestResult] = useState<any | null>(null)
  const [testerId, setTesterId] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const liffId = process.env.NEXT_PUBLIC_LIFF_PROFILE_ID ?? process.env.NEXT_PUBLIC_LIFF_ID

    // [Mock Mode] dev without LIFF
    if (!liffId && process.env.NODE_ENV === 'development') {
      setProfile({ userId: 'mock-user-id-1234', displayName: 'นักพัฒนา (Mock)', pictureUrl: null })
      setTesterId('MOCK001')
      setAppState('ready')
      return
    }

    if (!liffId) {
      setErrorMsg('LIFF ID ไม่ถูกตั้งค่า')
      setAppState('error')
      return
    }

    ;(async () => {
      try {
        const liffModule = (await import('@line/liff')).default
        await liffModule.init({ liffId })

        if (!liffModule.isLoggedIn()) { liffModule.login(); return }

        const token = liffModule.getIDToken()
        const userProfile = await liffModule.getProfile()

        setIdToken(token)
        setProfile({
          userId: userProfile.userId,
          displayName: userProfile.displayName,
          pictureUrl: userProfile.pictureUrl ?? null,
        })

        // ดึงผลการประเมินล่าสุด
        const headers: Record<string, string> = {}
        if (token) headers['x-id-token'] = token
        else headers['x-line-user-id'] = userProfile.userId

        const resResult = await fetch(`/api/quiz/result/latest?line_user_id=${userProfile.userId}`, { headers }).catch(() => null)
        if (resResult?.ok) {
          const d = await resResult.json()
          setLatestResult(d.result ?? null)
        }

        // ดึงข้อมูล profile เพิ่มเติม (tester_id)
        const resProfile = await fetch(`/api/user/profile?line_user_id=${userProfile.userId}`).catch(() => null)
        if (resProfile?.ok) {
          const p = await resProfile.json()
          if (p.data?.tester_id) {
            setTesterId(p.data.tester_id)
          }
        }

        setAppState('ready')
      } catch (err) {
        console.error('[LIFF Profile] Init error:', err)
        setErrorMsg('ไม่สามารถเชื่อมต่อ LINE ได้ กรุณาเปิดผ่าน LINE แอป')
        setAppState('error')
      }
    })()
  }, [])

  if (appState === 'loading') {
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

  if (appState === 'error') {
    return (
      <div className="error-screen">
        <AlertTriangle size={64} color="var(--red)" strokeWidth={1.5} />
        <h2 className="error-title">เกิดข้อผิดพลาด</h2>
        <p className="error-message">{errorMsg}</p>
      </div>
    )
  }

  return (
    <div className="profile-page">
      {/* Header */}
      <div className="profile-header">
        <div className="profile-header-logo">
          <img src="/logo-bse.png" alt="BSE" style={{ height: '40px', width: 'auto', objectFit: 'contain', borderRadius: '8px', backgroundColor: 'white' }} />
        </div>
        <h1 className="profile-header-title">
          {TABS.find(t => t.id === activeTab)?.label ?? 'ข้อมูลส่วนตัว'}
        </h1>
      </div>

      {/* Tab Content */}
      <div className="profile-content">
        {activeTab === 'profile' && (
          <ProfileTab
            displayName={profile?.displayName ?? ''}
            pictureUrl={profile?.pictureUrl}
            latestResult={latestResult}
            testerId={testerId}
          />
        )}
        {activeTab === 'menstrual' && (
          <MenstrualTab
            idToken={idToken}
            lineUserId={profile?.userId ?? ''}
          />
        )}
        {activeTab === 'selfexam' && (
          <SelfExamTab
            idToken={idToken}
            lineUserId={profile?.userId ?? ''}
          />
        )}
      </div>

      {/* Bottom Tab Navigation */}
      <div className="profile-bottom-nav">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`profile-bottom-nav-btn ${activeTab === tab.id ? 'profile-bottom-nav-btn--active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
