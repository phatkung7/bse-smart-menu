'use client'

import { useState, useEffect } from 'react'
import { format, addDays } from 'date-fns'
import { th } from 'date-fns/locale'
import { Calendar, Loader2, CheckCircle2, PlusCircle, Clock } from 'lucide-react'

interface MenstrualRecord {
  id: string
  period_start_date: string
  note: string | null
  created_at: string
}

interface MenstrualTabProps {
  idToken: string | null
  lineUserId: string
}

export default function MenstrualTab({ idToken, lineUserId }: MenstrualTabProps) {
  const [records, setRecords] = useState<MenstrualRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [note, setNote] = useState('')
  const [savedResult, setSavedResult] = useState<{ checkStart: Date; checkEnd: Date } | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg)
    setErrorMsg('')
    setTimeout(() => setSuccessMsg(''), 3000)
  }

  const showError = (msg: string) => {
    setErrorMsg(msg)
    setSuccessMsg('')
    setTimeout(() => setErrorMsg(''), 5000)
  }

  const fetchRecords = async () => {
    const headers: Record<string, string> = {}
    if (idToken) headers['x-id-token'] = idToken
    else headers['x-line-user-id'] = lineUserId

    const res = await fetch('/api/menstrual', { headers })
    if (res.ok) {
      const data = await res.json()
      setRecords(data.records ?? [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchRecords()
  }, [])

  const handleSave = async () => {
    if (!selectedDate) {
      showError('กรุณาเลือกวันที่ประจำเดือนมา')
      return
    }
    setSaving(true)
    setErrorMsg('')
    setSuccessMsg('')
    setSavedResult(null)

    const res = await fetch('/api/menstrual', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id_token: idToken,
        line_user_id: lineUserId,
        period_start_date: selectedDate,
        note: note.trim() || undefined,
      }),
    })

    if (res.ok) {
      const periodDate = new Date(selectedDate)
      setSavedResult({
        checkStart: addDays(periodDate, 7),
        checkEnd: addDays(periodDate, 10),
      })
      setSelectedDate('')
      setNote('')
      showSuccess('บันทึกข้อมูลสำเร็จ')
      await fetchRecords()
    } else {
      const err = await res.json()
      showError(err.error ?? 'บันทึกข้อมูลไม่สำเร็จ')
    }
    setSaving(false)
  }

  const todayStr = new Date().toISOString().split('T')[0]

  return (
    <div className="profile-tab-content">
      {successMsg && (
        <div style={{ position: 'fixed', top: '90px', left: '50%', transform: 'translateX(-50%)', width: '90%', maxWidth: '360px', backgroundColor: '#D4EDDA', color: '#155724', padding: '12px 16px', borderRadius: '12px', border: '1px solid #C3E6CB', fontWeight: 'bold', fontSize: '1rem', zIndex: 9999, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', textAlign: 'center', animation: 'scaleIn 0.3s ease' }}>
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div style={{ position: 'fixed', top: '90px', left: '50%', transform: 'translateX(-50%)', width: '90%', maxWidth: '360px', backgroundColor: '#F8D7DA', color: '#721C24', padding: '12px 16px', borderRadius: '12px', border: '1px solid #F5C6CB', fontWeight: 'bold', fontSize: '1rem', zIndex: 9999, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', textAlign: 'center', animation: 'scaleIn 0.3s ease' }}>
          {errorMsg}
        </div>
      )}

      {/* Form บันทึกวันประจำเดือน */}
      <div className="profile-card">
        <h2 className="profile-card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calendar size={18} className="text-primary" style={{ flexShrink: 0 }} />
          บันทึกวันประจำเดือน
        </h2>
        <p className="profile-card-subtitle">เลือกวันแรกที่ประจำเดือนมา</p>

        <div className="form-group">
          <label className="form-label">วันที่ประจำเดือนมา</label>
          <input
            type="date"
            className="form-input"
            value={selectedDate}
            max={todayStr}
            onChange={e => { setSelectedDate(e.target.value); setSavedResult(null) }}
          />
        </div>

        <div className="form-group">
          <label className="form-label">หมายเหตุ (ไม่บังคับ)</label>
          <input
            type="text"
            className="form-input"
            placeholder="เช่น มีอาการปวด หนักมาก"
            value={note}
            onChange={e => setNote(e.target.value)}
          />
        </div>

        <button
          className="btn btn-primary btn-large"
          onClick={handleSave}
          disabled={saving || !selectedDate}
        >
          {saving ? <Loader2 size={18} className="animate-spin" /> : <PlusCircle size={18} />}
          {saving ? 'กำลังบันทึก...' : 'บันทึก'}
        </button>
      </div>

      {/* ผลหลังบันทึก */}
      {savedResult && (
        <div className="menstrual-result-card">
          <div className="menstrual-result-icon">
            <CheckCircle2 size={32} color="#2563EB" />
          </div>
          <p className="menstrual-result-title">บันทึกสำเร็จ! ✅</p>
          <p className="menstrual-result-subtitle">วันแนะนำตรวจเต้านมด้วยตนเอง</p>
          <p className="menstrual-result-date">
            {format(savedResult.checkStart, 'd MMM', { locale: th })} –{' '}
            {format(savedResult.checkEnd, 'd MMMM yyyy', { locale: th })}
          </p>
          <p className="menstrual-result-note">
            หลังจากหมดประจำเดือนแล้ว 7–10 วัน เป็นช่วงเวลาที่เต้านมนุ่มที่สุด
            เหมาะสำหรับการตรวจด้วยตนเอง 🎗️
          </p>
          <p className="menstrual-result-flex">
            (ระบบส่งข้อความแจ้งเตือนกลับไปในแชท LINE ของคุณแล้ว)
          </p>
        </div>
      )}

      {/* ประวัติ */}
      <div className="profile-card">
        <h2 className="profile-card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={18} className="text-primary" style={{ flexShrink: 0 }} />
          ประวัติการบันทึก
        </h2>
        {loading ? (
          <div className="flex justify-center py-6"><Loader2 size={24} className="animate-spin text-primary" /></div>
        ) : records.length === 0 ? (
          <p className="empty-state">ยังไม่มีประวัติการบันทึก</p>
        ) : (
          <div className="record-list">
            {records.map(r => {
              const d = new Date(r.period_start_date)
              const checkStart = addDays(d, 7)
              const checkEnd = addDays(d, 10)
              return (
                <div key={r.id} className="menstrual-record-item">
                  <div className="record-body" style={{ width: '100%' }}>
                    <div style={{ marginBottom: '6px' }}>
                      <p className="record-check-label">📅 ประจำเดือนมา</p>
                      <p style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '1rem', margin: '2px 0 0' }}>
                        {format(d, 'd MMMM yyyy', { locale: th })}
                      </p>
                    </div>
                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '6px' }}>
                      <p className="record-check-label">🔔 ควรตรวจเต้านม</p>
                      <p className="record-check-date">
                        {format(checkStart, 'd MMM', { locale: th })} –{' '}
                        {format(checkEnd, 'd MMM yyyy', { locale: th })}
                      </p>
                    </div>
                    {r.note && <p className="record-note" style={{ marginTop: '4px' }}>{r.note}</p>}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
