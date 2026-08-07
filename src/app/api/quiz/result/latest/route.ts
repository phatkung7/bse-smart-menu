import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * GET /api/quiz/result/latest
 * ดึงผลการประเมินล่าสุดของผู้ใช้ (สำหรับหน้า Profile)
 */
export async function GET(req: NextRequest) {
  const lineUserId = req.nextUrl.searchParams.get('line_user_id')
  if (!lineUserId) {
    return NextResponse.json({ error: 'line_user_id is required' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('quiz_results')
    .select('total_score, literacy_level, completed_at')
    .eq('line_user_id', lineUserId)
    .order('completed_at', { ascending: false })
    .limit(1)
    .single()

  if (error) {
    return NextResponse.json({ result: null })
  }

  return NextResponse.json({ result: data })
}
