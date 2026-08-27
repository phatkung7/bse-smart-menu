import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyLiffToken } from '@/lib/liff-auth'
import { verifyAdmin } from '@/lib/admin-auth'
import { linkRichMenuToUser } from '@/lib/line-client'

const RICH_MENU_MAP: Record<string, string | undefined> = {
  low: process.env.RICH_MENU_ID_LOW,
  medium: process.env.RICH_MENU_ID_MEDIUM,
  high: process.env.RICH_MENU_ID_HIGH,
}

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * PUT /api/admin/users/[id]/level
 * แก้ไขระดับ literacy_level ของ user + เปลี่ยน Rich Menu
 * id = line_user_id
 */
export async function PUT(req: NextRequest, { params }: RouteParams) {
  const { id: lineUserId } = await params

  // 1. Auth
  const id_token = req.headers.get('x-id-token')
  const admin_line_user_id = req.headers.get('x-line-user-id') ?? undefined
  const { error, userId } = await verifyLiffToken(id_token, admin_line_user_id)
  if (error || !userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!verifyAdmin(userId)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // 2. Parse body
  let body: { literacy_level: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { literacy_level } = body
  if (!['low', 'medium', 'high'].includes(literacy_level)) {
    return NextResponse.json({ error: 'Invalid literacy_level' }, { status: 400 })
  }

  try {
    // 3. Check if user has quiz_results
    const { data: existingResult } = await supabaseAdmin
      .from('quiz_results')
      .select('id')
      .eq('line_user_id', lineUserId)
      .order('completed_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (existingResult) {
      // Update existing latest result
      await supabaseAdmin
        .from('quiz_results')
        .update({ literacy_level })
        .eq('id', existingResult.id)
    } else {
      // Create a new quiz result with admin-set level
      // Need to create a session first
      const { data: session } = await supabaseAdmin
        .from('quiz_sessions')
        .insert({
          line_user_id: lineUserId,
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .select('id')
        .single()

      if (session) {
        const scoreMap: Record<string, number> = { low: 24, medium: 48, high: 72 }
        await supabaseAdmin
          .from('quiz_results')
          .insert({
            session_id: session.id,
            line_user_id: lineUserId,
            total_score: scoreMap[literacy_level],
            literacy_level,
          })
      }
    }

    // 4. Link Rich Menu
    const richMenuId = RICH_MENU_MAP[literacy_level]
    if (richMenuId) {
      await linkRichMenuToUser(lineUserId, richMenuId)
    }

    return NextResponse.json({ success: true, literacy_level })
  } catch (err: any) {
    console.error('[Admin Level] Error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
