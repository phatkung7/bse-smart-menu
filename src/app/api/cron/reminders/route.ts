import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { pushMessage } from '@/lib/line-client'
import { format, differenceInDays, startOfDay } from 'date-fns'
import { th } from 'date-fns/locale'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  // 1. ตรวจสอบสิทธิ์ (Security) 
  // Vercel Cron จะส่ง header Authorization: Bearer <CRON_SECRET> มาให้
  const authHeader = req.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // 2. ดึงข้อมูลการนัดหมายทั้งหมดที่ยังไม่ถึงเวลา (ในอนาคต)
    const today = new Date()
    const { data: appointments, error } = await supabaseAdmin
      .from('appointments')
      .select('*')
      .gte('appointment_date', today.toISOString())
      .order('appointment_date', { ascending: true })

    if (error) {
      console.error('[Cron] DB Error:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    if (!appointments || appointments.length === 0) {
      return NextResponse.json({ success: true, message: 'No upcoming appointments' })
    }

    let notifiedCount = 0
    const liffBaseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? ''

    // 3. วนลูปตรวจสอบว่ารายการไหนถึงเวลาต้องแจ้งเตือนแล้ว
    for (const appt of appointments) {
      const apptDate = new Date(appt.appointment_date)
      
      // ค้นหาความต่างของจำนวนวัน (นับเฉพาะวัน ไม่รวมเวลา)
      const daysDiff = differenceInDays(startOfDay(apptDate), startOfDay(today))
      const reminderDays = appt.reminder_days || 1

      // ถ้าจำนวนวันที่เหลือ เท่ากับ จำนวนวันที่ผู้ใช้ตั้งค่าให้แจ้งเตือนล่วงหน้าพอดี
      if (daysDiff === reminderDays) {
        
        // 4. สร้างข้อความ Flex Message
        const dateStr = format(apptDate, 'd MMMM yyyy เวลา HH:mm น.', { locale: th })
        const flexMessage = {
          type: 'flex',
          altText: `แจ้งเตือนการนัดหมาย: ${dateStr}`,
          contents: {
            type: 'bubble',
            size: 'mega',
            header: {
              type: 'box',
              layout: 'vertical',
              contents: [
                {
                  type: 'text',
                  text: '⏰ แจ้งเตือนการนัดหมาย',
                  weight: 'bold',
                  color: '#ffffff',
                  size: 'lg'
                }
              ],
              backgroundColor: '#2563EB',
              paddingAll: '16px'
            },
            body: {
              type: 'box',
              layout: 'vertical',
              spacing: 'md',
              contents: [
                {
                  type: 'text',
                  text: `คุณมีนัดหมายในอีก ${reminderDays} วันข้างหน้า`,
                  weight: 'bold',
                  size: 'md',
                  wrap: true,
                  color: '#dc3545'
                },
                {
                  type: 'box',
                  layout: 'baseline',
                  spacing: 'sm',
                  contents: [
                    { type: 'text', text: 'วันที่:', color: '#aaaaaa', size: 'sm', flex: 2 },
                    { type: 'text', text: dateStr, wrap: true, color: '#666666', size: 'sm', flex: 5 }
                  ]
                },
                ...(appt.doctor_name ? [{
                  type: 'box',
                  layout: 'baseline',
                  spacing: 'sm',
                  contents: [
                    { type: 'text', text: 'แพทย์:', color: '#aaaaaa', size: 'sm', flex: 2 },
                    { type: 'text', text: appt.doctor_name, wrap: true, color: '#666666', size: 'sm', flex: 5 }
                  ]
                }] : []),
                ...(appt.hospital_name ? [{
                  type: 'box',
                  layout: 'baseline',
                  spacing: 'sm',
                  contents: [
                    { type: 'text', text: 'สถานที่:', color: '#aaaaaa', size: 'sm', flex: 2 },
                    { type: 'text', text: appt.hospital_name, wrap: true, color: '#666666', size: 'sm', flex: 5 }
                  ]
                }] : []),
                ...(appt.note ? [{
                  type: 'box',
                  layout: 'baseline',
                  spacing: 'sm',
                  contents: [
                    { type: 'text', text: 'หมายเหตุ:', color: '#aaaaaa', size: 'sm', flex: 2 },
                    { type: 'text', text: appt.note, wrap: true, color: '#666666', size: 'sm', flex: 5 }
                  ]
                }] : [])
              ]
            },
            footer: {
              type: 'box',
              layout: 'vertical',
              contents: [
                {
                  type: 'button',
                  action: {
                    type: 'uri',
                    label: 'ดูรายละเอียดการนัดหมาย',
                    uri: `${liffBaseUrl}/liff/appointment`
                  },
                  style: 'primary',
                  color: '#2563EB'
                }
              ]
            }
          }
        }

        // ส่งข้อความผ่าน LINE API
        try {
          await pushMessage(appt.line_user_id, [flexMessage as any])
          notifiedCount++
        } catch (err) {
          console.error(`[Cron] Failed to send to ${appt.line_user_id}:`, err)
        }
      }
    }

    return NextResponse.json({ success: true, notifiedCount })
  } catch (err: any) {
    console.error('[Cron] Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
