import { NextRequest, NextResponse } from 'next/server'
import { verifyLineSignature, getUserProfile, replyMessage } from '@/lib/line-client'
import { supabaseAdmin } from '@/lib/supabase'
import { buildWelcomeMessage } from '@/lib/line-messages/welcome'

/**
 * LINE Webhook Handler
 * POST /api/webhook
 *
 * Events handled:
 * - follow   → upsert user + send welcome message
 * - unfollow → mark user as inactive
 */
export async function POST(req: NextRequest) {
  // 1. ดึง raw body (ต้องใช้ raw string สำหรับ verify signature)
  const rawBody = await req.text()
  const signature = req.headers.get('x-line-signature')

  // 2. Verify Signature
  if (!signature || !verifyLineSignature(rawBody, signature)) {
    console.warn('[Webhook] Invalid signature')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 3. Parse events
  let body: { events: any[] }
  try {
    body = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // 4. ตอบ 200 ทันที แล้ว process async
  //    (LINE ต้องการ response ภายใน 2 วินาที)
  const { events } = body
  processEvents(events).catch((err) =>
    console.error('[Webhook] processEvents error:', err)
  )

  return NextResponse.json({ status: 'ok' })
}

async function processEvents(events: any[]): Promise<void> {
  for (const event of events) {
    try {
      await handleEvent(event)
    } catch (err) {
      console.error(`[Webhook] Event ${event.webhookEventId} failed:`, err)
    }
  }
}

async function handleEvent(event: any): Promise<void> {
  const userId = event.source?.userId
  if (!userId) return

  switch (event.type) {
    case 'follow':
      await handleFollowEvent(event, userId)
      break

    case 'unfollow':
      await handleUnfollowEvent(userId)
      break

    default:
      // Events อื่น (message, postback) — ไม่ใช้ใน Feature นี้
      break
  }
}

/**
 * Follow Event: ผู้ใช้ Add หรือ Unblock LINE OA
 */
async function handleFollowEvent(event: any, userId: string): Promise<void> {
  // ดึง Profile จาก LINE
  const profile = await getUserProfile(userId)

  // Upsert user ใน Supabase
  await supabaseAdmin
    .from('users')
    .upsert(
      {
        line_user_id: userId,
        display_name: profile?.displayName ?? null,
        picture_url: profile?.pictureUrl ?? null,
        is_active: true,
        followed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'line_user_id' }
    )

  // ส่ง Welcome Message
  const liffUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/liff/quiz`
  const displayName = profile?.displayName ?? 'คุณ'
  const welcomeMsg = buildWelcomeMessage(displayName, liffUrl)

  if (event.replyToken) {
    await replyMessage(event.replyToken, [welcomeMsg])
  }
}

/**
 * Unfollow Event: ผู้ใช้ Block LINE OA
 */
async function handleUnfollowEvent(userId: string): Promise<void> {
  await supabaseAdmin
    .from('users')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('line_user_id', userId)
}
