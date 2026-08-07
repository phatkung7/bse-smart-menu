import { NextResponse } from 'next/server'
import { pushMessage } from '@/lib/line-client'
import { format } from 'date-fns'
import { th } from 'date-fns/locale'

export const dynamic = 'force-dynamic'

export async function GET() {
  const userId = 'U848ffd1a8d536729cfde63e144305d87'
  const reminderDays = 1
  const apptDate = new Date()
  apptDate.setDate(apptDate.getDate() + reminderDays)
  apptDate.setHours(10, 30, 0, 0)
  const dateStr = format(apptDate, 'd MMMM yyyy เวลา HH:mm น.', { locale: th })
  const liffBaseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? ''

  const flexMessage = {
    type: 'flex',
    altText: `แจ้งเตือนการนัดหมาย: ${dateStr}`,
    contents: {
      type: 'bubble',
      size: 'mega',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '⏰ แจ้งเตือนการนัดหมาย',
            weight: 'bold',
            color: '#ffffff',
            size: 'lg'
          }
        ],
        backgroundColor: '#2563EB',
        paddingAll: '16px'
      },
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'md',
        contents: [
          {
            type: 'text',
            text: `คุณมีนัดหมายในอีก ${reminderDays} วันข้างหน้า`,
            weight: 'bold',
            size: 'md',
            wrap: true,
            color: '#dc3545'
          },
          {
            type: 'box',
            layout: 'baseline',
            spacing: 'sm',
            contents: [
              { type: 'text', text: 'วันที่:', color: '#aaaaaa', size: 'sm', flex: 1 },
              { type: 'text', text: dateStr, wrap: true, color: '#666666', size: 'sm', flex: 3 }
            ]
          },
          {
            type: 'box',
            layout: 'baseline',
            spacing: 'sm',
            contents: [
              { type: 'text', text: 'แพทย์:', color: '#aaaaaa', size: 'sm', flex: 1 },
              { type: 'text', text: 'นพ. สมชาย ใจดี', wrap: true, color: '#666666', size: 'sm', flex: 3 }
            ]
          },
          {
            type: 'box',
            layout: 'baseline',
            spacing: 'sm',
            contents: [
              { type: 'text', text: 'สถานที่:', color: '#aaaaaa', size: 'sm', flex: 1 },
              { type: 'text', text: 'โรงพยาบาลภูมิพล', wrap: true, color: '#666666', size: 'sm', flex: 3 }
            ]
          },
          {
            type: 'box',
            layout: 'baseline',
            spacing: 'sm',
            contents: [
              { type: 'text', text: 'หมายเหตุ:', color: '#aaaaaa', size: 'sm', flex: 1 },
              { type: 'text', text: 'กรุณางดน้ำและอาหารก่อนมาตรวจ 8 ชั่วโมง', wrap: true, color: '#666666', size: 'sm', flex: 3 }
            ]
          }
        ]
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'button',
            action: {
              type: 'uri',
              label: 'ดูรายละเอียดการนัดหมาย',
              uri: `${liffBaseUrl}/liff/appointment`
            },
            style: 'primary',
            color: '#2563EB'
          }
        ]
      }
    }
  }

  try {
    await pushMessage(userId, [flexMessage as any])
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
