import { NextRequest, NextResponse } from 'next/server'
import * as line from '@line/bot-sdk'
import fs from 'fs/promises'
import path from 'path'

const lineClient = new line.messagingApi.MessagingApiClient({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN!,
})

const lineBlobClient = new line.messagingApi.MessagingApiBlobClient({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN!,
})

interface RichMenuArea {
  bounds: { x: number; y: number; width: number; height: number }
  action: {
    type: string
    label?: string
    uri?: string
    text?: string
    data?: string
  }
}

/**
 * Setup Rich Menu API (Run Once)
 * POST /api/setup
 * Headers: x-setup-secret: <SETUP_SECRET_KEY>
 *
 * สร้าง Rich Menu สำหรับ BSE-Smart:
 * Half size (2500x843) — 3 areas:
 * [ทำแบบสอบถาม] [ผลการประเมิน] [ข้อมูลมะเร็งเต้านม]
 */
export async function POST(req: NextRequest) {
  // Protect with secret key
  const secret = req.headers.get('x-setup-secret')
  if (secret !== process.env.SETUP_SECRET_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const liffBaseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? ''
  const liffQuizUrl = `https://liff.line.me/${process.env.NEXT_PUBLIC_LIFF_ID}`

  try {
    // Step 1: Create Rich Menu
    const richMenuSpec = {
      size: { width: 2500, height: 843 },
      selected: true,
      name: 'BSE-Smart Main Menu',
      chatBarText: 'เมนู BSE-Smart',
      areas: [
        // Area 1: ทำแบบสอบถาม (ซ้าย)
        {
          bounds: { x: 0, y: 0, width: 833, height: 843 },
          action: {
            type: 'uri',
            label: 'ทำแบบสอบถาม',
            uri: liffQuizUrl,
          },
        } as RichMenuArea,
        // Area 2: ผลการประเมิน (กลาง)
        {
          bounds: { x: 833, y: 0, width: 834, height: 843 },
          action: {
            type: 'uri',
            label: 'ผลการประเมิน',
            uri: `${liffBaseUrl}/liff/result`,
          },
        } as RichMenuArea,
        // Area 3: ข้อมูลมะเร็งเต้านม (ขวา) — placeholder
        {
          bounds: { x: 1667, y: 0, width: 833, height: 843 },
          action: {
            type: 'message',
            label: 'ข้อมูลมะเร็งเต้านม',
            text: 'ข้อมูลมะเร็งเต้านม',
          },
        } as RichMenuArea,
      ],
    }

    // @ts-ignore — LINE SDK type for richMenuSpec
    const createResult = await lineClient.createRichMenu(richMenuSpec)
    const richMenuId = createResult.richMenuId
    console.log('[Setup] Rich Menu created:', richMenuId)

    // Step 2: Upload Image (ถ้ามี)
    const imagePath = path.join(process.cwd(), 'public', 'rich-menu.png')
    try {
      const imageBuffer = await fs.readFile(imagePath)
      await lineBlobClient.setRichMenuImage(richMenuId, new Blob([imageBuffer], { type: 'image/png' }))
      console.log('[Setup] Rich Menu image uploaded')
    } catch {
      console.warn('[Setup] No rich-menu.png found in /public — using default')
    }

    // Step 3: Set as Default for all users
    await lineClient.setDefaultRichMenu(richMenuId)
    console.log('[Setup] Rich Menu set as default')

    return NextResponse.json({
      success: true,
      richMenuId,
      message: 'Rich Menu created and set as default successfully',
    })
  } catch (error: any) {
    console.error('[Setup] Rich Menu setup failed:', error)
    return NextResponse.json(
      { error: 'Setup failed', details: error?.message },
      { status: 500 }
    )
  }
}
