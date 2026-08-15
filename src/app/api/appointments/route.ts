import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyLiffToken, ensureUser } from '@/lib/liff-auth'
import { pushMessage } from '@/lib/line-client'
import { buildAppointmentSuccessMessage } from '@/lib/line-messages/appointment-success'

/**
 * GET /api/appointments
 * ดึงประวัติการนัดหมายของผู้ใช้
 */
export async function GET(req: NextRequest) {
  const id_token = req.headers.get('x-id-token')
  const line_user_id = req.headers.get('x-line-user-id') ?? undefined

  const { error, userId } = await verifyLiffToken(id_token, line_user_id)
  if (error || !userId) {
    return NextResponse.json({ error: error ?? 'Unauthorized' }, { status: 401 })
  }

  const { data, error: dbError } = await supabaseAdmin
    .from('appointments')
    .select('*')
    .eq('line_user_id', userId)
    .order('appointment_date', { ascending: false })

  if (dbError) {
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  return NextResponse.json({ records: data })
}

/**
 * POST /api/appointments
 * บันทึกการนัดหมายใหม่
 */
export async function POST(req: NextRequest) {
  try {
    let body: { id_token?: string; line_user_id?: string; appointment_date: string; doctor_name?: string; hospital_name?: string; note?: string; reminder_days?: number }
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const { id_token, line_user_id, appointment_date, doctor_name, hospital_name, note, reminder_days } = body

    if (!appointment_date) {
      return NextResponse.json({ error: 'appointment_date is required' }, { status: 400 })
    }

    const { error, userId, displayName, pictureUrl } = await verifyLiffToken(id_token, line_user_id)
    if (error || !userId) {
      return NextResponse.json({ error: error ?? 'Unauthorized' }, { status: 401 })
    }

    await ensureUser(userId, displayName, pictureUrl)

    const { data, error: dbError } = await supabaseAdmin
      .from('appointments')
      .insert({
        line_user_id: userId,
        appointment_date: new Date(appointment_date).toISOString(),
        doctor_name: doctor_name?.trim() || null,
        hospital_name: hospital_name?.trim() || null,
        note: note?.trim() || null,
        reminder_days: reminder_days !== undefined ? reminder_days : 1,
      })
      .select()
      .single()

    if (dbError) {
      console.error('[Appointment] Insert error:', dbError)
      return NextResponse.json({ error: 'Database error: ' + JSON.stringify(dbError) }, { status: 500 })
    }

    // Push Flex Message ยืนยันการนัดหมาย
    const liffBaseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? ''
    const apptDateObj = new Date(data.appointment_date)
    
    // ignore line-bot-sdk typing issues if any in the build message
    const msg = buildAppointmentSuccessMessage(
      apptDateObj, 
      data.doctor_name || '', 
      data.hospital_name || '', 
      data.note || '', 
      liffBaseUrl,
      data.reminder_days
    ) as any

    pushMessage(userId, [msg]).catch((err) =>
      console.error('[Appointment] Push message failed:', err)
    )

    return NextResponse.json({ success: true, record: data })
  } catch (err: any) {
    console.error('[Appointment] Uncaught Exception:', err)
    return NextResponse.json({ error: 'Internal Server Error: ' + err.message }, { status: 500 })
  }
}
