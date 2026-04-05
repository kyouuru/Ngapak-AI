import { NextRequest } from 'next/server'
import { getSkillById } from '@/lib/skills'

export const runtime = 'edge'

const OPENROUTER_BASE = 'https://openrouter.ai/api/v1'

// System prompt utama — diadaptasi dari pola Claude Code
const BASE_SYSTEM_PROMPT = `Kowe iku Ngapak AI, asisten AI sing pinter, ramah, lan helpful saka tlatah Banyumas (Jawa Tengah).
Kowe digawe nganggo teknologi AI canggih.

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
- "maning" = lagi
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

const FREE_MODELS = [
  'deepseek/deepseek-chat-v3-0324:free',
  'google/gemini-2.0-flash-001',
]

async function callOpenRouter(
  apiKey: string,
  model: string,
  systemPrompt: string,
  messages: { role: string; content: string }[],
): Promise<Response> {
  return fetch(`${OPENROUTER_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://ngapak-ai.vercel.app',
      'X-Title': 'Ngapak AI',
    },
    body: JSON.stringify({
      model,
      stream: true,
      max_tokens: 8096,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
    }),
  })
}

export async function POST(req: NextRequest) {
  try {
    const { messages, model: requestedModel, skillId = 'general' } = await req.json()
    // Selalu pakai free model sebagai default — DeepSeek V3 dulu, fallback Gemini
    const model = requestedModel ?? FREE_MODELS[0]

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'Messages are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'OpenRouter API key not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const skill = getSkillById(skillId)
    const systemPrompt = BASE_SYSTEM_PROMPT + (skill.systemPromptAddendum || '')
    const formattedMessages = messages.map((m: { role: string; content: string }) => ({
      role: m.role,
      content: m.content,
    }))

    // Coba model yang diminta, fallback ke Gemini jika gagal
    let response = await callOpenRouter(apiKey, model, systemPrompt, formattedMessages)

    // Jika model utama error (rate limit, unavailable, dll) → fallback ke Gemini
    if (!response.ok && model !== FREE_MODELS[1]) {
      console.warn(`Model ${model} failed (${response.status}), falling back to ${FREE_MODELS[1]}`)
      response = await callOpenRouter(apiKey, FREE_MODELS[1]!, systemPrompt, formattedMessages)
    }

    if (!response.ok) {
      const err = await response.text()
      console.error('OpenRouter error:', err)
      return new Response(
        JSON.stringify({ error: 'Waduh, ana masalah karo AI-ne. Coba maning!' }),
        { status: response.status, headers: { 'Content-Type': 'application/json' } },
      )
    }

    // Stream SSE dari OpenRouter ke client
    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader()
        const decoder = new TextDecoder()
        if (!reader) { controller.close(); return }

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = decoder.decode(value)
            const lines = chunk.split('\n')

            for (const line of lines) {
              if (!line.startsWith('data: ')) continue
              const data = line.slice(6).trim()
              if (data === '[DONE]') {
                controller.enqueue(encoder.encode('data: [DONE]\n\n'))
                break
              }
              try {
                const parsed = JSON.parse(data)
                const text = parsed?.choices?.[0]?.delta?.content
                if (text) {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`))
                }
              } catch {}
            }
          }
        } catch (err) {
          controller.error(err)
        } finally {
          controller.close()
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
