import type { messagingApi } from '@line/bot-sdk'
import { formatInTimeZone } from 'date-fns-tz'
import { th } from 'date-fns/locale'

export function buildSelfExamDailyReminderMessage(
  targetDate: Date,
  liffBaseUrl: string
): messagingApi.FlexMessage {
  const dateStr = formatInTimeZone(targetDate, 'Asia/Bangkok', 'd MMMM yyyy', { locale: th })

  return {
    type: 'flex',
    altText: 'ถึงเวลาตรวจเต้านมด้วยตนเองแล้วค่ะ',
    contents: {
      type: 'bubble',
      size: 'mega',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '💖 ถึงเวลาตรวจเต้านมแล้วค่ะ',
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
        backgroundColor: '#E83E8C',
        paddingAll: '16px',
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: 'อย่าลืมสำรวจสุขภาพเต้านมของคุณเป็นประจำเพื่อความมั่นใจนะคะ',
            size: 'sm',
            color: '#333333',
            wrap: true,
            margin: 'md',
          },
          {
            type: 'box',
            layout: 'vertical',
            margin: 'lg',
            paddingAll: '12px',
            backgroundColor: '#FFF0F5',
            cornerRadius: '8px',
            contents: [
              {
                type: 'text',
                text: 'ประจำวันที่:',
                color: '#888888',
                size: 'xs',
              },
              {
                type: 'text',
                text: dateStr,
                weight: 'bold',
                size: 'md',
                color: '#E83E8C',
                margin: 'sm',
              },
            ],
          },
        ],
        paddingAll: '20px',
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'button',
            action: {
              type: 'uri',
              label: 'บันทึกผลการตรวจ',
              uri: `${liffBaseUrl}/liff/profile?tab=selfexam`
            },
            style: 'primary',
            color: '#E83E8C'
          }
        ],
        paddingAll: '16px',
      },
    },
  }
}
