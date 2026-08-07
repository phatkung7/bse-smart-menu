import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyLiffToken } from '@/lib/liff-auth'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * PUT /api/appointments/[id]
 * แก้ไขบันทึกนัดหมาย
 */
export async function PUT(req: NextRequest, { params }: RouteParams) {
  const { id } = await params
  let body: { id_token?: string; line_user_id?: string; appointment_date?: string; doctor_name?: string; hospital_name?: string; note?: string; reminder_days?: number }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { id_token, line_user_id, appointment_date, doctor_name, hospital_name, note, reminder_days } = body

  if (!appointment_date) {
    return NextResponse.json({ error: 'appointment_date is required' }, { status: 400 })
  }

  const { error, userId } = await verifyLiffToken(id_token, line_user_id)
  if (error || !userId) {
    return NextResponse.json({ error: error ?? 'Unauthorized' }, { status: 401 })
  }

  // ตรวจสอบว่าบันทึกนี้เป็นของผู้ใช้คนนี้จริงๆ
  const { data: existing } = await supabaseAdmin
    .from('appointments')
    .select('id')
    .eq('id', id)
    .eq('line_user_id', userId)
    .single()

  if (!existing) {
    return NextResponse.json({ error: 'Record not found' }, { status: 404 })
  }

  const updateData: any = {
    appointment_date: new Date(appointment_date).toISOString(),
    doctor_name: doctor_name?.trim() || null,
    hospital_name: hospital_name?.trim() || null,
    note: note?.trim() || null,
  }
  if (reminder_days !== undefined) {
    updateData.reminder_days = reminder_days
  }

  const { data, error: dbError } = await supabaseAdmin
    .from('appointments')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (dbError) {
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  return NextResponse.json({ success: true, record: data })
}

/**
 * DELETE /api/appointments/[id]
 * ลบบันทึกนัดหมาย
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const { id } = await params
  
  const id_token = req.headers.get('x-id-token')
  const line_user_id = req.headers.get('x-line-user-id') ?? undefined

  const { error, userId } = await verifyLiffToken(id_token, line_user_id)
  if (error || !userId) {
    return NextResponse.json({ error: error ?? 'Unauthorized' }, { status: 401 })
  }

  // ตรวจสอบความเป็นเจ้าของ
  const { data: existing } = await supabaseAdmin
    .from('appointments')
    .select('id')
    .eq('id', id)
    .eq('line_user_id', userId)
    .single()

  if (!existing) {
    return NextResponse.json({ error: 'Record not found' }, { status: 404 })
  }

  const { error: dbError } = await supabaseAdmin
    .from('appointments')
    .delete()
    .eq('id', id)

  if (dbError) {
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
