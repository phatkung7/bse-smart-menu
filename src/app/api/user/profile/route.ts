import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { linkRichMenuToUser } from '@/lib/line-client'

const RICH_MENU_MAP: Record<string, string | undefined> = {
  low: process.env.RICH_MENU_ID_LOW,
  medium: process.env.RICH_MENU_ID_MEDIUM,
  high: process.env.RICH_MENU_ID_HIGH,
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const lineUserId = searchParams.get('line_user_id')

  if (!lineUserId) {
    return NextResponse.json({ error: 'line_user_id is required' }, { status: 400 })
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('tester_id, display_name, picture_url')
      .eq('line_user_id', lineUserId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // User not found, just return empty data
        return NextResponse.json({ data: null })
      }
      throw error
    }

    // --- ดึงผลคัดกรองล่าสุด แล้ว set Rich Menu ให้ทันที ---
    const { data: latestResult } = await supabaseAdmin
      .from('quiz_results')
      .select('literacy_level')
      .eq('line_user_id', lineUserId)
      .order('completed_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const hasCompletedQuiz = !!latestResult?.literacy_level

    if (latestResult?.literacy_level) {
      const richMenuId = RICH_MENU_MAP[latestResult.literacy_level]
      if (richMenuId) {
        linkRichMenuToUser(lineUserId, richMenuId).catch((err) =>
          console.error('[User Profile API] Link rich menu failed:', err)
        )
      }
    }

    return NextResponse.json({ data, has_completed_quiz: hasCompletedQuiz })
  } catch (err: any) {
    console.error('[User Profile API] Error fetching user:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
