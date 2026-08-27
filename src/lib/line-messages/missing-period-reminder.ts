import type { messagingApi } from '@line/bot-sdk'

export function buildMissingPeriodReminderMessage(liffBaseUrl: string): messagingApi.FlexMessage {
  return {
    type: 'flex',
    altText: 'แจ้งเตือน: คุณไม่ได้บันทึกประจำเดือนเกิน 30 วันแล้วค่ะ',
    contents: {
      type: 'bubble',
      size: 'mega',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '🔔 อย่าลืมบันทึกประจำเดือน',
            color: '#FFFFFF',
            size: 'md',
            weight: 'bold'
          },
          {
            type: 'text',
            text: 'BSE smart menu',
            color: '#FFD0E8',
            size: 'xs',
            margin: 'sm'
          }
        ],
        backgroundColor: '#E83E8C',
        paddingAll: '16px'
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: 'คุณไม่ได้บันทึกข้อมูลประจำเดือนมานานกว่า 30 วันแล้ว',
            size: 'sm',
            color: '#333333',
            wrap: true,
            weight: 'bold'
          },
          {
            type: 'text',
            text: 'อย่าลืมเข้ามาอัปเดตข้อมูลเพื่อให้เราช่วยดูแลสุขภาพเต้านมได้อย่างแม่นยำนะคะ 💕',
            size: 'sm',
            color: '#666666',
            wrap: true,
            margin: 'md'
          }
        ],
        paddingAll: '20px'
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'button',
            action: {
              type: 'uri',
              label: 'บันทึกประจำเดือน',
              uri: `${liffBaseUrl}/liff/profile?tab=menstrual`
            },
            style: 'primary',
            color: '#E83E8C'
          }
        ],
        paddingAll: '16px'
      }
    }
  }
}
