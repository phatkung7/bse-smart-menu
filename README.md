# BSE-Smart 🎗️

> ระบบความรอบรู้ด้านสุขภาพดิจิทัลเกี่ยวกับมะเร็งเต้านมและการตรวจเต้านมด้วยตนเอง  
> **Digital Health Literacy Questionnaire for Breast Cancer and Breast Self-Examination**

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend + Backend | Next.js 14 (App Router) |
| Database | Supabase (PostgreSQL) |
| Deploy | Vercel |
| LINE Integration | LINE Messaging API + LIFF |

## Feature 1: Digital Health Literacy Questionnaire (LIFF App)

ผู้ใช้ Add LINE OA → กด Rich Menu → เปิด LIFF Web App → ทำแบบสอบถาม 24 ข้อ → ดูผลระดับความรอบรู้

### ระดับความรอบรู้

| คะแนน | ระดับ |
|-------|-------|
| 24–39 | 🔴 ต่ำ |
| 40–56 | 🟡 ปานกลาง |
| 57–72 | 🟢 สูง |

## Project Structure

```
src/
├── app/
│   ├── liff/
│   │   └── quiz/           ← LIFF App (main feature)
│   │       ├── page.tsx
│   │       └── components/
│   │           ├── IntroScreen.tsx
│   │           ├── QuizScreen.tsx
│   │           └── ResultScreen.tsx
│   └── api/
│       ├── webhook/        ← LINE webhook handler
│       ├── quiz/submit/    ← รับคำตอบ + บันทึก
│       ├── quiz/result/    ← ดึงผลลัพธ์
│       └── setup/          ← Setup rich menu
├── lib/
│   ├── supabase.ts
│   ├── line-client.ts
│   ├── quiz-calculator.ts
│   └── line-messages/
│       ├── welcome.ts
│       └── result-notification.ts
└── data/
    └── questions.ts        ← 24 ข้อคำถาม
```

## Setup Guide

### 1. Clone & Install

```bash
git clone <repo>
cd bse-smart
npm install
```

### 2. Environment Variables

```bash
cp .env.local.example .env.local
# แก้ไขค่าใน .env.local
```

ค่าที่ต้องการ:
- `LINE_CHANNEL_ACCESS_TOKEN` — จาก LINE Developer Console > Messaging API
- `LINE_CHANNEL_SECRET` — จาก LINE Developer Console > Messaging API
- `NEXT_PUBLIC_LIFF_ID` — จาก LINE Developer Console > LIFF tab
- `NEXT_PUBLIC_SUPABASE_URL` — จาก Supabase Project Settings
- `SUPABASE_SERVICE_ROLE_KEY` — จาก Supabase Project Settings > API
- `NEXT_PUBLIC_BASE_URL` — URL ของ Vercel deployment
- `SETUP_SECRET_KEY` — กำหนดเองสำหรับป้องกัน setup endpoint

### 3. Database Setup (Supabase)

```sql
-- รัน SQL ใน Supabase Dashboard > SQL Editor
-- Copy เนื้อหาจาก: supabase/migrations/001_initial.sql
```

### 4. LIFF Registration

1. ไปที่ [LINE Developers Console](https://developers.line.biz/console/)
2. เลือก Channel → **LIFF** tab → Add
3. กรอก:
   - Name: `BSE-Smart Quiz`
   - Size: `Full`
   - Endpoint URL: `https://your-app.vercel.app/liff/quiz`
   - Scope: `profile`, `openid`
4. คัดลอก **LIFF ID** → ใส่ใน `.env.local`

### 5. Deploy to Vercel

```bash
# ติดตั้ง Vercel CLI
npm i -g vercel

# Deploy
vercel

# ตั้ง environment variables ใน Vercel Dashboard
```

### 6. Setup Webhook URL

ใน LINE Developer Console → Messaging API:
- Webhook URL: `https://your-app.vercel.app/api/webhook`
- ✅ Use webhook: ON

### 7. Setup Rich Menu (Run Once)

```bash
npm run setup:richmenu
```

หรือเรียก API:
```bash
curl -X POST https://your-app.vercel.app/api/setup \
  -H "x-setup-secret: YOUR_SETUP_SECRET_KEY"
```

### 8. Prepare Rich Menu Image

สร้างรูป `public/rich-menu.png` ขนาด **2500 × 843 px**:
- Zone ซ้าย: "📝 ทำแบบสอบถาม"
- Zone กลาง: "📊 ผลการประเมิน"  
- Zone ขวา: "ℹ️ ข้อมูลมะเร็งเต้านม"

## Development

```bash
npm run dev
# เปิด http://localhost:3000/liff/quiz
```

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/webhook` | LINE webhook (follow, unfollow) |
| POST | `/api/quiz/submit` | บันทึกคำตอบ + คืนผล |
| GET | `/api/quiz/result/:sessionId` | ดึงผลลัพธ์ |
| GET | `/api/quiz/result/latest` | ดึงผลล่าสุดของผู้ใช้ |
| POST | `/api/setup` | Setup rich menu (protected) |
| GET | `/api/menstrual` | ดึงประวัติบันทึกประจำเดือน |
| POST | `/api/menstrual` | บันทึกวันประจำเดือน + ส่ง Flex Message |
| GET | `/api/self-exam` | ดึงประวัติบันทึกผลการตรวจ |
| POST | `/api/self-exam` | บันทึกผลการตรวจเต้านม |
| PUT | `/api/self-exam/:id` | แก้ไขบันทึกผลการตรวจ |
| DELETE | `/api/self-exam/:id` | ลบบันทึกผลการตรวจ |

## Database Schema

> รัน SQL ทั้งหมดใน **Supabase Dashboard → SQL Editor**

### Migration 001 — ระบบแบบสอบถาม (`001_initial.sql`)

```sql
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
  answered_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, question_number)  -- ป้องกันตอบซ้ำในแต่ละ session
);

-- ผลสรุปความรอบรู้ (1 ต่อ 1 session)
CREATE TABLE IF NOT EXISTS quiz_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES quiz_sessions(id) ON DELETE CASCADE UNIQUE,
  line_user_id TEXT NOT NULL,
  total_score INT NOT NULL CHECK (total_score BETWEEN 24 AND 72),
  literacy_level TEXT NOT NULL CHECK (literacy_level IN ('low', 'medium', 'high')),
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_line_user_id ON users(line_user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_line_user_id ON quiz_sessions(line_user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_status ON quiz_sessions(status);
CREATE INDEX IF NOT EXISTS idx_quiz_answers_session_id ON quiz_answers(session_id);
CREATE INDEX IF NOT EXISTS idx_quiz_results_line_user_id ON quiz_results(line_user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_results_literacy_level ON quiz_results(literacy_level);

-- Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;
```

### Migration 002 — ข้อมูลส่วนตัวผู้ใช้ (`002_profile_tables.sql`)

```sql
-- บันทึกวันประจำเดือน
CREATE TABLE IF NOT EXISTS menstrual_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  line_user_id TEXT NOT NULL REFERENCES users(line_user_id) ON DELETE CASCADE,
  period_start_date DATE NOT NULL,  -- วันที่ประจำเดือนมา
  note TEXT,                        -- หมายเหตุ (optional)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- บันทึกผลการตรวจเต้านมด้วยตนเอง
CREATE TABLE IF NOT EXISTS self_exam_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  line_user_id TEXT NOT NULL REFERENCES users(line_user_id) ON DELETE CASCADE,
  exam_date DATE NOT NULL DEFAULT CURRENT_DATE, -- วันที่ตรวจ
  note TEXT NOT NULL,                           -- ผลการตรวจ (textarea)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_menstrual_line_user_id ON menstrual_records(line_user_id);
CREATE INDEX IF NOT EXISTS idx_menstrual_period_start_date ON menstrual_records(period_start_date DESC);
CREATE INDEX IF NOT EXISTS idx_self_exam_line_user_id ON self_exam_records(line_user_id);
CREATE INDEX IF NOT EXISTS idx_self_exam_exam_date ON self_exam_records(exam_date DESC);

-- Row Level Security
ALTER TABLE menstrual_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE self_exam_records ENABLE ROW LEVEL SECURITY;
```

### ความสัมพันธ์ระหว่างตาราง

```
users
 ├── quiz_sessions  (line_user_id → line_user_id)
 │    ├── quiz_answers   (session_id → id)
 │    └── quiz_results   (session_id → id)
 ├── menstrual_records   (line_user_id → line_user_id)
 └── self_exam_records   (line_user_id → line_user_id)
```

