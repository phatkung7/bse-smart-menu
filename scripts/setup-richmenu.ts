#!/usr/bin/env tsx
/**
 * BSE-Smart: Rich Menu Setup Script
 * รันครั้งเดียวเพื่อสร้าง Rich Menu ใน LINE OA
 *
 * Usage:
 *   npm run setup:richmenu
 *   หรือ: npx tsx scripts/setup-richmenu.ts
 *
 * ต้องตั้งค่า .env.local ก่อน
 */

import * as fs from 'fs/promises'
import * as path from 'path'
import * as https from 'https'
import * as http from 'http'

// โหลด env vars จาก .env.local
async function loadEnv() {
  try {
    const envPath = path.join(process.cwd(), '.env.local')
    const content = await fs.readFile(envPath, 'utf-8')
    for (const line of content.split('\n')) {
      const [key, ...rest] = line.split('=')
      if (key && rest.length > 0) {
        process.env[key.trim()] = rest.join('=').trim()
      }
    }
  } catch {
    console.warn('ไม่พบ .env.local — ใช้ environment variables ที่มีอยู่')
  }
}

function lineRequest(
  method: string,
  path: string,
  body?: object,
  imageBuffer?: Buffer,
  mimeType?: string
): Promise<any> {
  return new Promise((resolve, reject) => {
    const token = process.env.LINE_CHANNEL_ACCESS_TOKEN
    const isDataApi = path.includes('/content')
    const hostname = isDataApi ? 'api-data.line.me' : 'api.line.me'
    const bodyStr = imageBuffer ? undefined : body ? JSON.stringify(body) : undefined

    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
    }
    if (imageBuffer && mimeType) {
      headers['Content-Type'] = mimeType
      headers['Content-Length'] = String(imageBuffer.length)
    } else if (bodyStr) {
      headers['Content-Type'] = 'application/json'
      headers['Content-Length'] = String(Buffer.byteLength(bodyStr))
    }

    const req = https.request(
      { hostname, path, method, headers },
      (res) => {
        let data = ''
        res.on('data', (chunk) => (data += chunk))
        res.on('end', () => {
          try {
            resolve(data ? JSON.parse(data) : {})
          } catch {
            resolve({ raw: data })
          }
        })
      }
    )

    req.on('error', reject)
    if (imageBuffer) {
      req.write(imageBuffer)
    } else if (bodyStr) {
      req.write(bodyStr)
    }
    req.end()
  })
}

async function main() {
  await loadEnv()

  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN
  const liffId = process.env.NEXT_PUBLIC_LIFF_ID
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://your-app.vercel.app'

  if (!token) {
    console.error('❌ LINE_CHANNEL_ACCESS_TOKEN ไม่ได้ตั้งค่า')
    process.exit(1)
  }

  console.log('🚀 BSE-Smart Rich Menu Setup')
  console.log('================================')

  const liffUrl = liffId
    ? `https://liff.line.me/${liffId}`
    : `${baseUrl}/liff/quiz`

  // Step 1: Create Rich Menu
  console.log('\n📋 Step 1: Creating Rich Menu...')
  const richMenuSpec = {
    size: { width: 2500, height: 843 },
    selected: true,
    name: 'BSE-Smart Main Menu',
    chatBarText: '📋 เมนู BSE-Smart',
    areas: [
      {
        bounds: { x: 0, y: 0, width: 833, height: 843 },
        action: {
          type: 'uri',
          label: 'ทำแบบสอบถาม',
          uri: liffUrl,
        },
      },
      {
        bounds: { x: 833, y: 0, width: 834, height: 843 },
        action: {
          type: 'uri',
          label: 'ผลการประเมิน',
          uri: `${baseUrl}/liff/result`,
        },
      },
      {
        bounds: { x: 1667, y: 0, width: 833, height: 843 },
        action: {
          type: 'message',
          label: 'ข้อมูลมะเร็งเต้านม',
          text: 'ข้อมูลมะเร็งเต้านม',
        },
      },
    ],
  }

  const created = await lineRequest('POST', '/v2/bot/richmenu', richMenuSpec)
  if (!created.richMenuId) {
    console.error('❌ ไม่สามารถสร้าง Rich Menu ได้:', JSON.stringify(created))
    process.exit(1)
  }

  const richMenuId = created.richMenuId
  console.log(`✅ Rich Menu created: ${richMenuId}`)

  // Step 2: Upload Image (optional)
  console.log('\n🖼️  Step 2: Uploading Rich Menu image...')
  const imagePath = path.join(process.cwd(), 'public', 'rich-menu.png')
  try {
    const imageBuffer = await fs.readFile(imagePath)
    await lineRequest(
      'POST',
      `/v2/bot/richmenu/${richMenuId}/content`,
      undefined,
      imageBuffer,
      'image/png'
    )
    console.log('✅ Image uploaded')
  } catch {
    console.warn(
      '⚠️  ไม่พบ public/rich-menu.png — ข้ามขั้นตอนนี้\n   กรุณาอัปโหลด image ผ่าน LINE OA Manager ภายหลัง'
    )
  }

  // Step 3: Set as Default
  console.log('\n🔧 Step 3: Setting as default Rich Menu...')
  await lineRequest('POST', `/v2/bot/user/all/richmenu/${richMenuId}`)
  console.log('✅ Set as default')

  console.log('\n================================')
  console.log('🎉 Rich Menu Setup Complete!')
  console.log(`   Rich Menu ID: ${richMenuId}`)
  console.log(`   LIFF URL: ${liffUrl}`)
  console.log('\n📌 Next Steps:')
  console.log('   1. ตรวจสอบ Rich Menu ใน LINE OA Manager')
  console.log('   2. อัปโหลดรูปภาพ rich-menu.png (ถ้ายังไม่ได้ทำ)')
  console.log('   3. ทดสอบโดย Add LINE OA เป็นเพื่อน')
}

main().catch((err) => {
  console.error('❌ Error:', err)
  process.exit(1)
})
