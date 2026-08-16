import type { messagingApi } from '@line/bot-sdk'
import { formatInTimeZone } from 'date-fns-tz'
import { th } from 'date-fns/locale'

export function buildSelfExamSuccessMessage(
  examDate: Date,
  note: string,
  liffBaseUrl: string
): messagingApi.FlexMessage {
  const dateStr = formatInTimeZone(examDate, 'Asia/Bangkok', 'd MMMM yyyy', { locale: th })

  return {
    type: 'flex',
    altText: `บันทึกผลการตรวจเต้านมสำเร็จ วันที่ ${dateStr}`,
    contents: {
      type: 'bubble',
      size: 'mega',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '💖 บันทึกผลตรวจสำเร็จ',
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
        backgroundColor: '#D63384',
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
                text: '📅 วันที่ตรวจ',
                size: 'xs',
                color: '#888888',
              },
              {
                type: 'text',
                text: dateStr,
                size: 'lg',
                weight: 'bold',
                color: '#1a1a2e',
                margin: 'xs',
              },
            ],
            paddingAll: '12px',
            backgroundColor: '#FFF0F5',
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
                text: '📝 ผลการตรวจ / บันทึก',
                size: 'sm',
                color: '#D63384',
                weight: 'bold',
                margin: 'md',
              },
              {
                type: 'text',
                text: note,
                size: 'sm',
                color: '#333333',
                wrap: true,
                margin: 'sm',
              },
            ],
          },
        ],
        paddingAll: '20px',
      }
    },
  }
}
