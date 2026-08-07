import type { messagingApi } from '@line/bot-sdk'
import { format, addDays } from 'date-fns'
import { th } from 'date-fns/locale'

/**
 * Menstrual Reminder Flex Message
 * ส่งหลังบันทึกวันประจำเดือน แจ้งวันแนะนำตรวจเต้านม
 */
export function buildMenstrualReminderMessage(
  periodStartDate: Date,
  liffBaseUrl: string
): messagingApi.FlexMessage {
  const checkStart = addDays(periodStartDate, 7)
  const checkEnd = addDays(periodStartDate, 10)

  const periodStr = format(periodStartDate, 'd MMMM yyyy', { locale: th })
  const checkStartStr = format(checkStart, 'd MMMM', { locale: th })
  const checkEndStr = format(checkEnd, 'd MMMM yyyy', { locale: th })

  const profileUrl = `${liffBaseUrl}/liff/profile`

  return {
    type: 'flex',
    altText: `บันทึกวันประจำเดือน ${periodStr} — แนะนำตรวจเต้านม ${checkStartStr}–${checkEndStr}`,
    contents: {
      type: 'bubble',
      size: 'mega',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '🎗️ บันทึกประจำเดือนสำเร็จ',
            color: '#FFFFFF',
            size: 'md',
            weight: 'bold',
          },
          {
            type: 'text',
            text: 'BSE smart menu',
            color: '#FFD0E8',
            size: 'xs',
          },
        ],
        backgroundColor: '#2563EB',
        paddingAll: '16px',
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: '📅 วันที่ประจำเดือนมา',
                size: 'xs',
                color: '#888888',
              },
              {
                type: 'text',
                text: periodStr,
                size: 'lg',
                weight: 'bold',
                color: '#1a1a2e',
                margin: 'xs',
              },
            ],
            paddingAll: '12px',
            backgroundColor: '#EFF6FF',
            cornerRadius: '10px',
          },
          {
            type: 'separator',
            margin: 'lg',
            color: '#EEEEEE',
          },
          {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: '✅ วันแนะนำตรวจเต้านมด้วยตนเอง',
                size: 'sm',
                color: '#1D4ED8',
                weight: 'bold',
                wrap: true,
                margin: 'md',
              },
              {
                type: 'text',
                text: `${checkStartStr} – ${checkEndStr}`,
                size: 'lg',
                weight: 'bold',
                color: '#D63384',
                wrap: true,
                margin: 'sm',
              },
              {
                type: 'text',
                text: 'หลังจากหมดประจำเดือนแล้ว 7–10 วัน เป็นช่วงเวลาที่เต้านมนุ่มที่สุด เหมาะสำหรับการตรวจด้วยตนเอง',
                size: 'xs',
                color: '#666666',
                wrap: true,
                margin: 'sm',
              },
            ],
          },
        ],
        paddingAll: '20px',
      },
    },
  }
}
