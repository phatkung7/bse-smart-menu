'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { th } from 'date-fns/locale'
import { Calendar, Loader2, AlertTriangle, PlusCircle, Check, X, Stethoscope, Building2, FileText, Clock, Pencil, Trash2 } from 'lucide-react'

type AppState = 'loading' | 'ready' | 'error'

interface UserProfile {
  userId: string
  displayName: string
  pictureUrl?: string | null
}

interface AppointmentRecord {
  id: string
  appointment_date: string
  doctor_name: string | null
  hospital_name: string | null
  note: string | null
  reminder_days: number
  created_at: string
}

export default function AppointmentPage() {
  const [appState, setAppState] = useState<AppState>('loading')
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [idToken, setIdToken] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  
  const [records, setRecords] = useState<AppointmentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Form state
  const [apptDate, setApptDate] = useState('')
  const [apptTime, setApptTime] = useState('')
  const [doctorName, setDoctorName] = useState('')
  const [hospitalName, setHospitalName] = useState('')
  const [note, setNote] = useState('')
  const [reminderDays, setReminderDays] = useState(1)
  
  const [successMsg, setSuccessMsg] = useState('')
  const [formError, setFormError] = useState('')
  
  // Edit & Delete state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editApptDate, setEditApptDate] = useState('')
  const [editApptTime, setEditApptTime] = useState('')
  const [editDoctorName, setEditDoctorName] = useState('')
  const [editHospitalName, setEditHospitalName] = useState('')
  const [editNote, setEditNote] = useState('')
  const [editReminderDays, setEditReminderDays] = useState(1)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const fetchRecords = async (token: string | null, userId: string) => {
    const headers: Record<string, string> = {}
    if (token) headers['x-id-token'] = token
    else headers['x-line-user-id'] = userId

    const res = await fetch('/api/appointments', { headers })
    if (res.ok) {
      const data = await res.json()
      setRecords(data.records ?? [])
    }
    setLoading(false)
  }

  useEffect(() => {
    const liffId = process.env.NEXT_PUBLIC_LIFF_APPOINTMENT_ID

    // [Mock Mode] dev without LIFF
    if (!liffId && process.env.NODE_ENV === 'development') {
      const mockUserId = 'mock-user-id-1234'
      setProfile({ userId: mockUserId, displayName: 'นักพัฒนา (Mock)', pictureUrl: null })
      setAppState('ready')
      fetchRecords(null, mockUserId)
      return
    }

    if (!liffId) {
      setErrorMsg('LIFF ID (Appointment) ไม่ถูกตั้งค่า')
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

        await fetchRecords(token, userProfile.userId)
        setAppState('ready')
      } catch (err) {
        console.error('[LIFF Appointment] Init error:', err)
        setErrorMsg('ไม่สามารถเชื่อมต่อ LINE ได้ กรุณาเปิดผ่าน LINE แอป')
        setAppState('error')
      }
    })()
  }, [])

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg)
    setFormError('')
    setTimeout(() => setSuccessMsg(''), 3000)
  }

  const showError = (msg: string) => {
    setFormError(msg)
    setSuccessMsg('')
    setTimeout(() => setFormError(''), 5000)
  }

  const handleStartEdit = (r: AppointmentRecord) => {
    const d = new Date(r.appointment_date)
    setEditingId(r.id)
    setEditApptDate(format(d, 'yyyy-MM-dd'))
    setEditApptTime(format(d, 'HH:mm'))
    setEditDoctorName(r.doctor_name || '')
    setEditHospitalName(r.hospital_name || '')
    setEditNote(r.note || '')
    setEditReminderDays(r.reminder_days || 1)
    setDeleteConfirmId(null)
  }

  const handleSaveEdit = async (id: string) => {
    if (!editApptDate || !editApptTime) { showError('กรุณาระบุวันที่และเวลาให้ครบถ้วน'); return }
    const isoDateTime = new Date(`${editApptDate}T${editApptTime}`).toISOString()

    const res = await fetch(`/api/appointments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        id_token: idToken, 
        line_user_id: profile?.userId, 
        appointment_date: isoDateTime,
        doctor_name: editDoctorName,
        hospital_name: editHospitalName,
        note: editNote,
        reminder_days: editReminderDays
      }),
    })
    if (res.ok) {
      setEditingId(null)
      showSuccess('แก้ไขข้อมูลสำเร็จ')
      if (profile) await fetchRecords(idToken, profile.userId)
    } else {
      const e = await res.json()
      showError(e.error ?? 'แก้ไขข้อมูลไม่สำเร็จ')
    }
  }

  const handleDelete = async (id: string) => {
    const headers: Record<string, string> = {}
    if (idToken) headers['x-id-token'] = idToken
    else if (profile) headers['x-line-user-id'] = profile.userId
    
    const res = await fetch(`/api/appointments/${id}`, {
      method: 'DELETE',
      headers
    })
    if (res.ok) {
      setDeleteConfirmId(null)
      showSuccess('ลบข้อมูลสำเร็จ')
      if (profile) await fetchRecords(idToken, profile.userId)
    } else {
      const e = await res.json()
      showError(e.error ?? 'ลบข้อมูลไม่สำเร็จ')
    }
  }

  const handleAdd = async () => {
    if (!apptDate || !apptTime) {
      showError('กรุณาระบุวันที่และเวลาให้ครบถ้วน')
      return
    }

    setSaving(true)
    setFormError('')
    setSuccessMsg('')
    
    const isoDateTime = new Date(`${apptDate}T${apptTime}`).toISOString()

    const res = await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        id_token: idToken, 
        line_user_id: profile?.userId, 
        appointment_date: isoDateTime,
        doctor_name: doctorName,
        hospital_name: hospitalName,
        note: note,
        reminder_days: reminderDays
      }),
    })
    if (res.ok) {
      setApptDate('')
      setApptTime('')
      setDoctorName('')
      setHospitalName('')
      setNote('')
      setReminderDays(1)
      showSuccess('บันทึกการนัดหมายสำเร็จ')
      if (profile) await fetchRecords(idToken, profile.userId)
    } else {
      const e = await res.json()
      showError(e.error ?? 'บันทึกการนัดหมายไม่สำเร็จ')
    }
    setSaving(false)
  }

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
        <h1 className="profile-header-title">นัดหมายแพทย์และแจ้งเตือน</h1>
      </div>

      <div className="profile-content" style={{ paddingBottom: '24px' }}>
        <div className="profile-tab-content">
          
          {/* Form */}
          <div className="profile-card">
            <h2 className="profile-card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={18} className="text-primary" style={{ flexShrink: 0 }} />
              เพิ่มนัดหมายใหม่
            </h2>
            <div className="form-group" style={{ display: 'flex', gap: '8px' }}>
              <div style={{ flex: 1 }}>
                <label className="form-label">วันที่</label>
                <input
                  type="date"
                  className="form-input"
                  value={apptDate}
                  onChange={(e) => setApptDate(e.target.value)}
                  disabled={saving}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label className="form-label">เวลา</label>
                <input
                  type="time"
                  className="form-input"
                  value={apptTime}
                  onChange={(e) => setApptTime(e.target.value)}
                  disabled={saving}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Stethoscope size={16} /> แพทย์ผู้ตรวจ
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="ระบุชื่อแพทย์ (ทางเลือก)"
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                disabled={saving}
              />
            </div>
            
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Building2 size={16} /> โรงพยาบาล/คลินิก
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="ระบุชื่อโรงพยาบาล (ทางเลือก)"
                value={hospitalName}
                onChange={(e) => setHospitalName(e.target.value)}
                disabled={saving}
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FileText size={16} /> หมายเหตุเพิ่มเติม
              </label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="โน้ตเพิ่มเติม เช่น นัดอัลตราซาวด์, เจาะเลือด..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                disabled={saving}
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={16} /> ตั้งค่าการแจ้งเตือน
              </label>
              <div className="pill-group">
                <button 
                  className={`pill-btn ${reminderDays === 1 ? 'active' : ''}`} 
                  onClick={() => setReminderDays(1)}
                  disabled={saving}
                >
                  ล่วงหน้า 1 วัน
                </button>
                <button 
                  className={`pill-btn ${reminderDays === 3 ? 'active' : ''}`} 
                  onClick={() => setReminderDays(3)}
                  disabled={saving}
                >
                  ล่วงหน้า 3 วัน
                </button>
              </div>
            </div>

            {formError && (
              <div className="alert alert-error">
                <AlertTriangle size={16} /> {formError}
              </div>
            )}
            
            {successMsg && (
              <div className="alert alert-success">
                <Check size={16} /> {successMsg}
              </div>
            )}

            <button
              className="btn btn-primary"
              onClick={handleAdd}
              disabled={saving}
            >
              {saving ? (
                <><Loader2 size={18} className="spin" /> กำลังบันทึก...</>
              ) : (
                <><PlusCircle size={18} /> บันทึกการนัดหมาย</>
              )}
            </button>
          </div>

          {/* List */}
          <div className="profile-card">
            <h2 className="profile-card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={18} className="text-primary" style={{ flexShrink: 0 }} />
              รายการนัดหมาย
            </h2>
            
            {loading ? (
              <div className="loading-state">
                <Loader2 size={24} className="spin text-primary" />
                <p>กำลังโหลดข้อมูล...</p>
              </div>
            ) : records.length === 0 ? (
              <div className="empty-state">
                <Calendar size={48} className="empty-icon" />
                <p>ยังไม่มีประวัติการนัดหมาย</p>
              </div>
            ) : (
              <div className="record-list">
                {records.map((r) => {
                  const dateObj = new Date(r.appointment_date)
                  
                  if (editingId === r.id) {
                    return (
                      <div key={r.id} className="record-item" style={{ flexDirection: 'column', gap: '16px', border: '2px solid var(--primary)', backgroundColor: 'var(--primary-ultra-light)' }}>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary-dark)', fontWeight: 700, marginBottom: '4px' }}>
                          <Pencil size={18} />
                          แก้ไขการนัดหมาย
                        </div>

                        <div className="form-group" style={{ display: 'flex', gap: '8px', flexDirection: 'row' }}>
                          <div style={{ flex: 1 }}>
                            <label className="form-label" style={{ fontSize: '0.9rem' }}>วันที่</label>
                            <input type="date" className="form-input" value={editApptDate} onChange={e => setEditApptDate(e.target.value)} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <label className="form-label" style={{ fontSize: '0.9rem' }}>เวลา</label>
                            <input type="time" className="form-input" value={editApptTime} onChange={e => setEditApptTime(e.target.value)} />
                          </div>
                        </div>

                        <div className="form-group">
                          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem' }}>
                            <Stethoscope size={14} /> แพทย์ผู้ตรวจ
                          </label>
                          <input type="text" className="form-input" placeholder="ระบุชื่อแพทย์ (ทางเลือก)" value={editDoctorName} onChange={e => setEditDoctorName(e.target.value)} />
                        </div>
                        
                        <div className="form-group">
                          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem' }}>
                            <Building2 size={14} /> โรงพยาบาล/คลินิก
                          </label>
                          <input type="text" className="form-input" placeholder="ระบุชื่อโรงพยาบาล (ทางเลือก)" value={editHospitalName} onChange={e => setEditHospitalName(e.target.value)} />
                        </div>

                        <div className="form-group">
                          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem' }}>
                            <FileText size={14} /> หมายเหตุเพิ่มเติม
                          </label>
                          <textarea className="form-textarea" rows={2} placeholder="โน้ตเพิ่มเติม" value={editNote} onChange={e => setEditNote(e.target.value)} />
                        </div>
                        
                        <div className="form-group">
                          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem' }}>
                            <Clock size={14} /> ตั้งค่าการแจ้งเตือน
                          </label>
                          <div className="pill-group">
                            <button 
                              className={`pill-btn ${editReminderDays === 1 ? 'active' : ''}`} 
                              onClick={() => setEditReminderDays(1)}
                            >
                              ล่วงหน้า 1 วัน
                            </button>
                            <button 
                              className={`pill-btn ${editReminderDays === 3 ? 'active' : ''}`} 
                              onClick={() => setEditReminderDays(3)}
                            >
                              ล่วงหน้า 3 วัน
                            </button>
                          </div>
                        </div>
                        
                        <div className="record-actions" style={{ width: '100%', gap: '8px', marginTop: '8px' }}>
                          <button className="btn btn-primary" onClick={() => handleSaveEdit(r.id)} style={{ flex: 1, padding: '12px' }}>
                            <Check size={18} /> บันทึกการแก้ไข
                          </button>
                          <button className="btn btn-secondary" onClick={() => setEditingId(null)} style={{ flex: 1, padding: '12px' }}>
                            <X size={18} /> ยกเลิก
                          </button>
                        </div>
                      </div>
                    )
                  }
                  
                  return (
                    <div key={r.id} className="record-item" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                        <div className="record-date" style={{ color: 'var(--primary-dark)', fontSize: '1rem', fontWeight: 600 }}>
                          {format(dateObj, 'd MMMM yyyy HH:mm น.', { locale: th })}
                        </div>
                        
                        <div className="record-actions" style={{ marginTop: 0 }}>
                          {deleteConfirmId === r.id ? (
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <span style={{ fontSize: '0.9rem', color: 'var(--red)', fontWeight: 600 }}>ยืนยันลบ?</span>
                              <button 
                                style={{ padding: '8px', backgroundColor: 'var(--red)', color: 'white', border: 'none', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} 
                                onClick={() => handleDelete(r.id)}
                              >
                                <Check size={20} strokeWidth={3} />
                              </button>
                              <button 
                                style={{ padding: '8px', backgroundColor: '#e2e8f0', color: 'var(--text-secondary)', border: 'none', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} 
                                onClick={() => setDeleteConfirmId(null)}
                              >
                                <X size={20} strokeWidth={3} />
                              </button>
                            </div>
                          ) : (
                            <>
                              <button className="action-btn text-primary" onClick={() => handleStartEdit(r)}><Pencil size={16} /></button>
                              <button className="action-btn text-red" onClick={() => setDeleteConfirmId(r.id)}><Trash2 size={16} /></button>
                            </>
                          )}
                        </div>
                      </div>
                      
                      {r.doctor_name && (
                        <div className="record-note" style={{ marginTop: '4px', fontSize: '0.9rem' }}>
                          <Stethoscope size={14} style={{ display: 'inline', marginRight: '4px' }} />
                          {r.doctor_name}
                        </div>
                      )}
                      
                      {r.hospital_name && (
                        <div className="record-note" style={{ marginTop: '2px', fontSize: '0.9rem' }}>
                          <Building2 size={14} style={{ display: 'inline', marginRight: '4px' }} />
                          {r.hospital_name}
                        </div>
                      )}

                      {r.note && (
                        <div className="record-note" style={{ marginTop: '6px', fontStyle: 'italic', color: '#666' }}>
                          {r.note}
                        </div>
                      )}
                      
                      <div style={{ marginTop: '8px', padding: '4px 8px', backgroundColor: '#EFF6FF', color: '#2563EB', borderRadius: '4px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={12} /> ระบบจะแจ้งเตือนท่านล่วงหน้า {r.reminder_days || 1} วัน
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
