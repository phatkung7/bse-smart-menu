import type { messagingApi } from '@line/bot-sdk'
import type { QuizResult } from '@/lib/quiz-calculator'

const LEVEL_CONFIG = {
  high: {
    color: '#28A745',
    bgColor: '#F0FFF4',
    headerBg: '#28A745',
    emoji: '🟢',
    badge: 'ระดับสูง',
  },
  medium: {
    color: '#FFC107',
    bgColor: '#FFFEF0',
    headerBg: '#E5A800',
    emoji: '🟡',
    badge: 'ระดับปานกลาง',
  },
  low: {
    color: '#DC3545',
    bgColor: '#FFF5F5',
    headerBg: '#DC3545',
    emoji: '🔴',
    badge: 'ระดับต่ำ',
  },
}

/**
 * Result Notification Flex Message
 * ส่งหลัง submit แบบสอบถามเสร็จ เพื่อแจ้งผลใน LINE Chat
 */
export function buildResultNotificationMessage(
  result: QuizResult,
  sessionId: string,
  liffBaseUrl: string
): messagingApi.FlexMessage {
  const config = LEVEL_CONFIG[result.literacyLevel]
  const resultPageUrl = `${liffBaseUrl}/liff/result?sessionId=${sessionId}`

  return {
    type: 'flex',
    altText: `ผลการประเมิน BSE-Smart: ${result.levelText} (${result.totalScore} คะแนน)`,
    contents: {
      type: 'bubble',
      size: 'kilo',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '🎗️ ผลการประเมินความรอบรู้',
            color: '#FFFFFF',
            size: 'md',
            weight: 'bold',
          },
          {
            type: 'text',
            text: 'ด้านสุขภาพดิจิทัล',
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
          // คะแนนรวม
          {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: 'คะแนนรวม',
                size: 'xs',
                color: '#888888',
                align: 'center',
              },
              {
                type: 'text',
                text: `${result.totalScore}`,
                size: 'xxl',
                weight: 'bold',
                color: config.color,
                align: 'center',
              },
              {
                type: 'text',
                text: 'จาก 72 คะแนน',
                size: 'xs',
                color: '#888888',
                align: 'center',
              },
            ],
            paddingAll: '16px',
            backgroundColor: config.bgColor,
            cornerRadius: '12px',
          },
          // ระดับ
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              {
                type: 'text',
                text: 'ระดับความรอบรู้',
                size: 'sm',
                color: '#555555',
              },
              {
                type: 'text',
                text: `${config.emoji} ${result.levelText}`,
                size: 'sm',
                weight: 'bold',
                color: config.color,
                align: 'end',
              },
            ],
            margin: 'md',
          },
          {
            type: 'separator',
            margin: 'md',
            color: '#EEEEEE',
          },
          // คำแนะนำสั้น
          {
            type: 'text',
            text: result.recommendation,
            size: 'xs',
            color: '#666666',
            wrap: true,
            margin: 'md',
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
              label: 'ดูผลเพิ่มเติม',
              uri: resultPageUrl,
            },
            style: 'primary',
            color: '#D63384',
            height: 'sm',
          },
        ],
        paddingAll: '12px',
      },
    },
  }
}
