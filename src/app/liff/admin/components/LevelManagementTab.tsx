'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { th } from 'date-fns/locale'
import { Loader2, Pencil, AlertCircle, Search } from 'lucide-react'

const LEVEL_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  high: { label: 'สูง', color: '#15803d', bg: '#dcfce7' },
  medium: { label: 'กลาง', color: '#b45309', bg: '#fef3c7' },
  low: { label: 'ต่ำ', color: '#dc2626', bg: '#fee2e2' },
}

interface Props {
  users: any[]
  authHeaders: () => Record<string, string>
  onRefresh: () => void
  loading: boolean
}

export default function LevelManagementTab({ users, authHeaders, onRefresh, loading }: Props) {
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [selectedLevel, setSelectedLevel] = useState('')
  const [saving, setSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

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

  const handleEditClick = (userId: string, currentLevel: string | null) => {
    setEditingUserId(userId)
    setSelectedLevel(currentLevel ?? 'low')
  }

  const handleSave = async () => {
    if (!editingUserId || !selectedLevel) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/users/${editingUserId}/level`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ literacy_level: selectedLevel }),
      })
      if (!res.ok) {
        const e = await res.json()
        showError(e.error ?? 'แก้ไขไม่สำเร็จ')
      } else {
        showSuccess('แก้ไขระดับและเปลี่ยน Rich Menu สำเร็จ')
        setEditingUserId(null)
        onRefresh()
      }
    } catch (err) {
      showError('เกิดข้อผิดพลาดในการเชื่อมต่อ')
    }
    setSaving(false)
  }

  const filteredUsers = users.filter((u) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      (u.display_name ?? '').toLowerCase().includes(q) ||
      (u.tester_id ?? '').toLowerCase().includes(q) ||
      (u.line_user_id ?? '').toLowerCase().includes(q)
    )
  })

  return (
    <div className="profile-tab-content">
      {successMsg && (
        <div style={{ position: 'fixed', top: '90px', left: '50%', transform: 'translateX(-50%)', width: '90%', maxWidth: '360px', backgroundColor: '#D4EDDA', color: '#155724', padding: '12px 16px', borderRadius: '12px', border: '1px solid #C3E6CB', fontWeight: 'bold', fontSize: '0.9rem', zIndex: 9999, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', textAlign: 'center' }}>
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div style={{ position: 'fixed', top: '90px', left: '50%', transform: 'translateX(-50%)', width: '90%', maxWidth: '360px', backgroundColor: '#F8D7DA', color: '#721C24', padding: '12px 16px', borderRadius: '12px', border: '1px solid #F5C6CB', fontWeight: 'bold', fontSize: '0.9rem', zIndex: 9999, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', textAlign: 'center' }}>
          {errorMsg}
        </div>
      )}

      {/* Edit Modal */}
      {editingUserId && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-icon" style={{ color: '#2563EB' }}>
              <AlertCircle size={48} />
            </div>
            <h3 className="modal-title">แก้ไขระดับ</h3>
            <p className="modal-message" style={{ marginBottom: '12px' }}>
              {users.find(u => u.line_user_id === editingUserId)?.display_name ?? editingUserId}
            </p>
            <select
              className="form-input"
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              style={{ marginBottom: '16px', fontSize: '1rem', textAlign: 'center' }}
            >
              <option value="high">🟢 สูง (High)</option>
              <option value="medium">🟡 กลาง (Medium)</option>
              <option value="low">🔴 ต่ำ (Low)</option>
            </select>
            <p style={{ fontSize: '0.8rem', color: '#666', marginBottom: '12px' }}>
              ⚠️ เปลี่ยนระดับจะเปลี่ยน Rich Menu ของผู้ใช้ทันที
            </p>
            <div className="modal-actions">
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setEditingUserId(null)} disabled={saving}>
                ยกเลิก
              </button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 size={16} className="animate-spin" /> : 'ยืนยัน'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="profile-card" style={{ marginBottom: '0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', color: '#999' }} />
          <input
            type="text"
            className="form-input"
            placeholder="ค้นหาชื่อ, Tester ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '36px' }}
          />
        </div>
      </div>

      {/* Summary */}
      <div style={{ display: 'flex', gap: '8px', padding: '12px 0', overflowX: 'auto' }}>
        {(['high', 'medium', 'low'] as const).map((level) => {
          const count = users.filter(u => u.literacy_level === level).length
          const config = LEVEL_CONFIG[level]
          return (
            <div key={level} style={{
              flex: '1', minWidth: '90px', padding: '10px 12px',
              backgroundColor: config.bg, borderRadius: '12px',
              textAlign: 'center', border: `1px solid ${config.color}20`,
            }}>
              <div style={{ fontSize: '1.5rem', fontWeight: '800', color: config.color }}>{count}</div>
              <div style={{ fontSize: '0.75rem', color: config.color, fontWeight: '600' }}>{config.label}</div>
            </div>
          )
        })}
        <div style={{
          flex: '1', minWidth: '90px', padding: '10px 12px',
          backgroundColor: '#f0f0f0', borderRadius: '12px',
          textAlign: 'center', border: '1px solid #ccc20',
        }}>
          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#666' }}>
            {users.filter(u => !u.literacy_level).length}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#666', fontWeight: '600' }}>ยังไม่ประเมิน</div>
        </div>
      </div>

      {/* User List */}
      <div className="profile-card">
        <h2 className="profile-card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          กลุ่มตัวอย่าง ({filteredUsers.length} คน)
        </h2>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '24px' }}>
            <Loader2 size={24} className="animate-spin text-primary" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <p className="empty-state">ไม่พบข้อมูล</p>
        ) : (
          <div className="record-list">
            {filteredUsers.map((u) => {
              const levelConfig = u.literacy_level ? LEVEL_CONFIG[u.literacy_level] : null
              return (
                <div key={u.line_user_id} className="self-exam-record-item" style={{ padding: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {u.display_name ?? 'ไม่ทราบชื่อ'}
                      </div>
                      {u.tester_id && (
                        <div style={{ fontSize: '0.78rem', color: '#888', marginTop: '2px' }}>
                          ID: {u.tester_id}
                        </div>
                      )}
                      <div style={{ marginTop: '6px' }}>
                        {levelConfig ? (
                          <span style={{
                            display: 'inline-block', padding: '3px 10px',
                            borderRadius: '999px', fontSize: '0.78rem', fontWeight: '700',
                            color: levelConfig.color, backgroundColor: levelConfig.bg,
                          }}>
                            {levelConfig.label}
                          </span>
                        ) : (
                          <span style={{
                            display: 'inline-block', padding: '3px 10px',
                            borderRadius: '999px', fontSize: '0.78rem', fontWeight: '600',
                            color: '#999', backgroundColor: '#f0f0f0',
                          }}>
                            ยังไม่ประเมิน
                          </span>
                        )}
                        {u.total_score && (
                          <span style={{ fontSize: '0.75rem', color: '#888', marginLeft: '8px' }}>
                            ({u.total_score} คะแนน)
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      className="btn-icon-sm"
                      style={{ marginLeft: '8px', flexShrink: 0 }}
                      onClick={() => handleEditClick(u.line_user_id, u.literacy_level)}
                      title="แก้ไขระดับ"
                    >
                      <Pencil size={16} />
                    </button>
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
