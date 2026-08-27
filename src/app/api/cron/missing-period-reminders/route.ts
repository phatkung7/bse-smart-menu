import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { pushMessage } from '@/lib/line-client'
import { differenceInDays, startOfDay } from 'date-fns'
import { buildMissingPeriodReminderMessage } from '@/lib/line-messages/missing-period-reminder'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  // 1. Security Check
  const authHeader = req.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const today = new Date()

    // 2. Fetch all menstrual records
    const { data: menstrualRecords, error: mrError } = await supabaseAdmin
      .from('menstrual_records')
      .select('line_user_id, period_start_date')
      
    if (mrError) {
      console.error('[MissingPeriodCron] DB Error:', mrError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    if (!menstrualRecords || menstrualRecords.length === 0) {
      return NextResponse.json({ success: true, message: 'No records found' })
    }

    let notifiedCount = 0
    const liffBaseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? ''

    // Group to find the latest record per user
    const latestRecordsMap = new Map<string, string>() // Map<line_user_id, period_start_date>
    for (const record of menstrualRecords) {
      const existingDate = latestRecordsMap.get(record.line_user_id)
      if (!existingDate || new Date(record.period_start_date) > new Date(existingDate)) {
        latestRecordsMap.set(record.line_user_id, record.period_start_date)
      }
    }

    for (const [userId, periodStartDateStr] of Array.from(latestRecordsMap.entries())) {
      const periodDate = new Date(periodStartDateStr)
      const daysDiff = differenceInDays(startOfDay(today), startOfDay(periodDate))

      // 3. Filter for exactly 31 days since last period start
      if (daysDiff === 31) {
        const msg = buildMissingPeriodReminderMessage(liffBaseUrl)
        try {
          await pushMessage(userId, [msg])
          notifiedCount++
        } catch (err) {
          console.error(`[MissingPeriodCron] Failed to push message to ${userId}:`, err)
        }
      }
    }

    return NextResponse.json({ success: true, notifiedCount })
  } catch (err: any) {
    console.error('[MissingPeriodCron] Uncaught Exception:', err)
    return NextResponse.json({ error: 'Internal Server Error: ' + err.message }, { status: 500 })
  }
}
