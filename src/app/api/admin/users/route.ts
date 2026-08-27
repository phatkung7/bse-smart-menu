import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyLiffToken } from '@/lib/liff-auth'
import { verifyAdmin } from '@/lib/admin-auth'

/**
 * GET /api/admin/users
 * ดึงข้อมูล user ทั้งหมด พร้อมระดับล่าสุด, ประจำเดือน, ผลตรวจ
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
    // 2. ดึง users ทั้งหมด
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('line_user_id, display_name, picture_url, tester_id, created_at')
      .order('created_at', { ascending: false })

    if (usersError) throw usersError

    // 3. ดึง quiz_results ล่าสุดของทุกคน
    const { data: quizResults } = await supabaseAdmin
      .from('quiz_results')
      .select('line_user_id, literacy_level, total_score, completed_at')
      .order('completed_at', { ascending: false })

    // 4. ดึง menstrual_records ล่าสุด
    const { data: menstrualRecords } = await supabaseAdmin
      .from('menstrual_records')
      .select('line_user_id, period_start_date, note, created_at')
      .order('period_start_date', { ascending: false })

    // 5. ดึง self_exam_records ล่าสุด
    const { data: selfExamRecords } = await supabaseAdmin
      .from('self_exam_records')
      .select('line_user_id, exam_date, note, next_expected_period_date, created_at')
      .order('exam_date', { ascending: false })

    // 6. Group by user
    const quizMap = new Map<string, any>()
    for (const r of quizResults ?? []) {
      if (!quizMap.has(r.line_user_id)) {
        quizMap.set(r.line_user_id, r)
      }
    }

    const menstrualMap = new Map<string, any[]>()
    for (const r of menstrualRecords ?? []) {
      if (!menstrualMap.has(r.line_user_id)) {
        menstrualMap.set(r.line_user_id, [])
      }
      menstrualMap.get(r.line_user_id)!.push(r)
    }

    const selfExamMap = new Map<string, any[]>()
    for (const r of selfExamRecords ?? []) {
      if (!selfExamMap.has(r.line_user_id)) {
        selfExamMap.set(r.line_user_id, [])
      }
      selfExamMap.get(r.line_user_id)!.push(r)
    }

    // 7. Combine
    const result = (users ?? []).map((u) => {
      const quiz = quizMap.get(u.line_user_id) ?? null
      const menstrual = menstrualMap.get(u.line_user_id) ?? []
      const selfExam = selfExamMap.get(u.line_user_id) ?? []
      return {
        ...u,
        literacy_level: quiz?.literacy_level ?? null,
        total_score: quiz?.total_score ?? null,
        quiz_completed_at: quiz?.completed_at ?? null,
        menstrual_records: menstrual,
        self_exam_records: selfExam,
        menstrual_count: menstrual.length,
        self_exam_count: selfExam.length,
        latest_menstrual: menstrual[0] ?? null,
        latest_self_exam: selfExam[0] ?? null,
      }
    })

    return NextResponse.json({ users: result })
  } catch (err: any) {
    console.error('[Admin Users] Error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
