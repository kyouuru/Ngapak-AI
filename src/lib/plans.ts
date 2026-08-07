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
      'Gemini 2.0 Flash, Llama 3.3, DeepSeek V4',
      'Semua bahasa daerah',
      'Upload file kode',
    ],
    limits: {
      dailyMessages: 5,
      models: ['agentrouter/claude-opus-4-8', 'google/gemini-2.0-flash-001', 'meta-llama/llama-3.3-70b-instruct'],
      vision: false,
      fileUpload: true,
      priority: false,
    },
  },
  {
    id: 'mini',
    name: 'Mini',
    price: 49000,
    priceLabel: 'Rp 49.000/bulan',
    description: 'Untuk pengguna aktif sehari-hari',
    badge: 'Populer',
    badgeColor: 'text-violet-400 bg-violet-400/10 border-violet-400/20',
    features: [
      '50 chat per hari',
      'Semua model AI (AgentRouter, OpenRouter, NVIDIA)',
      'Claude Opus 4.8, Opus 5, GPT-5.6 Sol',
      'Analisis gambar (Vision AI)',
      'Upload & analisis file kode',
      'Semua bahasa daerah',
    ],
    limits: {
      dailyMessages: 50,
      models: ['agentrouter/claude-opus-4-8', 'agentrouter/claude-opus-5', 'agentrouter/gpt-5.6-sol', 'google/gemini-2.0-flash-001', 'meta-llama/llama-3.3-70b-instruct', 'nvidia/deepseek-v4-pro'],
      vision: true,
      fileUpload: true,
      priority: false,
    },
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 99000,
    priceLabel: 'Rp 99.000/bulan',
    description: 'Untuk profesional dan developer',
    badge: 'Terbaik',
    badgeColor: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
    features: [
      '200 chat per hari',
      'Semua model AI premium',
      'Claude Opus 4.8, Opus 5, GPT-5.6 Sol',
      'Analisis gambar (Vision AI)',
      'Upload & analisis semua jenis file',
      'Priority response',
      'Semua bahasa daerah',
      'Akses fitur beta',
    ],
    limits: {
      dailyMessages: 200,
      models: ['agentrouter/claude-opus-4-8', 'agentrouter/claude-opus-5', 'agentrouter/gpt-5.6-sol', 'google/gemini-2.0-flash-001', 'meta-llama/llama-3.3-70b-instruct', 'nvidia/deepseek-v4-pro'],
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
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price)
}

// Model yang butuh plan berbayar (kosong — semua AgentRouter models sudah free via key sendiri)
export const PAID_MODELS: string[] = []

export function modelRequiresPlan(_modelId: string): PlanId | null {
  return null
}
