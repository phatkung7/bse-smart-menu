import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { pushMessage } from '@/lib/line-client'
import { differenceInDays, startOfDay } from 'date-fns'
import { buildSelfExamDailyReminderMessage } from '@/lib/line-messages/self-exam-daily-reminder'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  // 1. Security Check
  const authHeader = req.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const today = new Date()

    // 2. Fetch all menstrual records and self exam expected dates
    const { data: menstrualRecords, error: mrError } = await supabaseAdmin
      .from('menstrual_records')
      .select('line_user_id, period_start_date')
      
    if (mrError) {
      console.error('[MenstrualCron] DB Error:', mrError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    const { data: selfExamExpectedRecords, error: seError } = await supabaseAdmin
      .from('self_exam_records')
      .select('line_user_id, next_expected_period_date')
      .not('next_expected_period_date', 'is', null)

    if (seError) {
      console.error('[MenstrualCron] DB Error (self exam):', seError)
      // Continue anyway, just without expected dates
    }

    let notifiedCount = 0
    const liffBaseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? ''

    // Group the latest record per user from both sources
    const latestRecordsMap = new Map<string, string>() // Map<line_user_id, period_start_date>
    
    // Add actual menstrual dates
    if (menstrualRecords) {
      for (const record of menstrualRecords) {
        const existingDate = latestRecordsMap.get(record.line_user_id)
        if (!existingDate || new Date(record.period_start_date) > new Date(existingDate)) {
          latestRecordsMap.set(record.line_user_id, record.period_start_date)
        }
      }
    }

    // Compare with and add expected menstrual dates
    if (selfExamExpectedRecords) {
      for (const record of selfExamExpectedRecords) {
        if (!record.next_expected_period_date) continue;
        const existingDate = latestRecordsMap.get(record.line_user_id)
        if (!existingDate || new Date(record.next_expected_period_date) > new Date(existingDate)) {
          latestRecordsMap.set(record.line_user_id, record.next_expected_period_date)
        }
      }
    }

    if (latestRecordsMap.size === 0) {
      return NextResponse.json({ success: true, message: 'No records found' })
    }

    for (const [userId, periodStartDateStr] of Array.from(latestRecordsMap.entries())) {
      const periodDate = new Date(periodStartDateStr)
      const daysDiff = differenceInDays(startOfDay(today), startOfDay(periodDate))

      // 3. Filter for 7 to 10 days since period start
      if (daysDiff >= 7 && daysDiff <= 10) {
        
        // 4. Check if the user has already performed a self-exam in this window
        // i.e., exam_date >= periodDate + 7 days
        // We can just check if any self_exam_record exists for this user where exam_date >= (periodDate + 7 days)
        const checkStartDate = new Date(periodDate)
        checkStartDate.setDate(checkStartDate.getDate() + 7)
        
        const { data: examRecords, error: examError } = await supabaseAdmin
          .from('self_exam_records')
          .select('id')
          .eq('line_user_id', userId)
          .gte('exam_date', checkStartDate.toISOString().split('T')[0])
          .limit(1)

        if (examError) {
          console.error(`[MenstrualCron] Error fetching exams for user ${userId}:`, examError)
          continue
        }

        // If no exam records found in this window, send reminder
        if (!examRecords || examRecords.length === 0) {
          const msg = buildSelfExamDailyReminderMessage(today, liffBaseUrl)
          try {
            await pushMessage(userId, [msg])
            notifiedCount++
          } catch (err) {
            console.error(`[MenstrualCron] Failed to push message to ${userId}:`, err)
          }
        }
      }
    }

    return NextResponse.json({ success: true, notifiedCount })
  } catch (err: any) {
    console.error('[MenstrualCron] Uncaught Exception:', err)
    return NextResponse.json({ error: 'Internal Server Error: ' + err.message }, { status: 500 })
  }
}
