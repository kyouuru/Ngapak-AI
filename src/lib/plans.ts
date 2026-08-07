export type PlanId = 'free' | 'mini' | 'pro'

export interface Plan {
  id: PlanId
  name: string
  price: number // IDR
  priceLabel: string
  description: string
  badge?: string
  badgeColor?: string
  features: string[]
  limits: {
    dailyMessages: number
    models: string[]
    vision: boolean      // bisa analisis gambar
    fileUpload: boolean  // bisa upload file
    priority: boolean    // priority response
  }
}

export const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Gratis',
    price: 0,
    priceLabel: 'Gratis',
    description: 'Coba Ngapak AI tanpa biaya',
    features: [
      '5 chat per hari',
      'Claude Opus 4.8, Claude Opus 5, GPT-5.6 Sol',
      'Gemini 2.0 Flash, Llama 3.3, DeepSeek V4 Flash & Pro',
      'Semua bahasa daerah',
      'Upload file kode',
    ],
    limits: {
      dailyMessages: 5,
      models: ['agentrouter/claude-opus-4-8', 'google/gemini-2.0-flash-001', 'meta-llama/llama-3.3-70b-instruct', 'nvidia/deepseek-v4-flash'],
      vision: false,
      fileUpload: true,
      priority: false,
    },  },
  {
    id: 'mini',
    name: 'Mini',
    price: 3.99,
    priceLabel: '$3.99/bulan',
    description: 'Untuk pengguna aktif sehari-hari',
    badge: 'Populer',
    badgeColor: 'text-white bg-[#b5502e] border-[#b5502e]',
    features: [
      '50 chat per hari',
      'Semua model AI (AgentRouter, OpenRouter, NVIDIA)',
      'Claude Opus 4.8, Opus 5, GPT-5.6 Sol',
      'DeepSeek V4 Flash (Thinking) & V4 Pro',
      'Analisis gambar (Vision AI)',
      'Upload & analisis file kode',
      'Semua bahasa daerah',
    ],
    limits: {
      dailyMessages: 50,
      models: ['agentrouter/claude-opus-4-8', 'agentrouter/claude-opus-5', 'agentrouter/gpt-5.6-sol', 'google/gemini-2.0-flash-001', 'meta-llama/llama-3.3-70b-instruct', 'nvidia/deepseek-v4-flash'],
      vision: true,
      fileUpload: true,
      priority: false,
    },
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 7.99,
    priceLabel: '$7.99/bulan',
    description: 'Untuk profesional dan developer',
    badge: 'Terbaik',
    badgeColor: 'text-white bg-[#445d3b] border-[#445d3b]',
    features: [
      '200 chat per hari',
      'Semua model AI premium',
      'Claude Opus 4.8, Opus 5, GPT-5.6 Sol',
      'DeepSeek V4 Flash (Thinking) & V4 Pro',
      'Analisis gambar (Vision AI)',
      'Upload & analisis semua jenis file',
      'Priority response',
      'Semua bahasa daerah',
      'Akses fitur beta',
    ],
    limits: {
      dailyMessages: 200,
      models: ['agentrouter/claude-opus-4-8', 'agentrouter/claude-opus-5', 'agentrouter/gpt-5.6-sol', 'google/gemini-2.0-flash-001', 'meta-llama/llama-3.3-70b-instruct', 'nvidia/deepseek-v4-flash'],
      vision: true,
      fileUpload: true,
      priority: true,
    },
  },
]

export function getPlanById(id: PlanId): Plan {
  return PLANS.find((p) => p.id === id) ?? PLANS[0]!
}

export function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`
}

// Model yang butuh plan berbayar — AgentRouter premium models
export const PAID_MODELS: string[] = [
  'agentrouter/claude-opus-5',
  'agentrouter/gpt-5.6-sol',
]

export function modelRequiresPlan(modelId: string): PlanId | null {
  if (PAID_MODELS.includes(modelId)) return 'mini'
  return null
}
