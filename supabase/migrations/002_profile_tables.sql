-- ============================================================
-- BSE-Smart: Migration 002 — Profile Feature Tables
-- ============================================================

-- บันทึกวันประจำเดือน
CREATE TABLE IF NOT EXISTS menstrual_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  line_user_id TEXT NOT NULL REFERENCES users(line_user_id) ON DELETE CASCADE,
  period_start_date DATE NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- บันทึกผลการตรวจเต้านมด้วยตนเอง
CREATE TABLE IF NOT EXISTS self_exam_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  line_user_id TEXT NOT NULL REFERENCES users(line_user_id) ON DELETE CASCADE,
  exam_date DATE NOT NULL DEFAULT CURRENT_DATE,
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_menstrual_line_user_id ON menstrual_records(line_user_id);
CREATE INDEX IF NOT EXISTS idx_menstrual_period_start_date ON menstrual_records(period_start_date DESC);
CREATE INDEX IF NOT EXISTS idx_self_exam_line_user_id ON self_exam_records(line_user_id);
CREATE INDEX IF NOT EXISTS idx_self_exam_exam_date ON self_exam_records(exam_date DESC);

-- RLS
ALTER TABLE menstrual_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE self_exam_records ENABLE ROW LEVEL SECURITY;
