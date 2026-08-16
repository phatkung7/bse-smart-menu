import type { messagingApi } from '@line/bot-sdk'
import { formatInTimeZone } from 'date-fns-tz'
import { th } from 'date-fns/locale'

export function buildAppointmentSuccessMessage(
  appointmentDate: Date,
  doctorName: string,
  hospitalName: string,
  note: string,
  liffBaseUrl: string,
  reminderDays?: number
): messagingApi.FlexMessage {
  const dateStr = formatInTimeZone(appointmentDate, 'Asia/Bangkok', 'd MMMM yyyy เวลา HH:mm น.', { locale: th })

  const contentBlocks: messagingApi.FlexComponent[] = []
  
  if (doctorName) {
    contentBlocks.push({
      type: 'box',
      layout: 'baseline',
      spacing: 'sm',
      contents: [
        { type: 'text', text: '👨‍⚕️ แพทย์:', color: '#aaaaaa', size: 'sm', flex: 2 },
        { type: 'text', text: doctorName, wrap: true, color: '#666666', size: 'sm', flex: 5 },
      ],
    })
  }

  if (hospitalName) {
    contentBlocks.push({
      type: 'box',
      layout: 'baseline',
      spacing: 'sm',
      contents: [
        { type: 'text', text: '🏥 รพ.:', color: '#aaaaaa', size: 'sm', flex: 2 },
        { type: 'text', text: hospitalName, wrap: true, color: '#666666', size: 'sm', flex: 5 },
      ],
    })
  }

  if (note) {
    contentBlocks.push({
      type: 'box',
      layout: 'baseline',
      spacing: 'sm',
      contents: [
        { type: 'text', text: '📝 โน้ต:', color: '#aaaaaa', size: 'sm', flex: 2 },
        { type: 'text', text: note, wrap: true, color: '#666666', size: 'sm', flex: 5 },
      ],
    })
  }

  if (reminderDays && reminderDays > 0) {
    const notifDate = new Date(appointmentDate)
    notifDate.setDate(notifDate.getDate() - reminderDays)
    const notifDateStr = formatInTimeZone(notifDate, 'Asia/Bangkok', 'd MMMM yyyy', { locale: th })

    contentBlocks.push({
      type: 'box',
      layout: 'baseline',
      spacing: 'sm',
      contents: [
        { type: 'text', text: '🔔 แจ้งเตือน:', color: '#aaaaaa', size: 'sm', flex: 2 },
        { type: 'text', text: `ล่วงหน้า ${reminderDays} วัน (${notifDateStr})`, wrap: true, color: '#2563EB', size: 'sm', flex: 5, weight: 'bold' },
      ],
    })
  }

  return {
    type: 'flex',
    altText: `นัดหมายสำเร็จ วันที่ ${dateStr}`,
    contents: {
      type: 'bubble',
      size: 'mega',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '📅 บันทึกการนัดหมายสำเร็จ',
            color: '#FFFFFF',
            size: 'md',
            weight: 'bold',
          },
          {
            type: 'text',
            text: 'BSE smart menu',
            color: '#D1E8FF',
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
                text: 'เวลานัดหมาย',
                size: 'xs',
                color: '#888888',
              },
              {
                type: 'text',
                text: dateStr,
                size: 'md',
                weight: 'bold',
                color: '#1a1a2e',
                margin: 'xs',
                wrap: true
              },
            ],
            paddingAll: '12px',
            backgroundColor: '#F3F4F6',
            cornerRadius: '10px',
            margin: 'md'
          },
          ...(contentBlocks.length > 0 ? [
            {
              type: 'separator',
              margin: 'lg',
              color: '#EEEEEE',
            },
            {
              type: 'box',
              layout: 'vertical',
              margin: 'lg',
              spacing: 'sm',
              contents: contentBlocks,
            }
          ] as messagingApi.FlexComponent[] : [])
        ],
        paddingAll: '20px',
      }
    },
  }
}
