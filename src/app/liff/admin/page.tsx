'use client'

import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { th } from 'date-fns/locale'
import {
  Loader2, AlertTriangle, Shield, Users, ClipboardList,
  Download, RefreshCw
} from 'lucide-react'
import LevelManagementTab from './components/LevelManagementTab'
import HealthDataTab from './components/HealthDataTab'

type TabId = 'levels' | 'health'
type AppState = 'loading' | 'ready' | 'forbidden' | 'error'

interface UserProfile {
  userId: string
  displayName: string
}

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'levels', label: 'จัดการระดับ', icon: <Users size={18} /> },
  { id: 'health', label: 'ข้อมูลสุขภาพ', icon: <ClipboardList size={18} /> },
]

export default function AdminPage() {
  const [appState, setAppState] = useState<AppState>('loading')
  const [activeTab, setActiveTab] = useState<TabId>('levels')
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [idToken, setIdToken] = useState<string | null>(null)
  const [users, setUsers] = useState<any[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const authHeaders = useCallback((): Record<string, string> => {
    if (idToken) return { 'x-id-token': idToken }
    if (profile?.userId) return { 'x-line-user-id': profile.userId }
    return {}
  }, [idToken, profile])

  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true)
    try {
      const res = await fetch('/api/admin/users', { headers: authHeaders() })
      if (res.status === 403) {
        setAppState('forbidden')
        return
      }
      if (!res.ok) throw new Error('Failed to fetch users')
      const data = await res.json()
      setUsers(data.users ?? [])
    } catch (err) {
      console.error('[Admin] Fetch users error:', err)
    }
    setLoadingUsers(false)
  }, [authHeaders])

  useEffect(() => {
    const liffId = process.env.NEXT_PUBLIC_LIFF_ADMIN_ID

    // Mock mode for dev
    if (!liffId && process.env.NODE_ENV === 'development') {
      setProfile({ userId: 'Ue5c6f19ea71411b8a71a3f1645a76fb8', displayName: 'Admin (Mock)' })
      setAppState('ready')
      return
    }

    if (!liffId) {
      setErrorMsg('LIFF Admin ID ไม่ถูกตั้งค่า')
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
        })
        setAppState('ready')
      } catch (err) {
        console.error('[Admin LIFF] Init error:', err)
        setErrorMsg('ไม่สามารถเชื่อมต่อ LINE ได้')
        setAppState('error')
      }
    })()
  }, [])

  // Fetch users after auth is ready
  useEffect(() => {
    if (appState === 'ready' && profile) {
      fetchUsers()
    }
  }, [appState, profile, fetchUsers])

  if (appState === 'loading') {
    return (
      <div className="loading-screen">
        <div className="loading-ribbon">
          <img src="/logo-bse.png" alt="BSE Logo" style={{ height: '100px', width: 'auto', objectFit: 'contain', borderRadius: '20px', backgroundColor: 'white' }} />
        </div>
        <Loader2 size={40} className="loading-spinner text-primary" />
        <p className="loading-text">กำลังตรวจสอบสิทธิ์ Admin...</p>
      </div>
    )
  }

  if (appState === 'forbidden') {
    return (
      <div className="error-screen">
        <Shield size={64} color="#dc3545" strokeWidth={1.5} />
        <h2 className="error-title">ไม่มีสิทธิ์เข้าถึง</h2>
        <p className="error-message">บัญชีของคุณไม่มีสิทธิ์ Admin</p>
      </div>
    )
  }

  if (appState === 'error') {
    return (
      <div className="error-screen">
        <AlertTriangle size={64} color="#dc3545" strokeWidth={1.5} />
        <h2 className="error-title">เกิดข้อผิดพลาด</h2>
        <p className="error-message">{errorMsg}</p>
      </div>
    )
  }

  const handleExport = async () => {
    try {
      const res = await fetch('/api/admin/export', { headers: authHeaders() })
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const today = new Date().toISOString().split('T')[0]
      a.href = url
      a.download = `bse-smart-export-${today}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('[Admin] Export error:', err)
      alert('Export ไม่สำเร็จ')
    }
  }

  return (
    <div className="profile-page">
      {/* Header */}
      <div className="profile-header" style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #2563EB 100%)' }}>
        <div className="profile-header-logo">
          <img src="/logo-bse.png" alt="BSE" style={{ height: '40px', width: 'auto', objectFit: 'contain', borderRadius: '8px', backgroundColor: 'white' }} />
        </div>
        <h1 className="profile-header-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Shield size={20} />
          Admin Panel
        </h1>
      </div>

      {/* Action Bar */}
      <div style={{
        display: 'flex', gap: '8px', padding: '12px 16px',
        justifyContent: 'flex-end', alignItems: 'center',
        borderBottom: '1px solid var(--border-color, #eee)',
        backgroundColor: 'var(--bg-surface, #fff)',
      }}>
        <button
          className="btn btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', padding: '8px 14px' }}
          onClick={() => fetchUsers()}
          disabled={loadingUsers}
        >
          <RefreshCw size={14} className={loadingUsers ? 'animate-spin' : ''} />
          รีเฟรช
        </button>
        <button
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', padding: '8px 14px' }}
          onClick={handleExport}
        >
          <Download size={14} />
          Export Excel
        </button>
      </div>

      {/* Tab Content */}
      <div className="profile-content">
        {activeTab === 'levels' && (
          <LevelManagementTab
            users={users}
            authHeaders={authHeaders}
            onRefresh={fetchUsers}
            loading={loadingUsers}
          />
        )}
        {activeTab === 'health' && (
          <HealthDataTab
            users={users}
            loading={loadingUsers}
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
