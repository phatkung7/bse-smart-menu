'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { th } from 'date-fns/locale'
import { Loader2, ChevronDown, ChevronUp, Search, Droplet, ClipboardList, ArrowLeft, Calendar } from 'lucide-react'

interface Props {
  users: any[]
  loading: boolean
}

export default function HealthDataTab({ users, loading }: Props) {
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [detailUser, setDetailUser] = useState<any | null>(null)

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

  // ========== Detail Timeline View ==========
  if (detailUser) {
    // Merge menstrual + self-exam into a single timeline sorted by date desc
    const timelineItems: { type: 'menstrual' | 'self_exam'; date: string; data: any }[] = []

    for (const r of detailUser.menstrual_records ?? []) {
      timelineItems.push({ type: 'menstrual', date: r.period_start_date, data: r })
    }
    for (const r of detailUser.self_exam_records ?? []) {
      timelineItems.push({ type: 'self_exam', date: r.exam_date, data: r })
    }

    timelineItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return (
      <div className="profile-tab-content">
        {/* Back Button */}
        <button
          onClick={() => setDetailUser(null)}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--primary)', fontWeight: '600', fontSize: '0.9rem',
            padding: '8px 0', marginBottom: '4px',
          }}
        >
          <ArrowLeft size={16} /> กลับไปหน้ารายชื่อ
        </button>

        {/* User Header */}
        <div className="profile-card" style={{ textAlign: 'center', padding: '20px' }}>
          <div style={{ fontWeight: '800', fontSize: '1.15rem', color: 'var(--text-primary)' }}>
            {detailUser.display_name ?? 'ไม่ทราบชื่อ'}
          </div>
          {detailUser.tester_id && (
            <div style={{ fontSize: '0.82rem', color: '#888', marginTop: '4px' }}>
              Tester ID: {detailUser.tester_id}
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '12px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#E83E8C' }}>{detailUser.menstrual_count}</div>
              <div style={{ fontSize: '0.72rem', color: '#888' }}>บันทึกประจำเดือน</div>
            </div>
            <div style={{ width: '1px', backgroundColor: '#eee' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#2563EB' }}>{detailUser.self_exam_count}</div>
              <div style={{ fontSize: '0.72rem', color: '#888' }}>ตรวจเต้านม</div>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="profile-card">
          <h2 className="profile-card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={18} className="text-primary" />
            Timeline ({timelineItems.length} รายการ)
          </h2>

          {timelineItems.length === 0 ? (
            <p className="empty-state">ไม่มีข้อมูล</p>
          ) : (
            <div style={{ position: 'relative', paddingLeft: '24px' }}>
              {/* Vertical Line */}
              <div style={{
                position: 'absolute', left: '8px', top: '8px', bottom: '8px',
                width: '2px', backgroundColor: '#e0e0e0', borderRadius: '2px',
              }} />

              {timelineItems.map((item, i) => {
                const isMenstrual = item.type === 'menstrual'
                const dotColor = isMenstrual ? '#E83E8C' : '#2563EB'
                const bgColor = isMenstrual ? '#FFF0F5' : '#EFF6FF'
                const labelColor = isMenstrual ? '#E83E8C' : '#2563EB'

                return (
                  <div key={`${item.type}-${i}`} style={{ position: 'relative', marginBottom: '12px' }}>
                    {/* Dot */}
                    <div style={{
                      position: 'absolute', left: '-20px', top: '12px',
                      width: '12px', height: '12px', borderRadius: '50%',
                      backgroundColor: dotColor, border: '2px solid white',
                      boxShadow: `0 0 0 2px ${dotColor}40`,
                    }} />

                    {/* Card */}
                    <div style={{
                      padding: '10px 12px', backgroundColor: bgColor,
                      borderRadius: '10px', borderLeft: `3px solid ${dotColor}`,
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{
                          fontSize: '0.72rem', fontWeight: '700', color: labelColor,
                          padding: '2px 8px', borderRadius: '999px',
                          backgroundColor: `${dotColor}15`,
                        }}>
                          {isMenstrual ? '🩸 ประจำเดือน' : '🔍 ตรวจเต้านม'}
                        </span>
                        <span style={{ fontSize: '0.78rem', fontWeight: '600', color: '#555' }}>
                          {formatDate(item.date)}
                        </span>
                      </div>

                      {isMenstrual ? (
                        <>
                          {item.data.note && (
                            <div style={{ fontSize: '0.82rem', color: '#555', marginTop: '4px' }}>
                              หมายเหตุ: {item.data.note}
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <div style={{ fontSize: '0.82rem', color: '#333', marginTop: '4px' }}>
                            {item.data.note}
                          </div>
                          {item.data.next_expected_period_date && (
                            <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '4px' }}>
                              📅 คาดว่าประจำเดือนรอบถัดไป: {formatDate(item.data.next_expected_period_date)}
                            </div>
                          )}
                        </>
                      )}
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

  // ========== User List View ==========
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

                  {/* Expanded Summary + "ดูทั้งหมด" */}
                  {isExpanded && (
                    <div style={{ padding: '0 12px 12px', borderTop: '1px solid var(--border-color, #eee)' }}>
                      {/* Latest Menstrual */}
                      <div style={{ marginTop: '10px' }}>
                        <h4 style={{ fontSize: '0.82rem', fontWeight: '700', color: '#E83E8C', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Droplet size={13} /> ประจำเดือนล่าสุด
                        </h4>
                        {u.latest_menstrual ? (
                          <div style={{
                            padding: '8px 10px', backgroundColor: '#FFF0F5',
                            borderRadius: '8px', fontSize: '0.82rem',
                          }}>
                            <span style={{ fontWeight: '600', color: '#E83E8C' }}>
                              📅 {formatDate(u.latest_menstrual.period_start_date)}
                            </span>
                            {u.latest_menstrual.note && (
                              <span style={{ color: '#666', marginLeft: '8px' }}>— {u.latest_menstrual.note}</span>
                            )}
                          </div>
                        ) : (
                          <p style={{ fontSize: '0.8rem', color: '#999', fontStyle: 'italic' }}>ไม่มีข้อมูล</p>
                        )}
                      </div>

                      {/* Latest Self Exam */}
                      <div style={{ marginTop: '10px' }}>
                        <h4 style={{ fontSize: '0.82rem', fontWeight: '700', color: '#2563EB', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <ClipboardList size={13} /> ตรวจเต้านมล่าสุด
                        </h4>
                        {u.latest_self_exam ? (
                          <div style={{
                            padding: '8px 10px', backgroundColor: '#EFF6FF',
                            borderRadius: '8px', fontSize: '0.82rem',
                          }}>
                            <span style={{ fontWeight: '600', color: '#2563EB' }}>
                              🔍 {formatDate(u.latest_self_exam.exam_date)}
                            </span>
                            <div style={{ color: '#333', marginTop: '2px' }}>{u.latest_self_exam.note}</div>
                          </div>
                        ) : (
                          <p style={{ fontSize: '0.8rem', color: '#999', fontStyle: 'italic' }}>ไม่มีข้อมูล</p>
                        )}
                      </div>

                      {/* "ดูทั้งหมด" Button */}
                      {(u.menstrual_count > 0 || u.self_exam_count > 0) && (
                        <button
                          className="btn btn-secondary"
                          onClick={() => setDetailUser(u)}
                          style={{
                            width: '100%', marginTop: '12px',
                            fontSize: '0.85rem', padding: '10px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                          }}
                        >
                          <Calendar size={14} />
                          ดูทั้งหมด ({u.menstrual_count + u.self_exam_count} รายการ)
                        </button>
                      )}
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
