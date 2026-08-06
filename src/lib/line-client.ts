import * as line from '@line/bot-sdk'
import * as crypto from 'crypto'

// Lazy LINE client — initialized on first use
let _lineClient: line.messagingApi.MessagingApiClient | null = null

export function getLineClient(): line.messagingApi.MessagingApiClient {
  if (!_lineClient) {
    _lineClient = new line.messagingApi.MessagingApiClient({
      channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN!,
    })
  }
  return _lineClient
}

// Convenience proxy for backwards-compat (used in webhook route)
export const lineClient = new Proxy({} as line.messagingApi.MessagingApiClient, {
  get(_target, prop) {
    return (getLineClient() as any)[prop]
  },
})

/**
 * Verify LINE Webhook Signature (HMAC-SHA256)
 * ต้องใช้ raw body string (ไม่ใช่ parsed JSON)
 */
export function verifyLineSignature(rawBody: string, signature: string): boolean {
  try {
    const channelSecret = process.env.LINE_CHANNEL_SECRET!
    const hash = crypto
      .createHmac('sha256', channelSecret)
      .update(rawBody)
      .digest('base64')

    // Constant-time comparison เพื่อป้องกัน timing attacks
    return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(signature))
  } catch {
    return false
  }
}

/**
 * ส่ง Push Message ไปหา user คนเดียว
 */
export async function pushMessage(
  userId: string,
  messages: line.messagingApi.Message[]
): Promise<void> {
  try {
    await lineClient.pushMessage({
      to: userId,
      messages,
    })
  } catch (error) {
    console.error(`[LINE] Push message to ${userId} failed:`, error)
    throw error
  }
}

/**
 * ส่ง Reply Message (ใช้ replyToken — ฟรี!)
 */
export async function replyMessage(
  replyToken: string,
  messages: line.messagingApi.Message[]
): Promise<void> {
  try {
    await lineClient.replyMessage({
      replyToken,
      messages,
    })
  } catch (error) {
    console.error('[LINE] Reply message failed:', error)
    throw error
  }
}

/**
 * ดึงข้อมูล Profile ของ user
 */
export async function getUserProfile(userId: string) {
  try {
    return await lineClient.getProfile(userId)
  } catch (error) {
    console.error(`[LINE] Get profile for ${userId} failed:`, error)
    return null
  }
}
