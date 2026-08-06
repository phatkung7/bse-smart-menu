import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { pushMessage } from '@/lib/line-client'
import { calculateQuizResult, validateAnswers } from '@/lib/quiz-calculator'
import { buildResultNotificationMessage } from '@/lib/line-messages/result-notification'
import { TOTAL_QUESTIONS } from '@/data/questions'

interface SubmitBody {
  id_token?: string | null
  line_user_id: string
  display_name?: string
  picture_url?: string
  answers: { question_number: number; score: number }[]
}

/**
 * Quiz Submit API
 * POST /api/quiz/submit
 *
 * Body: { line_user_id, answers: [{question_number, score}] }
 * Response: { success, session_id, total_score, literacy_level }
 */
export async function POST(req: NextRequest) {
  let body: SubmitBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  let { id_token, line_user_id, display_name, picture_url, answers } = body

  // --- Verify LIFF ID Token ---
  if (id_token) {
    try {
      const params = new URLSearchParams()
      params.append('id_token', id_token)
      const channelId = process.env.NEXT_PUBLIC_LIFF_ID!.split('-')[0]
      params.append('client_id', channelId)

      const verifyRes = await fetch('https://api.line.me/oauth2/v2.1/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      })
      
      const verifyData = await verifyRes.json()

      if (!verifyRes.ok) {
        console.error('[Quiz Submit] Token verify failed:', verifyData)
        return NextResponse.json({ error: 'Invalid ID token' }, { status: 401 })
      }

      line_user_id = verifyData.sub
      display_name = verifyData.name || display_name
      picture_url = verifyData.picture || picture_url
    } catch (err) {
      console.error('[Quiz Submit] Verify error:', err)
      return NextResponse.json({ error: 'Failed to verify token' }, { status: 500 })
    }
  }

  // --- Validation ---
  if (!line_user_id || typeof line_user_id !== 'string') {
    return NextResponse.json({ error: 'line_user_id is required' }, { status: 400 })
  }
  if (!Array.isArray(answers) || answers.length !== TOTAL_QUESTIONS) {
    return NextResponse.json(
      { error: `answers must be an array of ${TOTAL_QUESTIONS} items` },
      { status: 400 }
    )
  }

  // แปลง array → map สำหรับ validate
  const answersMap: Record<number, number> = {}
  for (const a of answers) {
    if (
      typeof a.question_number !== 'number' ||
      typeof a.score !== 'number' ||
      a.score < 1 ||
      a.score > 3 ||
      a.question_number < 1 ||
      a.question_number > TOTAL_QUESTIONS
    ) {
      return NextResponse.json(
        { error: 'Invalid answer format. score must be 1-3, question_number must be 1-24' },
        { status: 400 }
      )
    }
    answersMap[a.question_number] = a.score
  }

  if (!validateAnswers(answersMap, TOTAL_QUESTIONS)) {
    return NextResponse.json({ error: 'Incomplete or invalid answers' }, { status: 400 })
  }

  // --- Ensure user exists ---
  const { error: userError } = await supabaseAdmin
    .from('users')
    .upsert(
      {
        line_user_id,
        display_name: display_name ?? null,
        picture_url: picture_url ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'line_user_id', ignoreDuplicates: false }
    )
  if (userError) {
    console.error('[Quiz Submit] User upsert error:', userError)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  // --- Create quiz session ---
  const { data: session, error: sessionError } = await supabaseAdmin
    .from('quiz_sessions')
    .insert({
      line_user_id,
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (sessionError || !session) {
    console.error('[Quiz Submit] Session create error:', sessionError)
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
  }

  const sessionId = session.id

  // --- Insert all answers ---
  const answerRows = answers.map((a) => ({
    session_id: sessionId,
    question_number: a.question_number,
    score: a.score,
  }))

  const { error: answersError } = await supabaseAdmin.from('quiz_answers').insert(answerRows)

  if (answersError) {
    console.error('[Quiz Submit] Answers insert error:', answersError)
    return NextResponse.json({ error: 'Failed to save answers' }, { status: 500 })
  }

  // --- Calculate result ---
  const scores = answers.map((a) => a.score)
  const result = calculateQuizResult(scores)

  // --- Save result ---
  const { error: resultError } = await supabaseAdmin.from('quiz_results').insert({
    session_id: sessionId,
    line_user_id,
    total_score: result.totalScore,
    literacy_level: result.literacyLevel,
  })

  if (resultError) {
    console.error('[Quiz Submit] Result insert error:', resultError)
    return NextResponse.json({ error: 'Failed to save result' }, { status: 500 })
  }

  // --- Push result notification via LINE (non-blocking) ---
  const liffBaseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? ''
  const resultMsg = buildResultNotificationMessage(result, sessionId, liffBaseUrl)
  pushMessage(line_user_id, [resultMsg]).catch((err) =>
    console.error('[Quiz Submit] Push message failed:', err)
  )

  return NextResponse.json({
    success: true,
    session_id: sessionId,
    total_score: result.totalScore,
    average_score: result.averageScore,
    literacy_level: result.literacyLevel,
    level_text: result.levelText,
  })
}
