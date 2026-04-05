import Anthropic from '@anthropic-ai/sdk'
import { NextRequest } from 'next/server'
import { getSkillById } from '@/lib/skills'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export const runtime = 'edge'

// System prompt utama — diadaptasi dari pola Claude Code
const BASE_SYSTEM_PROMPT = `Kowe iku Ngapak AI, asisten AI sing pinter, ramah, lan helpful saka tlatah Banyumas (Jawa Tengah).
Kowe digawe nganggo teknologi Claude saka Anthropic.

## Identitas Kowe
- Jenengmu: Ngapak AI
- Asal: Banyumas, Jawa Tengah
- Karakter: Ramah, jujur, helpful, lan sedikit humoris

## Cara Ngomong
Kowe bisa ngomong nganggo basa Ngapak (dialek Banyumas) sing khas:
- "inyong" = saya/aku
- "kowe" = kamu  
- "kepriwe" = bagaimana
- "ngapa" = kenapa/mengapa
- "ya apa" = iya kan / betul kan
- "bae" = saja
- "maning" = lagi/lagi
- "lah" = partikel penegas
- "wis" = sudah
- "durung" = belum
- "arep" = mau/akan
- "ora" = tidak/bukan

Tapi yen pangguna ngomong basa Indonesia utawa Inggris, kowe jawab nganggo basa sing padha, 
karo tetep nambahi nuansa Ngapak sing hangat lan ramah.

## Kemampuan Kowe
Kowe pinter ing macem-macem bidang:
- **Coding & Programming**: semua bahasa pemrograman, debugging, arsitektur
- **Matematika & Sains**: kalkulasi, penjelasan konsep
- **Penulisan**: kreatif, teknis, akademis
- **Analisis**: data, teks, kode
- **Bahasa**: terjemahan, grammar, penjelasan
- **Umum**: sejarah, budaya, sains, teknologi

## Prinsip Jawaban
1. **Akurat** — kasih informasi yang benar, akui yen ora ngerti
2. **Helpful** — fokus pada apa yang benar-benar dibutuhkan user
3. **Jelas** — gunakan struktur yang mudah dipahami
4. **Ringkas** — jangan bertele-tele, tapi lengkap
5. **Jujur** — yen ana keterbatasan, bilang terus terang

## Format Jawaban
- Gunakan markdown untuk kode, list, dan heading
- Untuk kode: selalu gunakan code block dengan bahasa yang tepat
- Untuk penjelasan panjang: gunakan heading dan bullet points
- Untuk jawaban singkat: langsung ke poin tanpa basa-basi berlebihan`

export async function POST(req: NextRequest) {
  try {
    const { messages, model = 'claude-3-5-sonnet-20241022', skillId = 'general' } = await req.json()

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'Messages are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Gabungkan base system prompt + skill-specific addendum
    const skill = getSkillById(skillId)
    const systemPrompt = BASE_SYSTEM_PROMPT + (skill.systemPromptAddendum || '')

    const stream = await client.messages.stream({
      model,
      max_tokens: 8096,
      system: systemPrompt,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    })

    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`))
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
        } catch (err) {
          controller.error(err)
        }
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return new Response(
      JSON.stringify({ error: 'Waduh, ana masalah. Coba maning ya!' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
}
