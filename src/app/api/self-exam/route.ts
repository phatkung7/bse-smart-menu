import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyLiffToken, ensureUser } from '@/lib/liff-auth'

/**
 * GET /api/self-exam
 * ดึงประวัติการบันทึกผลตรวจเต้านมของผู้ใช้
 */
export async function GET(req: NextRequest) {
  const id_token = req.headers.get('x-id-token')
  const line_user_id = req.headers.get('x-line-user-id') ?? undefined

  const { error, userId } = await verifyLiffToken(id_token, line_user_id)
  if (error || !userId) {
    return NextResponse.json({ error: error ?? 'Unauthorized' }, { status: 401 })
  }

  const { data, error: dbError } = await supabaseAdmin
    .from('self_exam_records')
    .select('*')
    .eq('line_user_id', userId)
    .order('exam_date', { ascending: false })

  if (dbError) {
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  return NextResponse.json({ records: data })
}

/**
 * POST /api/self-exam
 * บันทึกผลการตรวจเต้านมใหม่
 */
export async function POST(req: NextRequest) {
  let body: { id_token?: string; line_user_id?: string; exam_date: string; note: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { id_token, line_user_id, exam_date, note } = body

  if (!note || !note.trim()) {
    return NextResponse.json({ error: 'note is required' }, { status: 400 })
  }

  const { error, userId, displayName, pictureUrl } = await verifyLiffToken(id_token, line_user_id)
  if (error || !userId) {
    return NextResponse.json({ error: error ?? 'Unauthorized' }, { status: 401 })
  }

  await ensureUser(userId, displayName, pictureUrl)

  const { data, error: dbError } = await supabaseAdmin
    .from('self_exam_records')
    .insert({
      line_user_id: userId,
      exam_date: exam_date ?? new Date().toISOString().split('T')[0],
      note: note.trim(),
    })
    .select()
    .single()

  if (dbError) {
    console.error('[SelfExam] Insert error:', dbError)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  return NextResponse.json({ success: true, record: data })
}
