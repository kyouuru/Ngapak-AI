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
      'Model AI gratis (DeepSeek, Gemini)',
      'Semua bahasa daerah',
      'Semua skill/mode',
    ],
    limits: {
      dailyMessages: 5,
      models: ['deepseek/deepseek-chat-v3-0324:free', 'google/gemini-2.0-flash-001', 'meta-llama/llama-3.3-70b-instruct'],
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
      'Semua model AI (termasuk Claude)',
      'Analisis gambar (Vision AI)',
      'Upload & analisis file kode',
      'Semua bahasa daerah',
      'Semua skill/mode',
    ],
    limits: {
      dailyMessages: 50,
      models: ['deepseek/deepseek-chat-v3-0324:free', 'google/gemini-2.0-flash-001', 'anthropic/claude-3.5-haiku', 'anthropic/claude-3.5-sonnet', 'meta-llama/llama-3.3-70b-instruct'],
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
      'Analisis gambar (Vision AI)',
      'Upload & analisis semua jenis file',
      'Priority response',
      'Semua bahasa daerah',
      'Semua skill/mode',
      'Akses fitur beta',
    ],
    limits: {
      dailyMessages: 200,
      models: ['deepseek/deepseek-chat-v3-0324:free', 'google/gemini-2.0-flash-001', 'anthropic/claude-3.5-haiku', 'anthropic/claude-3.5-sonnet', 'anthropic/claude-3-opus-20240229', 'meta-llama/llama-3.3-70b-instruct'],
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

// Model yang butuh plan berbayar
export const PAID_MODELS = [
  'anthropic/claude-3.5-sonnet',
  'anthropic/claude-3.5-haiku',
  'anthropic/claude-3-opus-20240229',
]

export function modelRequiresPlan(modelId: string): PlanId | null {
  if (PAID_MODELS.includes(modelId)) return 'mini'
  return null
}
