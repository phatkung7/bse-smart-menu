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
| POST | `/api/setup` | Setup rich menu (protected) |
