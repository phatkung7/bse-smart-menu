'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { th } from 'date-fns/locale'
import { ClipboardList, Loader2, PlusCircle, Pencil, Trash2, Check, X } from 'lucide-react'

interface SelfExamRecord {
  id: string
  exam_date: string
  note: string
  created_at: string
}

interface SelfExamTabProps {
  idToken: string | null
  lineUserId: string
}

export default function SelfExamTab({ idToken, lineUserId }: SelfExamTabProps) {
  const [records, setRecords] = useState<SelfExamRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [examDate, setExamDate] = useState(new Date().toISOString().split('T')[0])
  const [note, setNote] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editNote, setEditNote] = useState('')
  const [editDate, setEditDate] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const authHeaders = (): Record<string, string> => {
    if (idToken) return { 'x-id-token': idToken }
    return { 'x-line-user-id': lineUserId }
  }

  const fetchRecords = async () => {
    const res = await fetch('/api/self-exam', { headers: authHeaders() })
    if (res.ok) {
      const data = await res.json()
      setRecords(data.records ?? [])
    }
    setLoading(false)
  }

  useEffect(() => { fetchRecords() }, [])

  const handleAdd = async () => {
    if (!note.trim()) { setErrorMsg('กรุณากรอกบันทึกผลการตรวจ'); return }
    setSaving(true); setErrorMsg('')
    const res = await fetch('/api/self-exam', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_token: idToken, line_user_id: lineUserId, exam_date: examDate, note }),
    })
    if (res.ok) { setNote(''); setExamDate(new Date().toISOString().split('T')[0]); await fetchRecords() }
    else { const e = await res.json(); setErrorMsg(e.error ?? 'เกิดข้อผิดพลาด') }
    setSaving(false)
  }

  const handleStartEdit = (r: SelfExamRecord) => {
    setEditingId(r.id); setEditNote(r.note); setEditDate(r.exam_date)
    setDeleteConfirmId(null)
  }

  const handleSaveEdit = async (id: string) => {
    if (!editNote.trim()) return
    const res = await fetch(`/api/self-exam/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_token: idToken, line_user_id: lineUserId, exam_date: editDate, note: editNote }),
    })
    if (res.ok) { setEditingId(null); await fetchRecords() }
  }

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/self-exam/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    })
    if (res.ok) { setDeleteConfirmId(null); await fetchRecords() }
  }

  const todayStr = new Date().toISOString().split('T')[0]

  return (
    <div className="profile-tab-content">
      {/* Form เพิ่มบันทึกใหม่ */}
      <div className="profile-card">
        <h2 className="profile-card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <PlusCircle size={18} className="text-primary" style={{ flexShrink: 0 }} />
          บันทึกผลการตรวจใหม่
        </h2>
        <div className="form-group">
          <label className="form-label">วันที่ตรวจ</label>
          <input type="date" className="form-input" value={examDate} max={todayStr}
            onChange={e => setExamDate(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">ผลการตรวจ / บันทึก</label>
          <textarea
            className="form-textarea"
            rows={4}
            placeholder="เช่น ไม่พบก้อน ไม่มีการเปลี่ยนแปลงผิดปกติ..."
            value={note}
            onChange={e => setNote(e.target.value)}
          />
        </div>
        {errorMsg && <p className="form-error">{errorMsg}</p>}
        <button className="btn btn-primary btn-large" onClick={handleAdd} disabled={saving || !note.trim()}>
          {saving ? <Loader2 size={18} className="animate-spin" /> : <PlusCircle size={18} />}
          {saving ? 'กำลังบันทึก...' : 'บันทึก'}
        </button>
      </div>

      {/* รายการบันทึกย้อนหลัง */}
      <div className="profile-card">
        <h2 className="profile-card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ClipboardList size={18} className="text-primary" style={{ flexShrink: 0 }} />
          ประวัติการตรวจ ({records.length} รายการ)
        </h2>
        {loading ? (
          <div className="flex justify-center py-6"><Loader2 size={24} className="animate-spin text-primary" /></div>
        ) : records.length === 0 ? (
          <p className="empty-state">ยังไม่มีบันทึกการตรวจ</p>
        ) : (
          <div className="record-list">
            {records.map(r => (
              <div key={r.id} className="self-exam-record-item">
                {editingId === r.id ? (
                  // Edit Mode
                  <div className="edit-form">
                    <input type="date" className="form-input" value={editDate} max={todayStr}
                      onChange={e => setEditDate(e.target.value)} />
                    <textarea className="form-textarea" rows={3} value={editNote}
                      onChange={e => setEditNote(e.target.value)} />
                    <div className="edit-actions">
                      <button className="btn-icon btn-icon--success" onClick={() => handleSaveEdit(r.id)}>
                        <Check size={16} /> บันทึก
                      </button>
                      <button className="btn-icon btn-icon--cancel" onClick={() => setEditingId(null)}>
                        <X size={16} /> ยกเลิก
                      </button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <>
                    <div className="self-exam-record-header">
                      <span className="record-date-badge">
                        {format(new Date(r.exam_date), 'd MMM yyyy', { locale: th })}
                      </span>
                      <div className="record-actions">
                        <button className="btn-icon-sm" onClick={() => handleStartEdit(r)} title="แก้ไข">
                          <Pencil size={14} />
                        </button>
                        {deleteConfirmId === r.id ? (
                          <>
                            <button className="btn-icon-sm btn-icon-sm--danger" onClick={() => handleDelete(r.id)}>
                              <Trash2 size={14} /> ยืนยันลบ
                            </button>
                            <button className="btn-icon-sm" onClick={() => setDeleteConfirmId(null)}>
                              <X size={14} />
                            </button>
                          </>
                        ) : (
                          <button className="btn-icon-sm" onClick={() => setDeleteConfirmId(r.id)} title="ลบ">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="self-exam-note">{r.note}</p>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
