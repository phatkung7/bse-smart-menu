import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

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

    return NextResponse.json({ data })
  } catch (err: any) {
    console.error('[User Profile API] Error fetching user:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
