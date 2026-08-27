'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { th } from 'date-fns/locale'
import { Loader2, ChevronDown, ChevronUp, Search, Droplet, ClipboardList } from 'lucide-react'

interface Props {
  users: any[]
  loading: boolean
}

export default function HealthDataTab({ users, loading }: Props) {
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const toggleExpand = (userId: string) => {
    setExpandedUserId(expandedUserId === userId ? null : userId)
  }

  const filteredUsers = users.filter((u) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      (u.display_name ?? '').toLowerCase().includes(q) ||
      (u.tester_id ?? '').toLowerCase().includes(q)
    )
  })

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-'
    try {
      return format(new Date(dateStr), 'dd/MM/yyyy', { locale: th })
    } catch {
      return dateStr
    }
  }

  return (
    <div className="profile-tab-content">
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

      {/* User List */}
      <div className="profile-card">
        <h2 className="profile-card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          ข้อมูลสุขภาพ ({filteredUsers.length} คน)
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
              const isExpanded = expandedUserId === u.line_user_id
              return (
                <div key={u.line_user_id} className="self-exam-record-item" style={{ padding: '0' }}>
                  {/* Collapsed Header */}
                  <button
                    onClick={() => toggleExpand(u.line_user_id)}
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      width: '100%', padding: '12px', background: 'none', border: 'none',
                      cursor: 'pointer', textAlign: 'left',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                        {u.display_name ?? 'ไม่ทราบชื่อ'}
                      </div>
                      {u.tester_id && (
                        <div style={{ fontSize: '0.78rem', color: '#888', marginTop: '2px' }}>
                          ID: {u.tester_id}
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: '12px', marginTop: '6px', fontSize: '0.78rem', color: '#666' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Droplet size={12} color="#E83E8C" />
                          ประจำเดือน: {u.menstrual_count} ครั้ง
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <ClipboardList size={12} color="#2563EB" />
                          ตรวจเต้านม: {u.self_exam_count} ครั้ง
                        </span>
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp size={18} color="#999" /> : <ChevronDown size={18} color="#999" />}
                  </button>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div style={{ padding: '0 12px 12px', borderTop: '1px solid var(--border-color, #eee)' }}>
                      {/* Menstrual Records */}
                      <div style={{ marginTop: '12px' }}>
                        <h4 style={{ fontSize: '0.85rem', fontWeight: '700', color: '#E83E8C', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Droplet size={14} /> บันทึกประจำเดือน
                        </h4>
                        {u.menstrual_records.length === 0 ? (
                          <p style={{ fontSize: '0.8rem', color: '#999', fontStyle: 'italic' }}>ไม่มีข้อมูล</p>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {u.menstrual_records.slice(0, 5).map((r: any, i: number) => (
                              <div key={i} style={{
                                padding: '8px 10px', backgroundColor: '#FFF0F5',
                                borderRadius: '8px', fontSize: '0.82rem',
                              }}>
                                <div style={{ fontWeight: '600', color: '#E83E8C' }}>
                                  📅 {formatDate(r.period_start_date)}
                                </div>
                                {r.note && <div style={{ color: '#666', marginTop: '2px' }}>{r.note}</div>}
                              </div>
                            ))}
                            {u.menstrual_records.length > 5 && (
                              <p style={{ fontSize: '0.75rem', color: '#999', textAlign: 'center' }}>
                                ...และอีก {u.menstrual_records.length - 5} รายการ
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Self Exam Records */}
                      <div style={{ marginTop: '16px' }}>
                        <h4 style={{ fontSize: '0.85rem', fontWeight: '700', color: '#2563EB', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <ClipboardList size={14} /> ผลการตรวจเต้านม
                        </h4>
                        {u.self_exam_records.length === 0 ? (
                          <p style={{ fontSize: '0.8rem', color: '#999', fontStyle: 'italic' }}>ไม่มีข้อมูล</p>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {u.self_exam_records.slice(0, 5).map((r: any, i: number) => (
                              <div key={i} style={{
                                padding: '8px 10px', backgroundColor: '#EFF6FF',
                                borderRadius: '8px', fontSize: '0.82rem',
                              }}>
                                <div style={{ fontWeight: '600', color: '#2563EB' }}>
                                  🔍 {formatDate(r.exam_date)}
                                </div>
                                <div style={{ color: '#333', marginTop: '2px' }}>{r.note}</div>
                                {r.next_expected_period_date && (
                                  <div style={{ color: '#888', fontSize: '0.75rem', marginTop: '2px' }}>
                                    คาดว่าประจำเดือนรอบถัดไป: {formatDate(r.next_expected_period_date)}
                                  </div>
                                )}
                              </div>
                            ))}
                            {u.self_exam_records.length > 5 && (
                              <p style={{ fontSize: '0.75rem', color: '#999', textAlign: 'center' }}>
                                ...และอีก {u.self_exam_records.length - 5} รายการ
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
