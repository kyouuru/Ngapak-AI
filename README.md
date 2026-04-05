# Ngapak AI 🤖

Asisten AI sing pinter lan ramah saka tlatah Banyumas, digawe nganggo Next.js lan Anthropic Claude.

## Fitur

- 💬 Chat real-time dengan streaming
- 🗂️ Multi-session dengan history tersimpan di localStorage
- 🤖 Pilihan model Claude (Sonnet, Haiku, Opus)
- 📱 Responsive — bisa di HP maupun desktop
- 🌙 Dark mode otomatis
- 📋 Copy pesan dengan satu klik
- ⌨️ Markdown rendering lengkap (code, table, list, dll)

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Set API Key

Copy `.env.example` ke `.env.local` dan isi API key:

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```
ANTHROPIC_API_KEY=sk-ant-xxxxxxxx
```

Dapatkan API key di: https://console.anthropic.com

### 3. Jalankan development server

```bash
npm run dev
```

Buka http://localhost:3000

## Deploy ke Vercel

1. Push ke GitHub
2. Import project di [vercel.com](https://vercel.com)
3. Tambah environment variable `ANTHROPIC_API_KEY` di Vercel dashboard
4. Deploy!

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **AI**: Anthropic Claude via `@anthropic-ai/sdk`
- **Styling**: Tailwind CSS
- **Markdown**: react-markdown + remark-gfm
- **Icons**: lucide-react
- **Deploy**: Vercel (Edge Runtime)
