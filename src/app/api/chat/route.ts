import { NextRequest } from 'next/server'
import { getSkillById } from '@/lib/skills'
import { getLanguageById } from '@/lib/languages'
import { auth } from '@/lib/auth'
import { checkLimit, incrementUsage } from '@/lib/rateLimit'

export const runtime = 'nodejs'

/* ─── Provider base URLs ─────────────────────────────────── */
const OPENROUTER_BASE = 'https://openrouter.ai/api/v1'
const NVIDIA_BASE     = 'https://integrate.api.nvidia.com/v1'

/* ─── Model registry ─────────────────────────────────────── */
// Maps frontend model IDs → per-provider model IDs + preferred provider
export type Provider = 'openrouter' | 'nvidia'

interface ModelConfig {
  openrouter?: string   // model id on OpenRouter
  nvidia?: string       // model id on NVIDIA NIM
  primary: Provider     // which provider to try first
}

export const MODEL_MAP: Record<string, ModelConfig> = {
  // ── Free models (OpenRouter primary, NVIDIA fallback) ──
  'deepseek/deepseek-chat-v3-0324:free': {
    openrouter: 'deepseek/deepseek-chat-v3-0324:free',
    nvidia:     'deepseek-ai/deepseek-r1',
    primary:    'openrouter',
  },
  'google/gemini-2.0-flash-001': {
    openrouter: 'google/gemini-2.0-flash-001',
    // No direct Gemini on NVIDIA; fallback to Llama
    nvidia:     'meta/llama-3.1-70b-instruct',
    primary:    'openrouter',
  },
  'meta-llama/llama-3.3-70b-instruct': {
    openrouter: 'meta-llama/llama-3.3-70b-instruct',
    nvidia:     'meta/llama-3.3-70b-instruct',
    primary:    'openrouter',
  },
  // ── NVIDIA-primary models (fast inference on NVIDIA GPUs) ──
  'nvidia/llama-3.1-nemotron-70b-instruct': {
    nvidia:     'nvidia/llama-3.1-nemotron-70b-instruct',
    openrouter: 'meta-llama/llama-3.1-70b-instruct',
    primary:    'nvidia',
  },
  'nvidia/mistral-nemo-minitron-8b': {
    nvidia:     'nvidia/mistral-nemo-minitron-8b-8k-instruct',
    openrouter: 'mistralai/mistral-7b-instruct',
    primary:    'nvidia',
  },
  // ── Paid models (OpenRouter only) ──
  'anthropic/claude-3.5-haiku': {
    openrouter: 'anthropic/claude-3.5-haiku',
    primary:    'openrouter',
  },
  'anthropic/claude-3.5-sonnet': {
    openrouter: 'anthropic/claude-3.5-sonnet',
    primary:    'openrouter',
  },
}

const DEFAULT_MODEL = 'deepseek/deepseek-chat-v3-0324:free'

/* ─── System prompt ──────────────────────────────────────── */
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

/* ─── Provider call functions ────────────────────────────── */
async function callOpenRouter(
  apiKey: string,
  modelId: string,
  systemPrompt: string,
  messages: { role: string; content: unknown }[],
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
      model: modelId,
      stream: true,
      max_tokens: 8096,
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
    }),
  })
}

async function callNvidia(
  apiKey: string,
  modelId: string,
  systemPrompt: string,
  messages: { role: string; content: unknown }[],
): Promise<Response> {
  // NVIDIA NIM is OpenAI-compatible — strip image content blocks (not all models support vision)
  const textMessages = messages.map((m) => ({
    role: m.role,
    content: typeof m.content === 'string'
      ? m.content
      : Array.isArray(m.content)
        ? (m.content as { type: string; text?: string }[])
            .filter((b) => b.type === 'text')
            .map((b) => b.text ?? '')
            .join('\n')
        : String(m.content),
  }))

  return fetch(`${NVIDIA_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: modelId,
      stream: true,
      max_tokens: 4096,
      messages: [{ role: 'system', content: systemPrompt }, ...textMessages],
    }),
  })
}

/* ─── Fallback orchestration ─────────────────────────────── */
async function callWithFallback(
  requestedModelKey: string,
  systemPrompt: string,
  messages: { role: string; content: unknown }[],
  openrouterKey?: string,
  nvidiaKey?: string,
): Promise<{ response: Response; usedProvider: Provider }> {
  const config = MODEL_MAP[requestedModelKey] ?? MODEL_MAP[DEFAULT_MODEL]!
  const primary = config.primary

  // Build ordered list of attempts: [primary, fallback]
  type Attempt = { provider: Provider; modelId: string }
  const attempts: Attempt[] = []

  if (primary === 'openrouter' && config.openrouter && openrouterKey) {
    attempts.push({ provider: 'openrouter', modelId: config.openrouter })
  }
  if (primary === 'nvidia' && config.nvidia && nvidiaKey) {
    attempts.push({ provider: 'nvidia', modelId: config.nvidia })
  }
  // Fallback: the other provider
  if (primary === 'openrouter' && config.nvidia && nvidiaKey) {
    attempts.push({ provider: 'nvidia', modelId: config.nvidia })
  }
  if (primary === 'nvidia' && config.openrouter && openrouterKey) {
    attempts.push({ provider: 'openrouter', modelId: config.openrouter })
  }
  // Last resort: default model on any available provider
  if (attempts.length === 0) {
    const def = MODEL_MAP[DEFAULT_MODEL]!
    if (openrouterKey && def.openrouter)
      attempts.push({ provider: 'openrouter', modelId: def.openrouter })
    else if (nvidiaKey && def.nvidia)
      attempts.push({ provider: 'nvidia', modelId: def.nvidia })
  }

  if (attempts.length === 0) {
    throw new Error('No API keys configured')
  }

  let lastResponse: Response | null = null
  for (const attempt of attempts) {
    try {
      console.log(`[chat] trying ${attempt.provider} → ${attempt.modelId}`)
      const res = attempt.provider === 'openrouter'
        ? await callOpenRouter(openrouterKey!, attempt.modelId, systemPrompt, messages)
        : await callNvidia(nvidiaKey!, attempt.modelId, systemPrompt, messages)

      if (res.ok) return { response: res, usedProvider: attempt.provider }

      console.warn(`[chat] ${attempt.provider} returned ${res.status}, trying next…`)
      lastResponse = res
    } catch (err) {
      console.warn(`[chat] ${attempt.provider} threw error:`, err)
    }
  }

  // All attempts failed — return the last error response
  return {
    response: lastResponse ?? new Response('{}', { status: 500 }),
    usedProvider: attempts[0]!.provider,
  }
}

/* ─── SSE stream forwarder ───────────────────────────────── */
function forwardSSEStream(upstream: Response): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()
  return new ReadableStream({
    async start(controller) {
      const reader = upstream.body?.getReader()
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
        // flush remaining buffer
        if (buffer.trim().startsWith('data: ')) {
          const data = buffer.trim().slice(6).trim()
          if (data && data !== '[DONE]') {
            try {
              const parsed = JSON.parse(data)
              const text = parsed?.choices?.[0]?.delta?.content
              if (typeof text === 'string' && text.length > 0) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`))
              }
            } catch {}
          }
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
      } catch (err) {
        controller.error(err)
      } finally {
        controller.close()
      }
    },
  })
}

/* ─── Route handler ──────────────────────────────────────── */
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    const isLoggedIn = !!session?.user

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      ?? req.headers.get('x-real-ip')
      ?? 'unknown'
    const limitKey = isLoggedIn
      ? `user:${session!.user!.id ?? session!.user!.email}`
      : `ip:${ip}`

    const limitCheck = checkLimit(limitKey, isLoggedIn)
    if (!limitCheck.allowed) {
      return new Response(
        JSON.stringify({ error: 'rate_limit', isLoggedIn, used: limitCheck.used, limit: limitCheck.limit }),
        { status: 429, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const {
      messages,
      model: requestedModel,
      skillId = 'general',
      langId = 'id',
      webSearch = false,
    } = await req.json()

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'Messages are required' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      })
    }

    const openrouterKey = process.env.OPENROUTER_API_KEY
    const nvidiaKey     = process.env.NVIDIA_API_KEY

    if (!openrouterKey && !nvidiaKey) {
      return new Response(JSON.stringify({ error: 'No API keys configured' }), {
        status: 500, headers: { 'Content-Type': 'application/json' },
      })
    }

    incrementUsage(limitKey)

    const skill = getSkillById(skillId)
    const language = getLanguageById(langId)
    const webNote = webSearch
      ? '\n\n## WEB SEARCH MODE\nUser mengaktifkan web search. Kamu tidak bisa browsing, tapi berikan jawaban terbaik dan sarankan user verifikasi ke sumber terpercaya.'
      : ''
    const systemPrompt = BASE_SYSTEM_PROMPT + language.systemAddendum + (skill.systemPromptAddendum || '') + webNote

    const modelKey = requestedModel ?? DEFAULT_MODEL

    const { response, usedProvider } = await callWithFallback(
      modelKey, systemPrompt, messages, openrouterKey, nvidiaKey,
    )

    if (!response.ok) {
      const err = await response.text()
      console.error(`[chat] all providers failed. Last error:`, err)
      return new Response(
        JSON.stringify({ error: 'Waduh, ana masalah karo AI-ne. Coba maning!' }),
        { status: response.status, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const stream = forwardSSEStream(response)

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-RateLimit-Limit': String(limitCheck.limit),
        'X-RateLimit-Remaining': String(limitCheck.remaining - 1),
        'X-RateLimit-LoggedIn': String(isLoggedIn),
        'X-Provider': usedProvider,
      },
    })
  } catch (error) {
    console.error('[chat] unhandled error:', error)
    return new Response(
      JSON.stringify({ error: 'Waduh, ana masalah. Coba maning ya!' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
}
