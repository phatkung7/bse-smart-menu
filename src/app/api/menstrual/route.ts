import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyLiffToken, ensureUser } from '@/lib/liff-auth'
import { pushMessage } from '@/lib/line-client'
import { buildMenstrualReminderMessage } from '@/lib/line-messages/menstrual-reminder'

/**
 * GET /api/menstrual
 * ดึงประวัติการบันทึกประจำเดือนของผู้ใช้
 */
export async function GET(req: NextRequest) {
  const id_token = req.headers.get('x-id-token')
  const line_user_id = req.headers.get('x-line-user-id') ?? undefined

  const { error, userId } = await verifyLiffToken(id_token, line_user_id)
  if (error || !userId) {
    return NextResponse.json({ error: error ?? 'Unauthorized' }, { status: 401 })
  }

  const { data, error: dbError } = await supabaseAdmin
    .from('menstrual_records')
    .select('*')
    .eq('line_user_id', userId)
    .order('period_start_date', { ascending: false })

  if (dbError) {
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  return NextResponse.json({ records: data })
}

/**
 * POST /api/menstrual
 * บันทึกวันประจำเดือนใหม่
 */
export async function POST(req: NextRequest) {
  let body: { id_token?: string; line_user_id?: string; period_start_date: string; note?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { id_token, line_user_id, period_start_date, note } = body

  if (!period_start_date) {
    return NextResponse.json({ error: 'period_start_date is required' }, { status: 400 })
  }

  const { error, userId, displayName, pictureUrl } = await verifyLiffToken(id_token, line_user_id)
  if (error || !userId) {
    return NextResponse.json({ error: error ?? 'Unauthorized' }, { status: 401 })
  }

  await ensureUser(userId, displayName, pictureUrl)

  const { data, error: dbError } = await supabaseAdmin
    .from('menstrual_records')
    .insert({ line_user_id: userId, period_start_date, note: note ?? null })
    .select()
    .single()

  if (dbError) {
    console.error('[Menstrual] Insert error:', dbError)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  // Push Flex Message ยืนยัน
  const liffBaseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? ''
  const periodDate = new Date(period_start_date)
  const msg = buildMenstrualReminderMessage(periodDate, liffBaseUrl)
  pushMessage(userId, [msg]).catch((err) =>
    console.error('[Menstrual] Push message failed:', err)
  )

  return NextResponse.json({ success: true, record: data })
}
