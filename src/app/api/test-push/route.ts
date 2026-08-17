import { NextResponse } from 'next/server'
import { pushMessage } from '@/lib/line-client'
import { formatInTimeZone } from 'date-fns-tz'
import { th } from 'date-fns/locale'
import { buildMenstrualReminderMessage } from '@/lib/line-messages/menstrual-reminder'

export const dynamic = 'force-dynamic'

export async function GET() {
  const userId = 'U848ffd1a8d536729cfde63e144305d87'
  const reminderDays = 1
  const apptDate = new Date()
  apptDate.setDate(apptDate.getDate() + reminderDays)
  apptDate.setHours(10, 30, 0, 0)
  const dateStr = formatInTimeZone(apptDate, 'Asia/Bangkok', 'd MMMM yyyy เวลา HH:mm น.', { locale: th })
  const liffBaseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? ''

  const flexMessage = buildMenstrualReminderMessage(apptDate, liffBaseUrl)

  try {
    await pushMessage(userId, [flexMessage as any])
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
