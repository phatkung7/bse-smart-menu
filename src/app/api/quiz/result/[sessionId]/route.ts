import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * Get Quiz Result by Session ID
 * GET /api/quiz/result/[sessionId]
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params

  if (!sessionId) {
    return NextResponse.json({ error: 'sessionId is required' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('quiz_results')
    .select('*')
    .eq('session_id', sessionId)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Result not found' }, { status: 404 })
  }

  // ดึง answers ด้วย
  const { data: answers } = await supabaseAdmin
    .from('quiz_answers')
    .select('question_number, score')
    .eq('session_id', sessionId)
    .order('question_number')

  return NextResponse.json({
    session_id: sessionId,
    total_score: data.total_score,
    literacy_level: data.literacy_level,
    completed_at: data.completed_at,
    answers: answers ?? [],
  })
}
