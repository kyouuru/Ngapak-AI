import { NextRequest } from 'next/server'
import { getSkillById } from '@/lib/skills'
import { getLanguageById } from '@/lib/languages'
import { auth } from '@/lib/auth'
import { checkLimit, incrementUsage } from '@/lib/rateLimit'

export const runtime = 'nodejs'
export const maxDuration = 60  // Vercel max function duration (seconds) — needed for NVIDIA/slow providers

/* ─── Provider base URLs ─────────────────────────────────── */
const AGENTROUTER_BASE = 'https://agentrouter.org/v1'
const OPENROUTER_BASE  = 'https://openrouter.ai/api/v1'
const NVIDIA_BASE      = 'https://integrate.api.nvidia.com/v1'

export type Provider = 'agentrouter' | 'openrouter' | 'nvidia'

/* ─── Model registry ─────────────────────────────────────── */
// Each frontend model ID maps to per-provider IDs + preferred provider order
interface ModelConfig {
  agentrouter?: string  // model id on AgentRouter
  openrouter?:  string  // model id on OpenRouter
  nvidia?:      string  // model id on NVIDIA NIM
  primary:      Provider
}

export const MODEL_MAP: Record<string, ModelConfig> = {
  // AgentRouter models — primary, fallback ke OpenRouter/NVIDIA jika 401/error
  'agentrouter/claude-opus-4-8': {
    agentrouter: 'claude-opus-4-8',
    openrouter:  'nvidia/nemotron-3-super-120b-a12b:free',
    nvidia:      'deepseek-ai/deepseek-v4-flash-0731',
    primary:     'agentrouter',
  },
  'agentrouter/claude-opus-5': {
    agentrouter: 'claude-opus-5',
    openrouter:  'nvidia/nemotron-3-super-120b-a12b:free',
    nvidia:      'deepseek-ai/deepseek-v4-flash-0731',
    primary:     'agentrouter',
  },
  'agentrouter/gpt-5.6-sol': {
    agentrouter: 'gpt-5.6-sol',
    openrouter:  'nvidia/nemotron-3-super-120b-a12b:free',
    nvidia:      'deepseek-ai/deepseek-v4-flash-0731',
    primary:     'agentrouter',
  },
  // OpenRouter primary — Gemma 4 26B (free)
  'google/gemini-2.0-flash-001': {
    openrouter:  'google/gemma-4-26b-a4b-it:free',
    nvidia:      'nvidia/llama-3.3-nemotron-super-49b-v1',
    primary:     'openrouter',
  },
  // NVIDIA primary — Nemotron Super 49B (tested OK, replaces timed-out Llama 3.3)
  'meta-llama/llama-3.3-70b-instruct': {
    nvidia:      'nvidia/llama-3.3-nemotron-super-49b-v1',
    openrouter:  'nvidia/nemotron-3-super-120b-a12b:free',
    primary:     'nvidia',
  },
  // DeepSeek V4 Flash 0731 via NVIDIA — thinking model (tested OK)
  'nvidia/deepseek-v4-flash': {
    nvidia:      'deepseek-ai/deepseek-v4-flash-0731',
    openrouter:  'nvidia/nemotron-3-super-120b-a12b:free',
    primary:     'nvidia',
  },
}

const DEFAULT_MODEL = 'agentrouter/claude-opus-4-8'

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

/* ─── Flatten messages to text (for providers that don't support vision blocks) ── */
function flattenMessages(messages: { role: string; content: unknown }[]) {
  return messages.map((m) => ({
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
}

/* ─── Provider call functions ────────────────────────────── */
async function callProvider(
  provider: Provider,
  apiKey: string,
  modelId: string,
  systemPrompt: string,
  messages: { role: string; content: unknown }[],
): Promise<Response> {
  const isNvidia = provider === 'nvidia'
  const baseUrl = provider === 'agentrouter'
    ? AGENTROUTER_BASE
    : provider === 'openrouter'
    ? OPENROUTER_BASE
    : NVIDIA_BASE

  const flatMsgs = flattenMessages(messages)

  const headers: Record<string, string> = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  }
  if (provider === 'openrouter') {
    headers['HTTP-Referer'] = 'https://ngapak-ai.vercel.app'
    headers['X-Title'] = 'Ngapak AI'
  }
  // AgentRouter: Claude Code wire image headers required by WAF
  if (provider === 'agentrouter') {
    headers['anthropic-version'] = '2023-06-01'
    headers['anthropic-beta'] = 'max-tokens-3-5'
    headers['x-api-key'] = apiKey
    headers['user-agent'] = 'claude-code/1.0'
  }

  // AgentRouter uses Anthropic Messages API format, not OpenAI
  if (provider === 'agentrouter') {
    const flatMsgsAR = flattenMessages(messages)
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 28_000)
    try {
      return await fetch(`${AGENTROUTER_BASE}/messages`, {
        method: 'POST',
        headers,
        signal: controller.signal,
        body: JSON.stringify({
          model: modelId,
          max_tokens: 8096,
          stream: true,
          system: systemPrompt,
          messages: flatMsgsAR,
        }),
      })
    } finally {
      clearTimeout(timer)
    }
  }

  // All providers use OpenAI-compatible /chat/completions format
  const body = flatMsgs
  const isDeepSeekFlash = provider === 'nvidia' && modelId === 'deepseek-ai/deepseek-v4-flash-0731'
  // OpenRouter free models can be slow — give them enough time
  const timeoutMs = provider === 'nvidia' ? 55_000 : provider === 'openrouter' ? 45_000 : 28_000
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    return await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers,
      signal: controller.signal,
      body: JSON.stringify({
        model: modelId,
        stream: true,
        max_tokens: isDeepSeekFlash ? 16384 : (isNvidia ? 4096 : 8096),
        temperature: isDeepSeekFlash ? 1 : 0.7,
        top_p: isDeepSeekFlash ? 0.95 : 1,
        ...(isDeepSeekFlash ? { chat_template_kwargs: { thinking: true, reasoning_effort: 'high' } } : {}),
        messages: [{ role: 'system', content: systemPrompt }, ...body],
      }),
    })
  } finally {
    clearTimeout(timer)
  }
}

/* ─── Fallback orchestration ─────────────────────────────── */
interface Keys {
  agentrouter?: string
  openrouter?:  string
  nvidia?:      string
  nvidia2?:     string
  nvidia3?:     string
}

function buildAttempts(config: ModelConfig, keys: Keys) {
  type Attempt = { provider: Provider; modelId: string; key: string }
  const all: Attempt[] = []

  const maybe = (p: Provider, modelId: string | undefined, key?: string) => {
    if (modelId && key) all.push({ provider: p, modelId, key })
  }

  // Primary first
  maybe(config.primary, config[config.primary], keys[config.primary])

  // Fallback: nvidia2 key (second NVIDIA key) before other providers
  if (config.nvidia && keys.nvidia2 && config.primary !== 'nvidia') {
    all.push({ provider: 'nvidia', modelId: config.nvidia, key: keys.nvidia2 })
  }
  // Fallback: nvidia3 key (third NVIDIA key) — for DeepSeek V4 Pro
  if (config.nvidia && keys.nvidia3 && config.primary !== 'nvidia') {
    all.push({ provider: 'nvidia', modelId: config.nvidia, key: keys.nvidia3 })
  }

  // Then the other providers
  const fallbackOrder: Provider[] = ['nvidia', 'agentrouter', 'openrouter']
  for (const p of fallbackOrder) {
    if (p !== config.primary) maybe(p, config[p], keys[p])
  }

  // If nvidia already added via primary, also try nvidia2 & nvidia3 as extra fallback
  if (config.primary === 'nvidia' && config.nvidia) {
    if (keys.nvidia2) all.push({ provider: 'nvidia', modelId: config.nvidia, key: keys.nvidia2 })
    if (keys.nvidia3) all.push({ provider: 'nvidia', modelId: config.nvidia, key: keys.nvidia3 })
  }

  return all
}

async function callWithFallback(
  requestedModelKey: string,
  systemPrompt: string,
  messages: { role: string; content: unknown }[],
  keys: Keys,
): Promise<{ response: Response; usedProvider: Provider }> {
  const config = MODEL_MAP[requestedModelKey] ?? MODEL_MAP[DEFAULT_MODEL]!
  const attempts = buildAttempts(config, keys)

  // Last resort: try nvidia with both keys, then other providers
  if (attempts.length === 0) {
    const def = MODEL_MAP[DEFAULT_MODEL]!
    const tryKeys: [Provider, string | undefined][] = [
      ['nvidia', keys.nvidia],
      ['nvidia', keys.nvidia2],
      ['openrouter', keys.openrouter],
      ['agentrouter', keys.agentrouter],
    ]
    for (const [p, k] of tryKeys) {
      const modelId = def[p]
      if (k && modelId) { attempts.push({ provider: p, modelId, key: k }); break }
    }
  }
  if (attempts.length === 0) throw new Error('No API keys configured')

  let lastResponse: Response | null = null
  for (const { provider, modelId, key } of attempts) {
    try {
      console.log(`[chat] trying ${provider} → ${modelId}`)
      const res = await callProvider(provider, key, modelId, systemPrompt, messages)
      if (res.ok) return { response: res, usedProvider: provider }
      console.warn(`[chat] ${provider} returned ${res.status}, trying next…`)
      lastResponse = res
    } catch (err) {
      console.warn(`[chat] ${provider} threw:`, (err as Error).message)
    }
  }

  return {
    response: lastResponse ?? new Response('{}', { status: 500 }),
    usedProvider: attempts[0]!.provider,
  }
}

/* ─── SSE stream forwarder ───────────────────────────────── */
function forwardSSEStream(upstream: Response, provider: Provider): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()
  return new ReadableStream({
    async start(controller) {
      const reader = upstream.body?.getReader()
      const decoder = new TextDecoder()
      if (!reader) { controller.close(); return }
      let buffer = ''
      let chunkCount = 0
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''
          for (const line of lines) {
            const trimmed = line.trim()
            if (!trimmed) continue
            let dataStr = trimmed
            if (trimmed.startsWith('data: ')) {
              dataStr = trimmed.slice(6).trim()
            } else if (!trimmed.startsWith('{')) {
              continue
            }
            if (dataStr === '[DONE]') {
              controller.enqueue(encoder.encode('data: [DONE]\n\n'))
              return
            }
            try {
              const parsed = JSON.parse(dataStr)
              let text: string | undefined

              // Anthropic SSE (AgentRouter): content_block_delta
              if (parsed?.type === 'content_block_delta') {
                text = parsed?.delta?.text
              } else if (parsed?.type === 'message_stop') {
                controller.enqueue(encoder.encode('data: [DONE]\n\n'))
                return
              } else if (parsed?.type === 'content_block_start') {
                // Skip — no text yet
                continue
              } else if (parsed?.type === 'message_start' || parsed?.type === 'message_delta' || parsed?.type === 'ping') {
                // Skip metadata events
                continue
              } else {
                // OpenAI SSE (OpenRouter, NVIDIA)
                const delta = parsed?.choices?.[0]?.delta
                // Only forward actual content — skip reasoning/thinking tokens
                text = delta?.content ?? undefined
                if (text === null || text === undefined) continue
              }

              if (typeof text === 'string' && text.length > 0) {
                chunkCount++
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`))
              }
            } catch {
              // unparseable line — skip silently
            }
          }
        }
        // flush remaining buffer
        if (buffer.trim()) {
          let dataStr = buffer.trim()
          if (dataStr.startsWith('data: ')) dataStr = dataStr.slice(6).trim()
          if (dataStr && dataStr !== '[DONE]') {
            try {
              const parsed = JSON.parse(dataStr)
              let text: string | undefined
              if (provider === 'agentrouter') {
                text = parsed?.delta?.text
              } else {
                const delta = parsed?.choices?.[0]?.delta
                text = delta?.content ?? undefined
              }
              if (typeof text === 'string' && text.length > 0)
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`))
            } catch {}
          }
        }
        console.log(`[chat] ${provider} stream done, chunks: ${chunkCount}`)
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
      } catch (err) {
        console.error(`[chat] stream error (${provider}):`, err)
        // Don't error — just close with DONE so client gets partial content
        try { controller.enqueue(encoder.encode('data: [DONE]\n\n')) } catch {}
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
      ?? req.headers.get('x-real-ip') ?? 'unknown'
    const limitKey = isLoggedIn
      ? `user:${session!.user!.id ?? session!.user!.email}` : `ip:${ip}`

    // ── Load user plan from DB to get correct daily limit ────────
    let dailyLimit: number | undefined
    if (isLoggedIn && session?.user?.email) {
      const { getUserPlan } = await import('@/lib/db')
      const userPlan = await getUserPlan(session.user.email)
      const { PLANS } = await import('@/lib/plans')
      const plan = PLANS.find((p) => p.id === userPlan.planId)
      if (plan) dailyLimit = plan.limits.dailyMessages
    }

    const limitCheck = await checkLimit(limitKey, isLoggedIn, dailyLimit)
    if (!limitCheck.allowed) {
      return new Response(
        JSON.stringify({ error: 'rate_limit', isLoggedIn, used: limitCheck.used, limit: limitCheck.limit }),
        { status: 429, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const { messages, model: requestedModel, skillId = 'general', langId = 'id', webSearch = false } = await req.json()
    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'Messages are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } })
    }

    // ── Input guards ────────────────────────────────────────────
    if (messages.length > 100) {
      return new Response(JSON.stringify({ error: 'Terlalu banyak pesan dalam satu sesi.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } })
    }
    for (const m of messages) {
      if (typeof m.content === 'string' && m.content.length > 32_000) {
        return new Response(JSON.stringify({ error: 'Pesan terlalu panjang (maks 32.000 karakter).' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } })
      }
    }

    // ── Model tier enforcement ───────────────────────────────────
    // Free/guest users may not access paid models
    const { modelRequiresPlan } = await import('@/lib/plans')
    const requiredPlan = modelRequiresPlan(requestedModel ?? DEFAULT_MODEL)
    if (requiredPlan && !isLoggedIn) {
      return new Response(
        JSON.stringify({ error: 'model_gated', message: 'Login dan upgrade plan untuk menggunakan model premium.' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const keys: Keys = {
      agentrouter: process.env.AGENTROUTER_API_KEY,
      openrouter:  process.env.OPENROUTER_API_KEY,
      nvidia:      process.env.NVIDIA_API_KEY,
      nvidia2:     process.env.NVIDIA_API_KEY_2,
      nvidia3:     process.env.NVIDIA_API_KEY_3,
    }
    if (!keys.agentrouter && !keys.openrouter && !keys.nvidia) {
      return new Response(JSON.stringify({ error: 'No API keys configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } })
    }

    await incrementUsage(limitKey)

    const skill    = getSkillById(skillId)
    const language = getLanguageById(langId)
    const webNote  = webSearch
      ? '\n\n## WEB SEARCH MODE\nKamu tidak bisa browsing, tapi berikan jawaban terbaik dan sarankan user verifikasi ke sumber terpercaya.'
      : ''
    const systemPrompt = BASE_SYSTEM_PROMPT + language.systemAddendum + (skill.systemPromptAddendum || '') + webNote

    const { response, usedProvider } = await callWithFallback(
      requestedModel ?? DEFAULT_MODEL, systemPrompt, messages, keys,
    )

    if (!response.ok) {
      const err = await response.text()
      console.error('[chat] all providers failed:', err)
      return new Response(
        JSON.stringify({ error: 'Waduh, ana masalah karo AI-ne. Coba maning!' }),
        { status: response.status, headers: { 'Content-Type': 'application/json' } },
      )
    }

    return new Response(forwardSSEStream(response, usedProvider), {
      headers: {
        'Content-Type':            'text/event-stream',
        'Cache-Control':           'no-cache',
        'Connection':              'keep-alive',
        'X-RateLimit-Limit':       String(limitCheck.limit),
        'X-RateLimit-Remaining':   String(limitCheck.remaining - 1),
        'X-RateLimit-LoggedIn':    String(isLoggedIn),
      },
    })
  } catch (error) {
    console.error('[chat] unhandled:', error)
    return new Response(
      JSON.stringify({ error: 'Waduh, ana masalah. Coba maning ya!' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
}
