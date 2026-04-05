import { NextRequest } from 'next/server'
import { getSkillById } from '@/lib/skills'
import { getLanguageById } from '@/lib/languages'
import { auth } from '@/lib/auth'
import { checkLimit, incrementUsage } from '@/lib/rateLimit'

export const runtime = 'nodejs' // pakai nodejs agar auth bisa jalan

const OPENROUTER_BASE = 'https://openrouter.ai/api/v1'

const FREE_MODELS = [
  'deepseek/deepseek-chat-v3-0324:free',
  'google/gemini-2.0-flash-001',
]

// System prompt mendukung multi-bahasa otomatis
const BASE_SYSTEM_PROMPT = `Kamu adalah Ngapak AI, asisten AI yang pintar, ramah, dan helpful buatan Danixyz.

## Identitas
- Nama: Ngapak AI
- Dibuat oleh: Danixyz
- Karakter: Ramah, jujur, helpful, sedikit humoris

## Kemampuan
- Coding & Programming: semua bahasa pemrograman, debugging, arsitektur
- Matematika & Sains: kalkulasi, penjelasan konsep
- Penulisan: kreatif, teknis, akademis
- Analisis: data, teks, kode
- Bahasa: terjemahan, grammar, penjelasan
- Umum: sejarah, budaya, sains, teknologi

## Prinsip Jawaban
1. Akurat — berikan informasi yang benar, akui jika tidak tahu
2. Helpful — fokus pada kebutuhan user
3. Jelas — gunakan struktur yang mudah dipahami
4. Ringkas — tidak bertele-tele tapi lengkap

## Format Jawaban
- Gunakan markdown untuk kode, list, dan heading
- Untuk kode: selalu gunakan code block dengan bahasa yang tepat
- Untuk penjelasan panjang: gunakan heading dan bullet points`

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
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
    }),
  })
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    const isLoggedIn = !!session?.user

    // Buat key unik: user ID kalau login, IP kalau guest
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      ?? req.headers.get('x-real-ip')
      ?? 'unknown'
    const limitKey = isLoggedIn ? `user:${session!.user!.id ?? session!.user!.email}` : `ip:${ip}`

    // Cek rate limit
    const limitCheck = checkLimit(limitKey, isLoggedIn)
    if (!limitCheck.allowed) {
      return new Response(
        JSON.stringify({
          error: 'rate_limit',
          isLoggedIn,
          used: limitCheck.used,
          limit: limitCheck.limit,
        }),
        { status: 429, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const { messages, model: requestedModel, skillId = 'general', langId = 'id' } = await req.json()
    const model = requestedModel ?? FREE_MODELS[0]

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'Messages are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API key not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Increment usage setelah validasi
    incrementUsage(limitKey)

    const skill = getSkillById(skillId)
    const language = getLanguageById(langId)
    const systemPrompt = BASE_SYSTEM_PROMPT + language.systemAddendum + (skill.systemPromptAddendum || '')
    const formattedMessages = messages.map((m: { role: string; content: string }) => ({
      role: m.role,
      content: m.content,
    }))

    let response = await callOpenRouter(apiKey, model, systemPrompt, formattedMessages)

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

    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader()
        const decoder = new TextDecoder()
        if (!reader) { controller.close(); return }

        let buffer = ''
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')
            buffer = lines.pop() ?? ''

            for (const line of lines) {
              const trimmed = line.trim()
              if (!trimmed || !trimmed.startsWith('data: ')) continue
              const data = trimmed.slice(6).trim()
              if (data === '[DONE]') {
                controller.enqueue(encoder.encode('data: [DONE]\n\n'))
                return
              }
              try {
                const parsed = JSON.parse(data)
                const text = parsed?.choices?.[0]?.delta?.content
                if (typeof text === 'string' && text.length > 0) {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`))
                }
              } catch {}
            }
          }

          // Proses sisa buffer
          if (buffer.trim().startsWith('data: ')) {
            try {
              const data = buffer.trim().slice(6).trim()
              if (data !== '[DONE]') {
                const parsed = JSON.parse(data)
                const text = parsed?.choices?.[0]?.delta?.content
                if (typeof text === 'string' && text.length > 0) {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`))
                }
              }
            } catch {}
          }

          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
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
        // Kirim info limit ke client via header
        'X-RateLimit-Limit': String(limitCheck.limit),
        'X-RateLimit-Remaining': String(limitCheck.remaining - 1),
        'X-RateLimit-LoggedIn': String(isLoggedIn),
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
