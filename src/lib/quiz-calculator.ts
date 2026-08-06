/**
 * Quiz Score Calculator
 * คำนวณคะแนนและระดับความรอบรู้ด้านสุขภาพดิจิทัล
 */

export type LiteracyLevel = 'low' | 'medium' | 'high'

export interface QuizResult {
  totalScore: number
  averageScore: number
  literacyLevel: LiteracyLevel
  levelText: string
  levelDescription: string
  recommendation: string
  colorClass: string
  emoji: string
}

// เกณฑ์คะแนน
const SCORE_THRESHOLDS = {
  LOW_MAX: 39,    // 24–39 = ต่ำ
  MEDIUM_MAX: 56, // 40–56 = ปานกลาง
  // 57–72 = สูง
} as const

/**
 * คำนวณระดับความรอบรู้จากคะแนนรวม
 */
export function calculateLiteracyLevel(totalScore: number): LiteracyLevel {
  if (totalScore <= SCORE_THRESHOLDS.LOW_MAX) return 'low'
  if (totalScore <= SCORE_THRESHOLDS.MEDIUM_MAX) return 'medium'
  return 'high'
}

/**
 * คำนวณผลลัพธ์ทั้งหมดจาก array of scores
 */
export function calculateQuizResult(scores: number[]): QuizResult {
  const totalScore = scores.reduce((sum, score) => sum + score, 0)
  const averageScore = totalScore / scores.length
  const literacyLevel = calculateLiteracyLevel(totalScore)

  const levelDetails: Record<LiteracyLevel, Omit<QuizResult, 'totalScore' | 'averageScore' | 'literacyLevel'>> = {
    high: {
      levelText: 'สูง',
      levelDescription:
        'คุณมีความรอบรู้ด้านสุขภาพดิจิทัลในระดับดีมาก สามารถค้นหา เข้าใจ ประเมิน และนำข้อมูลสุขภาพออนไลน์ไปใช้ได้อย่างมีประสิทธิภาพ',
      recommendation:
        'ยอดเยี่ยม! คุณสามารถใช้ทักษะนี้ช่วยดูแลสุขภาพตนเองและเผยแพร่ความรู้ที่ถูกต้องให้คนรอบข้างได้ ขอให้รักษาพฤติกรรมการตรวจเต้านมด้วยตนเองอย่างสม่ำเสมอทุกเดือน',
      colorClass: 'green',
      emoji: '🟢',
    },
    medium: {
      levelText: 'ปานกลาง',
      levelDescription:
        'คุณมีทักษะพื้นฐานด้านสุขภาพดิจิทัลที่ดี แต่ยังมีโอกาสพัฒนาทักษะการประเมินและการนำข้อมูลไปใช้ได้อีก',
      recommendation:
        'ลองฝึกใช้แหล่งข้อมูลสุขภาพที่น่าเชื่อถือ เช่น เว็บไซต์กระทรวงสาธารณสุข หรือโรงพยาบาลใกล้บ้าน และฝึกการตรวจเต้านมด้วยตนเองทุกเดือน',
      colorClass: 'yellow',
      emoji: '🟡',
    },
    low: {
      levelText: 'ต่ำ',
      levelDescription:
        'คุณยังอยู่ในช่วงเริ่มต้นของการพัฒนาทักษะความรอบรู้ด้านสุขภาพดิจิทัล ซึ่งเป็นเรื่องปกติและสามารถพัฒนาได้',
      recommendation:
        'แนะนำให้เริ่มจากการติดตามข้อมูลสุขภาพจากแหล่งที่เชื่อถือได้ เช่น LINE OA ของโรงพยาบาล และขอคำแนะนำจากบุคลากรสาธารณสุขใกล้บ้านในการตรวจเต้านมด้วยตนเอง',
      colorClass: 'red',
      emoji: '🔴',
    },
  }

  return {
    totalScore,
    averageScore: Math.round(averageScore * 100) / 100,
    literacyLevel,
    ...levelDetails[literacyLevel],
  }
}

/**
 * คำนวณ progress เปอร์เซ็นต์คะแนน (0-100)
 */
export function calculateScorePercentage(totalScore: number, maxScore = 72, minScore = 24): number {
  return Math.round(((totalScore - minScore) / (maxScore - minScore)) * 100)
}

/**
 * Validate คำตอบก่อน submit
 */
export function validateAnswers(answers: Record<number, number>, totalQuestions = 24): boolean {
  if (Object.keys(answers).length !== totalQuestions) return false
  return Object.values(answers).every((score) => score >= 1 && score <= 3)
}
