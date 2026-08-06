'use client'

import { useState } from 'react'
import { questions, ANSWER_OPTIONS, TOTAL_QUESTIONS } from '@/data/questions'
import { Smile, Meh, Frown, Check, ArrowLeft, ArrowRight, Send } from 'lucide-react'

interface QuizScreenProps {
  answers: Record<number, number>
  setAnswers: React.Dispatch<React.SetStateAction<Record<number, number>>>
  onSubmit: (answers: Record<number, number>) => void
}

/**
 * Quiz Screen — แสดงคำถามทีละข้อ พร้อม Progress Bar
 */
export default function QuizScreen({
  answers,
  setAnswers,
  onSubmit,
}: QuizScreenProps) {
  const [currentIndex, setCurrentIndex] = useState(0) // 0-based
  const currentQuestion = questions[currentIndex]
  const currentQNum = currentIndex + 1 // 1-based
  const progressPercent = Math.round(
    (Object.keys(answers).length / TOTAL_QUESTIONS) * 100
  )
  const isAnswered = answers[currentQNum] !== undefined
  const isLastQuestion = currentIndex === TOTAL_QUESTIONS - 1
  const isAllAnswered = Object.keys(answers).length === TOTAL_QUESTIONS

  const handleAnswer = (score: number) => {
    setAnswers((prev) => ({ ...prev, [currentQNum]: score }))
    // Auto-advance to next question (ถ้าไม่ใช่ข้อสุดท้าย)
    if (!isLastQuestion) {
      setTimeout(() => {
        setCurrentIndex((i) => i + 1)
      }, 300)
    }
  }

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex((i) => i - 1)
  }

  const handleNext = () => {
    if (currentIndex < TOTAL_QUESTIONS - 1) setCurrentIndex((i) => i + 1)
  }

  const handleSubmit = () => {
    if (isAllAnswered) {
      onSubmit(answers)
    }
  }

  return (
    <div className="quiz-screen">
      {/* Header with progress */}
      <div className="quiz-header">
        <div className="quiz-meta">
          <span className="quiz-progress-text">
            ข้อ {currentQNum} / {TOTAL_QUESTIONS}
          </span>
          <span className="quiz-answered-text">
            ตอบแล้ว {Object.keys(answers).length} ข้อ
          </span>
        </div>
        <div className="progress-bar-track">
          <div
            className="progress-bar-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="progress-percent">{progressPercent}%</div>
      </div>

      {/* Question */}
      <div className="question-container">
        <div className="question-number">ข้อที่ {currentQNum}</div>
        <p className="question-text">{currentQuestion.text}</p>
      </div>

      {/* Answer Options */}
      <div className="answer-options">
        {ANSWER_OPTIONS.map((option) => {
          const isSelected = answers[currentQNum] === option.value
          return (
            <button
              key={option.value}
              id={`answer-q${currentQNum}-score${option.value}`}
              className={`answer-btn ${isSelected ? 'answer-btn--selected' : ''} answer-btn--${option.value === 3 ? 'high' : option.value === 2 ? 'medium' : 'low'}`}
              onClick={() => handleAnswer(option.value)}
            >
              <span className="answer-emoji">
                {option.value === 3 && <Smile size={24} className={isSelected ? 'text-green-600' : 'text-green-500'} />}
                {option.value === 2 && <Meh size={24} className={isSelected ? 'text-yellow-600' : 'text-yellow-500'} />}
                {option.value === 1 && <Frown size={24} className={isSelected ? 'text-red-600' : 'text-red-500'} />}
              </span>
              <span className="answer-label">{option.label}</span>
              {isSelected && (
                <span className="answer-check">
                  <Check size={20} strokeWidth={3} />
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Navigation */}
      <div className="quiz-navigation">
        <button
          className="btn btn-secondary flex items-center justify-center gap-2"
          onClick={handlePrev}
          disabled={currentIndex === 0}
          id="btn-prev"
        >
          <ArrowLeft size={18} /> ก่อนหน้า
        </button>

        {!isLastQuestion ? (
          <button
            className="btn btn-primary flex items-center justify-center gap-2"
            onClick={handleNext}
            disabled={!isAnswered}
            id="btn-next"
          >
            ถัดไป <ArrowRight size={18} />
          </button>
        ) : (
          <button
            id="btn-submit-quiz"
            className={`btn btn-submit flex items-center justify-center gap-2 ${isAllAnswered ? 'btn-submit--ready' : ''}`}
            onClick={handleSubmit}
            disabled={!isAllAnswered}
          >
            {isAllAnswered ? (
              <>
                <Send size={18} /> ส่งแบบสอบถาม
              </>
            ) : (
              `ยังขาดอีก ${TOTAL_QUESTIONS - Object.keys(answers).length} ข้อ`
            )}
          </button>
        )}
      </div>

      {/* Jump to unanswered */}
      {isAllAnswered && currentIndex !== TOTAL_QUESTIONS - 1 && (
        <div className="quiz-jump-hint">
          <button
            className="btn-link flex items-center justify-center gap-1 mx-auto"
            onClick={() => setCurrentIndex(TOTAL_QUESTIONS - 1)}
          >
            ไปข้อสุดท้ายเพื่อส่งคำตอบ <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* Dot indicators */}
      <div className="dot-indicators">
        {questions.map((q, i) => (
          <button
            key={q.id}
            className={`dot ${i === currentIndex ? 'dot--active' : ''} ${answers[q.id] !== undefined ? 'dot--answered' : ''}`}
            onClick={() => setCurrentIndex(i)}
            aria-label={`ข้อที่ ${q.id}`}
          />
        ))}
      </div>
    </div>
  )
}
