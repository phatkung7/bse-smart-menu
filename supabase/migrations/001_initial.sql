-- ============================================================
-- BSE-Smart: Digital Health Literacy Questionnaire
-- Database Migration 001 — Initial Schema
-- ============================================================

-- ผู้ใช้ LINE
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  line_user_id TEXT UNIQUE NOT NULL,
  display_name TEXT,
  picture_url TEXT,
  followed_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,  -- FALSE เมื่อ unfollow
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Session การทำแบบสอบถาม (1 session = 1 ครั้งที่ทำ)
CREATE TABLE IF NOT EXISTS quiz_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  line_user_id TEXT NOT NULL REFERENCES users(line_user_id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'in_progress'
    CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- คำตอบรายข้อ (24 ข้อต่อ 1 session)
CREATE TABLE IF NOT EXISTS quiz_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES quiz_sessions(id) ON DELETE CASCADE,
  question_number INT NOT NULL CHECK (question_number BETWEEN 1 AND 24),
  score INT NOT NULL CHECK (score BETWEEN 1 AND 3),
  -- 1 = ปฏิบัติไม่ได้เลย
  -- 2 = ปฏิบัติได้บางครั้ง
  -- 3 = ปฏิบัติได้เสมอ
  answered_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, question_number)  -- ป้องกันตอบซ้ำในแต่ละ session
);

-- ผลสรุปความรอบรู้ (1 ต่อ 1 session)
CREATE TABLE IF NOT EXISTS quiz_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES quiz_sessions(id) ON DELETE CASCADE UNIQUE,
  line_user_id TEXT NOT NULL,
  total_score INT NOT NULL CHECK (total_score BETWEEN 24 AND 72),
  -- คะแนนเฉลี่ยต่อข้อ = total_score / 24
  literacy_level TEXT NOT NULL CHECK (literacy_level IN ('low', 'medium', 'high')),
  -- low    = 24-39
  -- medium = 40-56
  -- high   = 57-72
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Indexes สำหรับ query ที่ใช้บ่อย
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_users_line_user_id ON users(line_user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_line_user_id ON quiz_sessions(line_user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_status ON quiz_sessions(status);
CREATE INDEX IF NOT EXISTS idx_quiz_answers_session_id ON quiz_answers(session_id);
CREATE INDEX IF NOT EXISTS idx_quiz_results_line_user_id ON quiz_results(line_user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_results_literacy_level ON quiz_results(literacy_level);

-- ============================================================
-- Row Level Security (เปิดใช้ RLS)
-- ============================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;

-- Policy: Service Role สามารถทำทุกอย่าง (สำหรับ server-side operations)
-- (Service Role key bypass RLS โดยอัตโนมัติ)

-- ============================================================
-- View: สถิติสรุปสำหรับ Admin (เฟสถัดไป)
-- ============================================================

CREATE OR REPLACE VIEW v_quiz_statistics AS
SELECT
  literacy_level,
  COUNT(*) as total_responses,
  ROUND(AVG(total_score), 2) as avg_score,
  MIN(total_score) as min_score,
  MAX(total_score) as max_score,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM quiz_results
GROUP BY literacy_level
ORDER BY 
  CASE literacy_level
    WHEN 'high' THEN 1
    WHEN 'medium' THEN 2
    WHEN 'low' THEN 3
  END;
