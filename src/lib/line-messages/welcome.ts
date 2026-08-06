import type { messagingApi } from '@line/bot-sdk'

/**
 * Welcome Flex Message
 * ส่งเมื่อผู้ใช้ Add LINE OA เป็นเพื่อน
 */
export function buildWelcomeMessage(
  displayName: string,
  liffUrl: string
): messagingApi.FlexMessage {
  return {
    type: 'flex',
    altText: `ยินดีต้อนรับคุณ ${displayName} สู่ BSE-Smart! 🎗️`,
    contents: {
      type: 'bubble',
      size: 'giga',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '🎗️ BSE-Smart',
            color: '#FFFFFF',
            size: 'xl',
            weight: 'bold',
          },
          {
            type: 'text',
            text: 'ระบบความรอบรู้ด้านสุขภาพดิจิทัล',
            color: '#FFE0EC',
            size: 'sm',
          },
        ],
        backgroundColor: '#D63384',
        paddingAll: '20px',
      },
      hero: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: `สวัสดีคุณ ${displayName} 👋`,
            size: 'lg',
            weight: 'bold',
            color: '#2D2D2D',
            wrap: true,
          },
          {
            type: 'text',
            text: 'ยินดีต้อนรับสู่โครงการ BSE-Smart ระบบคัดกรองความรอบรู้ด้านสุขภาพดิจิทัลเกี่ยวกับมะเร็งเต้านมและการตรวจเต้านมด้วยตนเอง',
            size: 'sm',
            color: '#666666',
            wrap: true,
            margin: 'md',
          },
        ],
        paddingAll: '20px',
        backgroundColor: '#FFF5F8',
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              {
                type: 'text',
                text: '📋',
                size: 'sm',
              },
              {
                type: 'text',
                text: 'แบบสอบถาม 24 ข้อ',
                size: 'sm',
                color: '#444444',
                margin: 'sm',
              },
            ],
          },
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              {
                type: 'text',
                text: '⏱️',
                size: 'sm',
              },
              {
                type: 'text',
                text: 'ใช้เวลาประมาณ 5-7 นาที',
                size: 'sm',
                color: '#444444',
                margin: 'sm',
              },
            ],
            margin: 'sm',
          },
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              {
                type: 'text',
                text: '🔒',
                size: 'sm',
              },
              {
                type: 'text',
                text: 'ข้อมูลของคุณถูกเก็บเป็นความลับ',
                size: 'sm',
                color: '#444444',
                margin: 'sm',
              },
            ],
            margin: 'sm',
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
              label: '📝 ทำแบบสอบถามเลย',
              uri: liffUrl,
            },
            style: 'primary',
            color: '#D63384',
            height: 'md',
          },
        ],
        paddingAll: '16px',
      },
    },
  }
}
