import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyLiffToken } from '@/lib/liff-auth'
import { verifyAdmin } from '@/lib/admin-auth'
import * as XLSX from 'xlsx'

/**
 * GET /api/admin/export
 * Export ข้อมูลทั้งหมดเป็นไฟล์ Excel (.xlsx)
 */
export async function GET(req: NextRequest) {
  // 1. Auth
  const id_token = req.headers.get('x-id-token')
  const line_user_id = req.headers.get('x-line-user-id') ?? undefined
  const { error, userId } = await verifyLiffToken(id_token, line_user_id)
  if (error || !userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!verifyAdmin(userId)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    // 2. Fetch all data
    const { data: users } = await supabaseAdmin
      .from('users')
      .select('line_user_id, display_name, tester_id, created_at')
      .order('created_at', { ascending: false })

    const { data: quizResults } = await supabaseAdmin
      .from('quiz_results')
      .select('line_user_id, literacy_level, total_score, completed_at')
      .order('completed_at', { ascending: false })

    const { data: menstrualRecords } = await supabaseAdmin
      .from('menstrual_records')
      .select('line_user_id, period_start_date, note, created_at')
      .order('period_start_date', { ascending: false })

    const { data: selfExamRecords } = await supabaseAdmin
      .from('self_exam_records')
      .select('line_user_id, exam_date, note, next_expected_period_date, created_at')
      .order('exam_date', { ascending: false })

    // 3. Build quiz map (latest per user)
    const quizMap = new Map<string, any>()
    for (const r of quizResults ?? []) {
      if (!quizMap.has(r.line_user_id)) {
        quizMap.set(r.line_user_id, r)
      }
    }

    const levelText: Record<string, string> = { low: 'ต่ำ', medium: 'กลาง', high: 'สูง' }

    // 4. Sheet 1: ข้อมูลผู้ใช้ + ระดับ
    const usersSheet = (users ?? []).map((u) => {
      const quiz = quizMap.get(u.line_user_id)
      return {
        'Tester ID': u.tester_id ?? '-',
        'ชื่อ': u.display_name ?? '-',
        'LINE User ID': u.line_user_id,
        'ระดับ': quiz ? levelText[quiz.literacy_level] ?? quiz.literacy_level : 'ยังไม่ทำแบบประเมิน',
        'คะแนนรวม': quiz?.total_score ?? '-',
        'วันที่ประเมิน': quiz?.completed_at ? new Date(quiz.completed_at).toLocaleDateString('th-TH') : '-',
        'วันที่สมัคร': new Date(u.created_at).toLocaleDateString('th-TH'),
      }
    })

    // 5. Sheet 2: บันทึกประจำเดือน
    const menstrualSheet = (menstrualRecords ?? []).map((r) => {
      const user = (users ?? []).find((u) => u.line_user_id === r.line_user_id)
      return {
        'Tester ID': user?.tester_id ?? '-',
        'ชื่อ': user?.display_name ?? '-',
        'วันที่ประจำเดือนมา': r.period_start_date,
        'หมายเหตุ': r.note ?? '-',
        'วันที่บันทึก': new Date(r.created_at).toLocaleDateString('th-TH'),
      }
    })

    // 6. Sheet 3: ผลการตรวจเต้านม
    const selfExamSheet = (selfExamRecords ?? []).map((r) => {
      const user = (users ?? []).find((u) => u.line_user_id === r.line_user_id)
      return {
        'Tester ID': user?.tester_id ?? '-',
        'ชื่อ': user?.display_name ?? '-',
        'วันที่ตรวจ': r.exam_date,
        'ผลการตรวจ': r.note ?? '-',
        'คาดว่าประจำเดือนรอบถัดไป': r.next_expected_period_date ?? '-',
        'วันที่บันทึก': new Date(r.created_at).toLocaleDateString('th-TH'),
      }
    })

    // 7. Create workbook
    const wb = XLSX.utils.book_new()
    
    const ws1 = XLSX.utils.json_to_sheet(usersSheet)
    ws1['!cols'] = [
      { wch: 12 }, { wch: 20 }, { wch: 36 }, { wch: 20 },
      { wch: 10 }, { wch: 16 }, { wch: 16 },
    ]
    XLSX.utils.book_append_sheet(wb, ws1, 'ข้อมูลผู้ใช้')

    const ws2 = XLSX.utils.json_to_sheet(menstrualSheet)
    ws2['!cols'] = [
      { wch: 12 }, { wch: 20 }, { wch: 18 }, { wch: 30 }, { wch: 16 },
    ]
    XLSX.utils.book_append_sheet(wb, ws2, 'บันทึกประจำเดือน')

    const ws3 = XLSX.utils.json_to_sheet(selfExamSheet)
    ws3['!cols'] = [
      { wch: 12 }, { wch: 20 }, { wch: 14 }, { wch: 40 }, { wch: 22 }, { wch: 16 },
    ]
    XLSX.utils.book_append_sheet(wb, ws3, 'ผลการตรวจเต้านม')

    // 8. Generate buffer
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

    const today = new Date().toISOString().split('T')[0]
    return new NextResponse(buf, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="bse-smart-export-${today}.xlsx"`,
      },
    })
  } catch (err: any) {
    console.error('[Admin Export] Error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
