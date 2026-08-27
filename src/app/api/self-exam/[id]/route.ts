import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyLiffToken } from '@/lib/liff-auth'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * PUT /api/self-exam/[id]
 * แก้ไขบันทึกผลการตรวจ
 */
export async function PUT(req: NextRequest, { params }: RouteParams) {
  const { id } = await params
  let body: { id_token?: string; line_user_id?: string; exam_date?: string; note?: string; next_expected_period_date?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { id_token, line_user_id, exam_date, note, next_expected_period_date } = body

  if (!note || !note.trim()) {
    return NextResponse.json({ error: 'note is required' }, { status: 400 })
  }

  const { error, userId } = await verifyLiffToken(id_token, line_user_id)
  if (error || !userId) {
    return NextResponse.json({ error: error ?? 'Unauthorized' }, { status: 401 })
  }

  // ตรวจสอบว่าบันทึกนี้เป็นของผู้ใช้คนนี้จริงๆ
  const { data: existing } = await supabaseAdmin
    .from('self_exam_records')
    .select('id')
    .eq('id', id)
    .eq('line_user_id', userId)
    .single()

  if (!existing) {
    return NextResponse.json({ error: 'Record not found' }, { status: 404 })
  }

  const { data, error: dbError } = await supabaseAdmin
    .from('self_exam_records')
    .update({
      note: note.trim(),
      exam_date: exam_date ?? undefined,
      next_expected_period_date: next_expected_period_date || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (dbError) {
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  return NextResponse.json({ success: true, record: data })
}

/**
 * DELETE /api/self-exam/[id]
 * ลบบันทึกผลการตรวจ
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const id_token = req.headers.get('x-id-token')
  const line_user_id = req.headers.get('x-line-user-id') ?? undefined

  const { error, userId } = await verifyLiffToken(id_token, line_user_id)
  if (error || !userId) {
    return NextResponse.json({ error: error ?? 'Unauthorized' }, { status: 401 })
  }

  const { error: dbError } = await supabaseAdmin
    .from('self_exam_records')
    .delete()
    .eq('id', id)
    .eq('line_user_id', userId)

  if (dbError) {
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
