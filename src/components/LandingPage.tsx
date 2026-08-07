'use client'

import { useEffect, useState, type CSSProperties } from 'react'
import { useSession, signIn } from 'next-auth/react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import {
  ArrowRight,
  BadgeCheck,
  Banknote,
  Bot,
  Check,
  ChevronDown,
  CircleDollarSign,
  Code2,
  CreditCard,
  FileText,
  Fingerprint,
  Gauge,
  Globe2,
  Layers3,
  LockKeyhole,
  Menu,
  MessageSquareText,
  Network,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  Timer,
  Wallet,
  X,
  Zap,
} from 'lucide-react'
import { PLANS, type Plan } from '@/lib/plans'
import { cn } from '@/lib/utils'
import { AnimatedSection, CountUp, StaggerGroup, StaggerItem } from './motion-primitives'

const CryptoCheckoutModal = dynamic(
  () => import('./CryptoCheckoutModal').then((module) => module.CryptoCheckoutModal),
  { ssr: false },
)

const navItems = [
  ['Fitur', '#features'],
  ['Checkout', '#pricing'],
  ['Perbandingan', '#comparison'],
  ['FAQ', '#faq'],
] as const

const chainBadges = ['Ethereum', 'Base', 'Arbitrum', 'Polygon', 'BSC', 'Optimism', 'Solana']

const aiProviders = ['Claude', 'OpenAI', 'DeepSeek', 'OpenRouter', 'Gemini', 'Mistral', 'Llama', 'Anthropic']

const stats = [
  { label: 'Chain pembayaran', value: '7+' },
  { label: 'Kartu kredit', value: '0' },
  { label: 'Verifikasi', value: 'RPC' },
] as const

const featureCards = [
  { icon: MessageSquareText, title: 'Ngobrol rasa lokal', desc: 'Bahasa Indonesia, Ngapak Banyumas, dan gaya jawaban yang tetap rapi buat kerja harian.' },
  { icon: Code2, title: 'Coding & debugging', desc: 'Review error, refactor, jelasin konsep, sampai bantu baca file kode tanpa drama.' },
  { icon: FileText, title: 'Analisis file', desc: 'Upload dokumen, gambar, atau snippet kode untuk dijadikan ringkasan dan insight cepat.' },
  { icon: Network, title: 'Crypto-native checkout', desc: 'EVM dan Solana disiapkan dalam flow checkout bertahap, bukan sekadar tombol wallet.' },
  { icon: ShieldCheck, title: 'Non-custodial', desc: 'Private key tetap di wallet pengguna. Server hanya memverifikasi transaksi on-chain.' },
  { icon: Gauge, title: 'Landing tetap cepat', desc: 'Modal checkout dimuat dinamis supaya hero dan konten utama tidak berat di awal.' },
] as const

const trustItems = [
  { icon: LockKeyhole, title: 'Private key aman', desc: 'Tidak pernah disimpan atau dikirim ke server.' },
  { icon: ReceiptText, title: 'Hash diverifikasi', desc: 'Unlock paket melewati endpoint verifikasi RPC.' },
  { icon: Fingerprint, title: 'Identitas wallet jelas', desc: 'Chain, token, jumlah, dan explorer link ditampilkan.' },
] as const

const comparisonRows = [
  ['Bahasa daerah Indonesia', true, false, false],
  ['Dialek Ngapak Banyumas', true, false, false],
  ['Multi-model AI', true, true, true],
  ['Upload file dan gambar', true, true, true],
  ['Bisa bayar pakai crypto', true, false, false],
  ['Tanpa kartu kredit dan KYC', true, false, false],
] as const

const faqs = [
  ['Apakah Ngapak AI benar-benar gratis?', 'Ya. Paket Starter bisa dipakai tanpa wallet dan tanpa kartu kredit untuk kebutuhan dasar harian.'],
  ['Apakah aman bayar pakai crypto?', 'Aman selama pengguna memeriksa jaringan, alamat tujuan, dan nominal di wallet. Ngapak AI tidak menyimpan private key dan verifikasi dilakukan on-chain lewat backend.'],
  ['Chain apa saja yang didukung?', 'Landing page dan checkout disiapkan untuk EVM utama seperti Ethereum, Base, Arbitrum, Polygon, BSC, Optimism, serta Solana.'],
  ['Kapan paket aktif setelah bayar?', 'Setelah transaksi ditemukan dan lolos verifikasi RPC. Untuk production, aktivasi harus disimpan ke database setelah jumlah dan penerima tervalidasi.'],
] as const

// 6 motif batik berbeda — tiap baris pakai motif sendiri
const BATIK_MOTIFS = [
  // 0 — kawung: 4 elips mengelilingi titik tengah
  `url("data:image/svg+xml,%3Csvg width='160' height='160' viewBox='0 0 160 160' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%236b3f2b' stroke-width='1.5' stroke-opacity='.32'%3E%3Cellipse cx='80' cy='46' rx='18' ry='30'/%3E%3Cellipse cx='80' cy='114' rx='18' ry='30'/%3E%3Cellipse cx='46' cy='80' rx='30' ry='18'/%3E%3Cellipse cx='114' cy='80' rx='30' ry='18'/%3E%3Ccircle cx='80' cy='80' r='8'/%3E%3Ccircle cx='80' cy='80' r='3' fill='%236b3f2b' fill-opacity='.28'/%3E%3C/g%3E%3C/svg%3E")`,

  // 1 — parang: diagonal garis berlapis seperti ombak
  `url("data:image/svg+xml,%3Csvg width='160' height='160' viewBox='0 0 160 160' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%236b3f2b' stroke-width='1.5' stroke-opacity='.30'%3E%3Cpath d='M0 40 Q40 10 80 40 Q120 70 160 40'/%3E%3Cpath d='M0 80 Q40 50 80 80 Q120 110 160 80'/%3E%3Cpath d='M0 120 Q40 90 80 120 Q120 150 160 120'/%3E%3Cpath d='M0 160 Q40 130 80 160 Q120 190 160 160'/%3E%3Cpath d='M0 0 Q40 -30 80 0 Q120 30 160 0'/%3E%3C/g%3E%3C/svg%3E")`,

  // 2 — truntum: bintang 8 sudut berulang
  `url("data:image/svg+xml,%3Csvg width='160' height='160' viewBox='0 0 160 160' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%236b3f2b' stroke-width='1.5' stroke-opacity='.32'%3E%3Cpath d='M80 50 L86 72 L108 66 L90 82 L108 98 L86 92 L80 114 L74 92 L52 98 L70 82 L52 66 L74 72 Z'/%3E%3Ccircle cx='80' cy='82' r='10'/%3E%3Ccircle cx='80' cy='82' r='4' fill='%236b3f2b' fill-opacity='.22'/%3E%3Ccircle cx='26' cy='26' r='5'/%3E%3Ccircle cx='134' cy='26' r='5'/%3E%3Ccircle cx='26' cy='134' r='5'/%3E%3Ccircle cx='134' cy='134' r='5'/%3E%3C/g%3E%3C/svg%3E")`,

  // 3 — ceplok: belah ketupat bertumpuk dengan ornamen sudut
  `url("data:image/svg+xml,%3Csvg width='160' height='160' viewBox='0 0 160 160' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%236b3f2b' stroke-width='1.5' stroke-opacity='.30'%3E%3Crect x='50' y='50' width='60' height='60' rx='4' transform='rotate(45 80 80)'/%3E%3Crect x='62' y='62' width='36' height='36' rx='2' transform='rotate(45 80 80)'/%3E%3Ccircle cx='80' cy='80' r='6'/%3E%3Cline x1='80' y1='18' x2='80' y2='38'/%3E%3Cline x1='80' y1='122' x2='80' y2='142'/%3E%3Cline x1='18' y1='80' x2='38' y2='80'/%3E%3Cline x1='122' y1='80' x2='142' y2='80'/%3E%3C/g%3E%3C/svg%3E")`,

  // 4 — mega mendung: awan berlapis khas Cirebon
  `url("data:image/svg+xml,%3Csvg width='200' height='160' viewBox='0 0 200 160' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%236b3f2b' stroke-width='1.5' stroke-opacity='.30'%3E%3Cpath d='M0 90 Q25 50 50 70 Q60 40 80 60 Q95 30 110 55 Q130 35 150 60 Q165 42 180 65 Q190 50 200 70'/%3E%3Cpath d='M0 110 Q25 70 50 90 Q60 60 80 80 Q95 50 110 75 Q130 55 150 80 Q165 62 180 85 Q190 70 200 90'/%3E%3Cpath d='M0 130 Q25 90 50 110 Q60 80 80 100 Q95 70 110 95 Q130 75 150 100 Q165 82 180 105 Q190 90 200 110'/%3E%3C/g%3E%3C/svg%3E")`,

  // 5 — sidomukti: kotak dengan ornamen dalam dan titik simetris
  `url("data:image/svg+xml,%3Csvg width='160' height='160' viewBox='0 0 160 160' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%236b3f2b' stroke-width='1.5' stroke-opacity='.32'%3E%3Crect x='30' y='30' width='100' height='100' rx='6'/%3E%3Crect x='46' y='46' width='68' height='68' rx='4'/%3E%3Ccircle cx='80' cy='80' r='14'/%3E%3Ccircle cx='80' cy='80' r='5' fill='%236b3f2b' fill-opacity='.25'/%3E%3Ccircle cx='30' cy='30' r='5'/%3E%3Ccircle cx='130' cy='30' r='5'/%3E%3Ccircle cx='30' cy='130' r='5'/%3E%3Ccircle cx='130' cy='130' r='5'/%3E%3C/g%3E%3C/svg%3E")`,
]

const TILE_WIDTHS = [160, 160, 160, 160, 200, 160]
const ROW_COUNT   = BATIK_MOTIFS.length

// ── Crypto Flow Demo ────────────────────────────────────────────
type CheckoutStep = 'network' | 'token' | 'confirm' | 'done'
const FLOW_NETWORKS = ['Ethereum', 'Base', 'Arbitrum', 'Polygon', 'BSC', 'Optimism', 'Solana']
const FLOW_TOKENS   = ['USDC', 'ETH', 'SOL', 'USDT']

function CryptoFlowDemo() {
  const [step, setStep]         = useState<CheckoutStep>('network')
  const [network, setNetwork]   = useState<string | null>(null)
  const [token, setToken]       = useState<string | null>(null)
  const [highlighted, setHighlighted] = useState<number>(2)

  useEffect(() => {
    let t: ReturnType<typeof setTimeout>

    if (step === 'network') {
      setNetwork(null); setToken(null); setHighlighted(2)
      t = setTimeout(() => {
        setNetwork('Arbitrum')
        setTimeout(() => setStep('token'), 500)
      }, 1200)
    } else if (step === 'token') {
      setHighlighted(0)
      t = setTimeout(() => {
        setToken('USDC')
        setTimeout(() => setStep('confirm'), 500)
      }, 1000)
    } else if (step === 'confirm') {
      t = setTimeout(() => setStep('done'), 2000)
    } else if (step === 'done') {
      t = setTimeout(() => setStep('network'), 2800)
    }

    return () => clearTimeout(t)
  }, [step])

  return (
    <div className="ink-outline relative mx-auto mt-6 w-full max-w-3xl rotate-1 overflow-hidden rounded-[1rem_2rem_1.4rem_2.2rem] bg-[#ead6b5] px-5 py-4">
      {/* header + step dots */}
      <div className="flex items-center justify-between">
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-[#60412f]">
          {step === 'network' && 'Pilih jaringan'}
          {step === 'token'   && 'Pilih token pembayaran'}
          {step === 'confirm' && 'Konfirmasi transaksi'}
          {step === 'done'    && 'Pembayaran berhasil'}
        </p>
        <div className="flex items-center gap-1.5">
          {(['network','token','confirm','done'] as CheckoutStep[]).map((s) => (
            <span key={s} className={cn('h-1.5 rounded-full transition-all duration-500', step === s ? 'w-5 bg-[#b5502e]' : 'w-1.5 bg-[#4a2d1c]/20')} />
          ))}
        </div>
      </div>

      <div className="mt-3 min-h-[52px] transition-all duration-300">

        {/* Step 1 — pilih jaringan */}
        {step === 'network' && (
          <div className="flex flex-wrap gap-2">
            {FLOW_NETWORKS.map((n, i) => (
              <span key={n} className={cn(
                'whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-300',
                i === highlighted
                  ? 'scale-105 border-[#b5502e]/60 bg-[#b5502e]/15 text-[#b5502e] shadow-sm'
                  : 'border-[#4a2d1c]/15 bg-[#fff4dc]/60 text-[#60412f]'
              )}>{n}</span>
            ))}
          </div>
        )}

        {/* Step 2 — pilih token */}
        {step === 'token' && (
          <div className="flex items-center gap-3">
            <span className="rounded-full border border-[#445d3b]/40 bg-[#445d3b]/10 px-3 py-1.5 text-xs font-semibold text-[#445d3b]">{network}</span>
            <span className="text-xs text-[#8a6b52]">→</span>
            <div className="flex gap-2">
              {FLOW_TOKENS.map((tk, i) => (
                <span key={tk} className={cn(
                  'rounded-xl border px-3 py-1.5 font-mono text-xs font-semibold transition-all duration-300',
                  i === highlighted
                    ? 'scale-105 border-[#b5502e]/60 bg-[#b5502e]/15 text-[#b5502e] shadow-sm'
                    : 'border-[#4a2d1c]/15 bg-[#fff4dc]/60 text-[#60412f]'
                )}>{tk}</span>
              ))}
            </div>
          </div>
        )}

        {/* Step 3 — konfirmasi */}
        {step === 'confirm' && (
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="rounded-full border border-[#445d3b]/40 bg-[#445d3b]/10 px-3 py-1.5 text-xs font-semibold text-[#445d3b]">{network}</span>
              <span className="rounded-xl border border-[#4a2d1c]/15 bg-[#fff4dc]/60 px-3 py-1.5 font-mono text-xs font-semibold text-[#60412f]">{token}</span>
              <span className="text-xs font-bold text-[#241711]">$3.99</span>
            </div>
            <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-[#b5502e] px-4 py-1.5 text-xs font-bold text-[#fff4dc]">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#fff4dc]" style={{ animationDelay: '0ms' }} />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#fff4dc]" style={{ animationDelay: '150ms' }} />
              <span className="ml-1">Verifikasi...</span>
            </span>
          </div>
        )}

        {/* Step 4 — done */}
        {step === 'done' && (
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#445d3b] text-sm font-bold text-[#fff4dc] shadow-md">✓</span>
            <div>
              <p className="text-sm font-semibold text-[#241711]">Transaksi terverifikasi</p>
              <p className="text-xs text-[#60412f]">{network} · {token} · $3.99 · Akses Pro aktif</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function BatikMarqueeBackground() {
  return (
    <div
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      aria-hidden="true"
    >
      {Array.from({ length: ROW_COUNT }).map((_, i) => {
        const goRight = i % 2 === 0
        const tileW   = TILE_WIDTHS[i]
        return (
          <div
            key={i}
            className="absolute left-0 right-0"
            style={{ top: `${(i / ROW_COUNT) * 100}%`, height: `${100 / ROW_COUNT}%` }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundImage: BATIK_MOTIFS[i],
                backgroundSize: `${tileW}px ${tileW}px`,
                backgroundRepeat: 'repeat-x',
                backgroundPosition: '0 center',
                animation: `batikRow${goRight ? 'Right' : 'Left'} ${28 + i * 4}s linear infinite`,
                willChange: 'background-position',
                ['--tile-w' as string]: `${tileW}px`,
              }}
            />
          </div>
        )
      })}
    </div>
  )
}

// ── Section Wave Divider ─────────────────────────────────────────
function SectionDivider({
  from = '#f4e6ca',
  to = '#ead6b5',
  variant = 0,
  flip = false,
}: {
  from?: string
  to?: string
  variant?: 0 | 1 | 2 | 3
  flip?: boolean
}) {
  // 2 layer saja — back (lebih transparan, lebih dalam) & front (solid, lebih tinggi)
  const paths: Record<0|1|2|3, { back: string; front: string }> = {
    // 0 — mengalir lebar
    0: {
      back:  'M0,18 C360,68 900,0 1440,30 L1440,80 L0,80 Z',
      front: 'M0,42 C280,10 800,62 1440,28 L1440,80 L0,80 Z',
    },
    // 1 — bergelombang 3 puncak
    1: {
      back:  'M0,22 C180,70 360,8 540,48 C720,80 960,10 1200,44 C1320,62 1400,32 1440,36 L1440,80 L0,80 Z',
      front: 'M0,46 C240,16 500,68 720,38 C940,12 1180,60 1440,40 L1440,80 L0,80 Z',
    },
    // 2 — asimetris tajam
    2: {
      back:  'M0,14 C500,80 900,4 1440,32 L1440,80 L0,80 Z',
      front: 'M0,40 C200,8 700,74 1440,36 L1440,80 L0,80 Z',
    },
    // 3 — dangkal rata
    3: {
      back:  'M0,36 C360,72 720,20 1080,52 C1260,66 1380,38 1440,44 L1440,80 L0,80 Z',
      front: 'M0,56 C480,28 960,72 1440,50 L1440,80 L0,80 Z',
    },
  }
  const p = paths[variant]

  return (
    <div
      className="pointer-events-none relative -my-px overflow-hidden leading-[0]"
      style={{ background: from, transform: flip ? 'scaleY(-1)' : undefined }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 1440 80"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        className="block h-20 w-full sm:h-28"
      >
        <path d={p.back}  fill={to} fillOpacity="0.55" style={{ animation: 'waveDrift1 4s ease-in-out infinite', transformOrigin: 'center bottom' }} />
        <path d={p.front} fill={to} fillOpacity="1"    style={{ animation: 'waveDrift2 3s ease-in-out infinite', transformOrigin: 'center bottom' }} />
      </svg>
    </div>
  )
}

// ── Animated Section Background ──────────────────────────────────
// ── Section Ambient Animation ────────────────────────────────────
// Tiap section punya animasi ambient sendiri: blob + ring berputar + partikel
function SectionBlobs({
  color  = '#b5502e',
  color2 = '#445d3b',
  count  = 2,
}: {
  color?:  string
  color2?: string
  count?:  number
}) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* primary blobs */}
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={`blob-${i}`}
          className="absolute rounded-full"
          style={{
            background: i % 2 === 0 ? color : color2,
            width:  `clamp(280px, ${32 + i * 18}vw, 600px)`,
            height: `clamp(280px, ${32 + i * 18}vw, 600px)`,
            top:    i % 2 === 0 ? '-15%' : '45%',
            left:   i % 2 === 0 ? '-12%' : '55%',
            opacity: 0.09,
            filter: 'blur(72px)',
            animation: `blobFloat${i % 3} ${16 + i * 6}s ease-in-out infinite alternate`,
          }}
        />
      ))}

      {/* accent ring kiri atas — berputar lambat */}
      <div
        className="absolute -left-20 -top-20 rounded-full border"
        style={{
          width: 'clamp(200px, 22vw, 380px)',
          height: 'clamp(200px, 22vw, 380px)',
          borderColor: `${color}28`,
          borderWidth: '1.5px',
          animation: 'ringRotateCW 28s linear infinite',
        }}
      />
      {/* inner ring — arah berlawanan */}
      <div
        className="absolute -left-10 -top-10 rounded-full border"
        style={{
          width: 'clamp(120px, 14vw, 240px)',
          height: 'clamp(120px, 14vw, 240px)',
          borderColor: `${color2}22`,
          borderWidth: '1px',
          animation: 'ringRotateCCW 20s linear infinite',
        }}
      />

      {/* accent ring kanan bawah */}
      <div
        className="absolute -bottom-16 -right-16 rounded-full border"
        style={{
          width: 'clamp(160px, 18vw, 320px)',
          height: 'clamp(160px, 18vw, 320px)',
          borderColor: `${color2}24`,
          borderWidth: '1.5px',
          animation: 'ringRotateCCW 34s linear infinite',
        }}
      />

      {/* partikel kecil melayang */}
      {[
        { cx: '20%', cy: '30%', delay: '0s',   dur: '8s'  },
        { cx: '75%', cy: '15%', delay: '2s',   dur: '11s' },
        { cx: '60%', cy: '70%', delay: '4.5s', dur: '9s'  },
        { cx: '10%', cy: '80%', delay: '1.5s', dur: '13s' },
        { cx: '88%', cy: '55%', delay: '3s',   dur: '10s' },
      ].map((p, i) => (
        <div
          key={`particle-${i}`}
          className="absolute rounded-full"
          style={{
            width: i % 2 === 0 ? '6px' : '4px',
            height: i % 2 === 0 ? '6px' : '4px',
            background: i % 2 === 0 ? color : color2,
            left: p.cx,
            top:  p.cy,
            opacity: 0.22,
            animation: `particleFloat ${p.dur} ease-in-out ${p.delay} infinite alternate`,
          }}
        />
      ))}

      {/* light streak diagonal */}
      <div
        className="absolute inset-y-0"
        style={{
          left: '30%',
          width: '1px',
          background: `linear-gradient(180deg, transparent 0%, ${color}18 40%, ${color2}14 60%, transparent 100%)`,
          animation: 'streakDrift 18s ease-in-out infinite alternate',
        }}
      />
    </div>
  )
}


function AnimatedHeadline() {
  return (
    <h1 className="font-display max-w-5xl text-[#241711]">
      {[
        ['AI', 'text-[clamp(5rem,16vw,13rem)] leading-[0.78]'],
        ['pinter', 'ml-[8vw] block text-[clamp(3.7rem,10vw,9rem)] leading-[0.86] text-[#b5502e]'],
        ['rasane', 'block text-[clamp(4.4rem,12vw,10rem)] leading-[0.82]'],
        ['ngapak.', 'ml-[18vw] block -rotate-2 text-[clamp(3.4rem,8vw,7rem)] leading-none text-[#445d3b]'],
      ].map(([word, classes], index) => (
        <span key={word} style={{ animationDelay: `${0.08 * index}s` }} className={cn('hero-word block', classes)}>
          {word}
        </span>
      ))}
    </h1>
  )
}

function ProviderPill({ name }: { name: string }) {
  return (
    <div className="mx-2 inline-flex h-12 min-w-36 items-center justify-center rounded-2xl border border-[#4a2d1c]/15 bg-[#fff4dc]/65 px-5 text-sm font-semibold text-[#60412f] opacity-70 grayscale transition duration-200 hover:scale-[1.04] hover:border-[#b5502e]/30 hover:text-[#241711] hover:opacity-100 hover:grayscale-0">
      {name}
    </div>
  )
}

function PoweredMarquee() {
  const doubled = [...aiProviders, ...aiProviders]
  const reversed = [...aiProviders].reverse()
  const doubledReverse = [...reversed, ...reversed]

  return (
    <AnimatedSection className="mx-auto max-w-7xl px-4 pb-12 sm:px-6">
      <div className="rounded-[2rem] border border-[#4a2d1c]/15 bg-[#fff4dc]/65 py-5 backdrop-blur-xl">
        <div className="mb-4 flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#8a6b52]">
          <Bot size={14} className="text-[#b5502e]" />
          Powered by / terintegrasi dengan model relevan
        </div>
        <div className="marquee-mask space-y-3 overflow-hidden">
          <div className="whitespace-nowrap overflow-hidden">
            <div className="marquee-track inline-flex">
              {doubled.map((name, index) => <ProviderPill key={`${name}-${index}`} name={name} />)}
            </div>
          </div>
          <div className="whitespace-nowrap overflow-hidden">
            <div className="marquee-track-reverse inline-flex">
              {doubledReverse.map((name, index) => <ProviderPill key={`${name}-reverse-${index}`} name={name} />)}
            </div>
          </div>
        </div>
      </div>
    </AnimatedSection>
  )
}

function WalletButton() {
  const [address, setAddress] = useState('')
  const [chainId, setChainId] = useState('0x1')
  const [loading, setLoading] = useState(false)

  const connectWallet = async () => {
    const ethereum = (window as unknown as { ethereum?: { request: (args: { method: string }) => Promise<unknown> } }).ethereum
    if (!ethereum) return
    setLoading(true)
    try {
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' }) as string[]
      const activeChain = await ethereum.request({ method: 'eth_chainId' }) as string
      setAddress(accounts[0] ?? '')
      setChainId(activeChain)
    } finally {
      setLoading(false)
    }
  }

  const chainBadge = ({ '0x1': 'ETH', '0x2105': 'BASE', '0xa4b1': 'ARB', '0x89': 'MATIC', '0x38': 'BNB', '0xa': 'OP' } as Record<string, string>)[chainId] ?? 'EVM'

  if (address) {
    return (
      <div className="hidden h-10 items-center gap-2 rounded-full border border-[#445d3b]/25 bg-[#445d3b]/10 px-3 text-xs text-[#445d3b] sm:flex">
        <span className="h-2 w-2 rounded-full bg-[#445d3b] shadow-[0_0_16px_rgba(68,93,59,0.45)]" />
        <span className="rounded-full bg-[#fff4dc]/80 px-2 py-1 font-mono text-[#60412f]">{chainBadge}</span>
        <span className="font-mono">{address.slice(0, 6)}...{address.slice(-4)}</span>
      </div>
    )
  }

  return (
    <button
      onClick={connectWallet}
      disabled={loading}
      className="h-10 cursor-pointer rounded-full border border-[#b5502e]/25 bg-[#b5502e]/10 px-3 text-xs font-semibold text-[#b5502e] transition duration-200 hover:border-[#b5502e]/50 hover:bg-[#b5502e]/16 focus:outline-none focus:ring-2 focus:ring-[#b5502e]/35 disabled:opacity-60"
    >
      <span className="inline-flex items-center gap-2">
        <Wallet size={14} />
        {loading ? 'Connecting...' : 'Connect Wallet'}
      </span>
    </button>
  )
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border-b border-[#4a2d1c]/15">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full cursor-pointer items-center justify-between gap-6 py-5 text-left transition hover:text-[#b5502e] focus:outline-none focus:ring-2 focus:ring-[#b5502e]/35"
      >
        <span className="font-medium text-[#241711]">{question}</span>
        <ChevronDown size={18} className={cn('shrink-0 text-[#8a6b52] transition-transform duration-200', open && 'rotate-180')} />
      </button>
      {open && <p className="pb-5 text-sm leading-7 text-[#60412f]">{answer}</p>}
    </div>
  )
}

const chatScripts = [
  {
    user: 'Jelasin error React iki nganggo bahasa sing gampang dipahami.',
    ai: 'Siap. Masalahe ana nang state update sing mlaku bareng render. Inyong pecah dadi 3 langkah ben gampang dicek.',
  },
  {
    user: 'Tolong ringkasno artikel iki dadi 3 poin utama.',
    ai: 'Oke, iki 3 poin utamane: (1) AI saya berkembang pesat, (2) Adopsi industri makin luas, (3) Regulasi global mulai disusun.',
  },
  {
    user: 'Translate ukara iki maring bahasa Inggris kang sopan.',
    ai: 'Siap. Here is the polished English version — clear, professional, and ready to send.',
  },
]

type ChatPhase = 'typing-user' | 'waiting-ai' | 'typing-ai' | 'done'

function MiniChat() {
  const [scriptIndex, setScriptIndex] = useState(0)
  const [phase, setPhase] = useState<ChatPhase>('typing-user')
  const [userText, setUserText] = useState('')
  const [aiText, setAiText] = useState('')

  const script = chatScripts[scriptIndex]

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>

    if (phase === 'typing-user') {
      setUserText('')
      setAiText('')
      let i = 0
      const typeUser = () => {
        if (i <= script.user.length) {
          setUserText(script.user.slice(0, i))
          i++
          timeout = setTimeout(typeUser, 38)
        } else {
          timeout = setTimeout(() => setPhase('waiting-ai'), 500)
        }
      }
      typeUser()
    } else if (phase === 'waiting-ai') {
      timeout = setTimeout(() => setPhase('typing-ai'), 900)
    } else if (phase === 'typing-ai') {
      let i = 0
      const typeAi = () => {
        if (i <= script.ai.length) {
          setAiText(script.ai.slice(0, i))
          i++
          timeout = setTimeout(typeAi, 28)
        } else {
          timeout = setTimeout(() => setPhase('done'), 1800)
        }
      }
      typeAi()
    } else if (phase === 'done') {
      timeout = setTimeout(() => {
        setScriptIndex((prev) => (prev + 1) % chatScripts.length)
        setPhase('typing-user')
      }, 500)
    }

    return () => clearTimeout(timeout)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, scriptIndex])

  return (
    <div className="ink-outline rotate-[-2.5deg] rounded-[2rem_1.1rem_2.4rem_1.4rem] bg-[#fff4dc] p-5 text-[#241711]">
      <div className="flex items-center justify-between border-b border-[#4a2d1c]/15 pb-3">
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Ngapak AI chat icon" style={{ height: 64, width: 'auto' }} />
          <div>
            <p className="text-sm font-semibold text-[#241711]">Ngapak AI</p>
            <p className="text-xs text-[#8a6b52]">Powered by Claude</p>
          </div>
        </div>
        <span className="rounded-full bg-[#445d3b]/10 px-2.5 py-1 text-xs font-medium text-[#445d3b]">Live</span>
      </div>
      <div className="mt-4 space-y-3 min-h-[110px]">
        {/* User bubble */}
        {userText.length > 0 && (
          <div className="max-w-[86%] rounded-[1.3rem_1.3rem_1.3rem_0.35rem] bg-[#ead6b5] px-4 py-3 text-sm leading-6 text-[#60412f]">
            {userText}
            {phase === 'typing-user' && (
              <span className="ml-0.5 inline-block h-3.5 w-0.5 animate-pulse bg-[#60412f] align-middle" />
            )}
          </div>
        )}

        {/* AI typing indicator */}
        {phase === 'waiting-ai' && (
          <div className="ml-auto flex max-w-[88%] items-center gap-1.5 rounded-[1.3rem_0.35rem_1.3rem_1.3rem] bg-[#b5502e] px-4 py-3">
            <span className="h-2 w-2 animate-bounce rounded-full bg-[#fff4dc]" style={{ animationDelay: '0ms' }} />
            <span className="h-2 w-2 animate-bounce rounded-full bg-[#fff4dc]" style={{ animationDelay: '150ms' }} />
            <span className="h-2 w-2 animate-bounce rounded-full bg-[#fff4dc]" style={{ animationDelay: '300ms' }} />
          </div>
        )}

        {/* AI response bubble */}
        {(phase === 'typing-ai' || phase === 'done') && aiText.length > 0 && (
          <div className="ml-auto max-w-[88%] rounded-[1.3rem_0.35rem_1.3rem_1.3rem] bg-[#b5502e] px-4 py-3 text-sm font-medium leading-6 text-[#fff4dc]">
            {aiText}
            {phase === 'typing-ai' && (
              <span className="ml-0.5 inline-block h-3.5 w-0.5 animate-pulse bg-[#fff4dc] align-middle" />
            )}
          </div>
        )}

        <div className="grid grid-cols-3 gap-2 pt-1 text-xs">
          {['Debug', 'Ringkas', 'Translate'].map((item) => (
            <span key={item} className="rounded-full border border-[#4a2d1c]/15 bg-[#f4e6ca] px-3 py-2 text-center text-[#60412f]">{item}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

function CheckoutPreview() {
  return (
    <div className="ink-outline relative rotate-[2deg] rounded-[0.8rem_2.4rem_1rem_2rem] bg-[#445d3b] p-5 text-[#fff4dc]">
      <div className="absolute -right-5 -top-4 rounded-full bg-[#9b6a2f] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-[#fff4dc] rotate-6">on-chain</div>
      <div className="relative flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-[#ddbe92]">Nota crypto</p>
          <h3 className="mt-2 text-xl font-bold text-[#241711]">Pro Plan</h3>
        </div>
        <CircleDollarSign className="text-[#ddbe92]" size={34} />
      </div>
      <div className="relative mt-6 rounded-[1.4rem_0.8rem_1.4rem_0.8rem] border border-[#fff4dc]/18 bg-[#241711]/28 p-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs text-[#ddbe92]">Total bulan ini</p>
            <p className="mt-1 font-display text-5xl font-bold text-[#241711]">$3.99</p>
          </div>
          <span className="rounded-full bg-[#fff4dc]/12 px-3 py-1 text-xs font-semibold text-[#fff4dc]">Verified RPC</span>
        </div>
        <div className="mt-5 grid grid-cols-4 gap-2">
          {['USDC', 'ETH', 'SOL', 'USDT'].map((token) => (
            <span key={token} className="rounded-xl border border-[#fff4dc]/15 bg-[#fff4dc]/8 px-2 py-2 text-center font-mono text-xs text-[#fff4dc]">{token}</span>
          ))}
        </div>
      </div>
      <div className="relative mt-5 space-y-3">
        {['Pilih jaringan', 'Connect wallet', 'Konfirmasi transaksi', 'Akses aktif'].map((item, index) => (
          <div key={item} className="flex items-center gap-3 text-sm">
            <span className={cn('grid h-7 w-7 place-items-center rounded-full text-xs font-bold', index === 3 ? 'bg-[#fff4dc] text-[#445d3b]' : 'bg-[#ddbe92]/18 text-[#fff4dc]')}>{index + 1}</span>
            <span className="text-[#f4e6ca]">{item}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function LivingLumbonBackground() {
  const [scrollDepth, setScrollDepth] = useState(0)

  useEffect(() => {
    let frame = 0
    const update = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1)
        setScrollDepth(Math.min(window.scrollY / maxScroll, 1))
      })
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', update)
    }
  }, [])

  return (
    <div
      className="living-lumbon pointer-events-none fixed inset-0 z-0 overflow-hidden"
      style={{ '--scroll-depth': scrollDepth } as CSSProperties}
      aria-hidden="true"
    >
      <div className="lumbon-3d lumbon-3d-a" />
      <div className="lumbon-3d lumbon-3d-b" />
      <div className="ai-ribbon ai-ribbon-a" />
      <div className="ai-ribbon ai-ribbon-b" />
      <div className="batik-node batik-node-a" />
      <div className="batik-node batik-node-b" />
    </div>
  )
}

export function LandingPage() {
  const { data: session } = useSession()
  const isLoggedIn = !!session?.user
  const [mobileMenu, setMobileMenu] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [scrolled, setScrolled] = useState(false)

  function handleSelectPlan(plan: Plan) {
    if (!isLoggedIn) {
      signIn('google', { callbackUrl: '/#pricing' })
      return
    }
    setSelectedPlan(plan)
  }

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 24)
    handler()
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <main className="paper-grain min-h-screen overflow-x-hidden bg-[#f4e6ca] text-[#241711] selection:bg-[#b5502e]/20">
      {selectedPlan && <CryptoCheckoutModal plan={selectedPlan} onClose={() => setSelectedPlan(null)} />}
      <LivingLumbonBackground />

      <header className={cn('fixed inset-x-0 top-0 z-40 transition duration-300', scrolled ? 'border-b border-[#4a2d1c]/15 bg-[#f4e6ca]/86 backdrop-blur-xl' : 'bg-transparent')}>
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center focus:outline-none focus:ring-2 focus:ring-[#b5502e]/40 rounded-xl" style={{ gap: 0 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Ngapak AI logo" style={{ height: 80, width: 'auto' }} />
            <span className="font-display text-xl font-bold tracking-wide uppercase" style={{ marginLeft: -36 }}>
              <span style={{ color: '#b5502e' }}>NGAPAK</span>
              <span style={{ color: '#241711' }}> AI</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-7 rounded-full border border-[#4a2d1c]/15 bg-[#fff4dc]/62 px-5 py-2 text-sm text-[#60412f] backdrop-blur-xl md:flex">
            {navItems.map(([label, href]) => (
              <a key={label} href={href} className="transition hover:text-[#b5502e] focus:outline-none focus:ring-2 focus:ring-[#b5502e]/35">{label}</a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <WalletButton />
            <Link href="/chat" className="hidden h-10 items-center gap-2 rounded-full bg-[#b5502e] px-4 text-sm font-bold text-[#fff4dc] shadow-[4px_4px_0_rgba(36,23,17,0.18)] transition hover:bg-[#8f3e24] focus:outline-none focus:ring-2 focus:ring-[#b5502e]/40 md:flex">
              Coba Gratis <ArrowRight size={15} />
            </Link>
            <button onClick={() => setMobileMenu(!mobileMenu)} className="grid h-10 w-10 place-items-center rounded-full border border-[#4a2d1c]/15 text-[#60412f] md:hidden" aria-label="Toggle navigation">
              {mobileMenu ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {mobileMenu && (
          <div className="border-t border-[#4a2d1c]/15 bg-[#f4e6ca] px-4 py-4 md:hidden">
            <div className="space-y-1">
              {navItems.map(([label, href]) => (
                <a key={label} href={href} onClick={() => setMobileMenu(false)} className="block rounded-xl px-3 py-3 text-sm text-[#60412f] hover:bg-[#fff4dc]/60">{label}</a>
              ))}
              <Link href="/chat" className="mt-3 flex justify-center rounded-full bg-[#b5502e] px-4 py-3 text-sm font-bold text-[#fff4dc]">Coba Gratis</Link>
            </div>
          </div>
        )}
      </header>

      <section className="relative z-10 px-4 pb-20 pt-24 sm:px-6 lg:pb-24 lg:pt-28">
        {/* animated batik rows — behind all content */}
        <BatikMarqueeBackground />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_72%_18%,rgba(181,80,46,0.18),transparent_26%),radial-gradient(circle_at_18%_70%,rgba(68,93,59,0.14),transparent_28%),linear-gradient(135deg,rgba(244,230,202,0.45)_0%,rgba(234,214,181,0.38)_52%,rgba(255,244,220,0.42)_100%)]" />
        <div className="paper-grain pointer-events-none absolute inset-0 -z-10 opacity-40" />

        <div className="mx-auto grid max-w-7xl items-center gap-4 lg:min-h-[790px]">
          <div className="relative z-10">
            <div className="hero-pop mb-5 inline-flex rotate-[-1.5deg] items-center gap-2 border-y border-[#4a2d1c]/20 bg-[#fff4dc]/55 px-3 py-1.5 font-mono text-xs font-semibold uppercase tracking-[0.18em] text-[#60412f]">
              Powered by Claude / Bayar Crypto Native
            </div>
            <div className="hero-pop absolute right-0 top-[210px] z-20 hidden w-[min(44vw,500px)] flex-col items-start gap-2 lg:flex [animation-delay:180ms]">
              <Link href="/chat" className="cta-primary inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-[999px_999px_999px_16px] bg-[#b5502e] px-4 text-sm font-black text-[#fff4dc] shadow-[5px_5px_0_rgba(36,23,17,0.16)] transition hover:-translate-y-1 hover:bg-[#8f3e24] focus:outline-none focus:ring-2 focus:ring-[#b5502e]/45">
                Coba Gratis Sekarang <ArrowRight size={16} />
              </Link>
              <p className="max-w-md rounded-[1.4rem_0.7rem_1.4rem_1.4rem] bg-[#fff4dc]/62 px-4 py-3 text-sm leading-6 text-[#60412f] shadow-[5px_5px_0_rgba(36,23,17,0.08)] backdrop-blur-sm">
                Ngapak AI bantu coding, belajar, nulis, dan analisis file dengan rasa lokal yang hangat. Mulai gratis, upgrade pakai crypto EVM atau Solana tanpa kartu kredit.
              </p>
            </div>
            <AnimatedHeadline />
            <div className="hero-pop mt-7 flex max-w-xl flex-col gap-3 sm:flex-row lg:hidden [animation-delay:560ms]">
              <Link href="/chat" className="cta-primary inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-[999px_999px_999px_18px] bg-[#b5502e] px-5 text-sm font-black text-[#fff4dc] shadow-[5px_5px_0_rgba(36,23,17,0.16)] transition hover:-translate-y-1 hover:bg-[#8f3e24] focus:outline-none focus:ring-2 focus:ring-[#b5502e]/45">
                Coba Gratis Sekarang <ArrowRight size={16} />
              </Link>
              <p className="text-sm leading-6 text-[#60412f]">
                Ngapak AI bantu coding, belajar, nulis, dan analisis file dengan rasa lokal yang hangat. Mulai gratis, upgrade pakai crypto EVM atau Solana tanpa kartu kredit.
              </p>
            </div>
          </div>

          <div className="hero-visual relative min-h-[520px]">
            <div className="absolute left-0 top-12 hidden h-28 w-28 rounded-[40%_60%_55%_45%] border border-[#4a2d1c]/20 bg-[#445d3b]/10 lg:block" />
            <div className="absolute right-5 top-8 hidden h-32 w-32 rotate-12 rounded-[58%_42%_45%_55%] border border-[#b5502e]/20 bg-[#b5502e]/10 lg:block" />
            <div className="relative mx-auto max-w-5xl">
              <div className="absolute left-0 top-16 w-full max-w-md lg:left-16">
                <MiniChat />
              </div>
              <div className="absolute right-0 top-2 w-full max-w-md lg:right-20">
                <CheckoutPreview />
              </div>
            </div>
          </div>

          {/* Crypto checkout flow demo — di bawah kedua card */}
          <CryptoFlowDemo />
        </div>
      </section>

      <div className="relative z-10 -mt-2 bg-[#f4e6ca]">
        <PoweredMarquee />
      </div>

      <AnimatedSection className="relative z-10 bg-[#f4e6ca] px-4 pb-10 sm:px-6">
        <StaggerGroup className="mx-auto grid max-w-7xl gap-4 text-sm text-[#60412f] md:grid-cols-4">
          {[
            [ShieldCheck, 'Private key tidak disimpan'],
            [Timer, 'Checkout ringkas dan bertahap'],
            [BadgeCheck, 'Verifikasi lewat RPC backend'],
            [CreditCard, 'Tanpa kartu kredit dan KYC'],
          ].map(([Icon, label]) => (
            <StaggerItem key={label as string}>
                <div className="flex min-h-14 items-center justify-center gap-3 rounded-2xl border border-[#4a2d1c]/15 bg-[#fff4dc]/65 px-4 py-3 backdrop-blur-xl transition duration-200 hover:-translate-y-1 hover:border-[#b5502e]/30">
                <Icon size={18} className="text-[#b5502e]" />
                <span>{label as string}</span>
              </div>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </AnimatedSection>

      {/* ── divider hero → features ── */}
      <SectionDivider from="#f4e6ca" to="#fff8ee" variant={0} />

      <section id="features" className="relative z-10 bg-[#fff8ee] px-4 py-20 sm:px-6">
        <SectionBlobs color="#b5502e" color2="#445d3b" count={2} />
        <div className="relative mx-auto max-w-7xl">
          <AnimatedSection className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr] lg:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#b5502e]">Fitur unggulan</p>
              <h2 className="mt-4 font-display text-4xl font-bold tracking-normal text-[#241711] sm:text-5xl">Bukan cuma landing. Ini produk AI yang enak dipakai.</h2>
            </div>

          </AnimatedSection>
          <StaggerGroup className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featureCards.map(({ icon: Icon, title, desc }, index) => (
              <StaggerItem key={title} className={cn(index === 0 && 'lg:col-span-2')}>
                <div className="group h-full rounded-3xl border border-[#4a2d1c]/15 bg-[#fff4dc]/65 p-5 backdrop-blur-xl transition duration-200 ease-out hover:-translate-y-1.5 hover:border-[#b5502e]/35 hover:bg-[#fff4dc]/90 hover:shadow-2xl hover:shadow-[#9b6a2f]/15">
                  <div className="grid h-11 w-11 place-items-center rounded-2xl border border-[#4a2d1c]/15 bg-[#ead6b5]/70 transition duration-200 group-hover:rotate-3 group-hover:border-[#b5502e]/30">
                    <Icon size={21} className={index === 0 ? 'text-[#b5502e]' : 'text-[#445d3b]'} />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold text-[#241711]">{title}</h3>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-[#60412f]">{desc}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </div>
      </section>

      {/* ── divider features → pricing ── */}
      <SectionDivider from="#fff8ee" to="#eaddc0" variant={1} />

      <section id="pricing" className="relative z-10 bg-[#eaddc0] px-4 py-20 sm:px-6">
        <SectionBlobs color="#445d3b" color2="#b5502e" count={2} />

        {/* ── Chain marquee FULL WIDTH — di atas grid ── */}
        {/* ── Chain marquee FULL WIDTH ── */}
        <div className="relative mb-12">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.22em] text-[#8a6b52] mb-4">Jaringan yang didukung</p>
          <div className="overflow-hidden w-full"
            style={{
              maskImage: 'linear-gradient(to right, transparent, black 6%, black 94%, transparent)',
              WebkitMaskImage: 'linear-gradient(to right, transparent, black 6%, black 94%, transparent)',
            }}
          >
            {/* track — display flex, width max-content, animasi chainMarquee via CSS */}
            <div className="chain-marquee-track">
              {[
                { name: 'Ethereum',  logo: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png' },
                { name: 'Base',      logo: 'https://assets.coingecko.com/coins/images/30494/large/base_icon_transparent_background.png' },
                { name: 'Arbitrum',  logo: 'https://assets.coingecko.com/coins/images/16547/large/photo_2023-03-29_21.47.00.jpeg' },
                { name: 'Polygon',   logo: 'https://assets.coingecko.com/coins/images/4713/large/polygon.png' },
                { name: 'BNB Chain', logo: 'https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png' },
                { name: 'Optimism',  logo: 'https://assets.coingecko.com/coins/images/25244/large/Optimism.png' },
                { name: 'Avalanche', logo: 'https://assets.coingecko.com/coins/images/12559/large/Avalanche_Circle_RedWhite_Trans.png' },
                { name: 'Solana',    logo: 'https://assets.coingecko.com/coins/images/4128/large/solana.png' },
                /* set kedua — identik, wajib untuk translateX(-50%) loop seamless */
                { name: 'Ethereum',  logo: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png' },
                { name: 'Base',      logo: 'https://assets.coingecko.com/coins/images/30494/large/base_icon_transparent_background.png' },
                { name: 'Arbitrum',  logo: 'https://assets.coingecko.com/coins/images/16547/large/photo_2023-03-29_21.47.00.jpeg' },
                { name: 'Polygon',   logo: 'https://assets.coingecko.com/coins/images/4713/large/polygon.png' },
                { name: 'BNB Chain', logo: 'https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png' },
                { name: 'Optimism',  logo: 'https://assets.coingecko.com/coins/images/25244/large/Optimism.png' },
                { name: 'Avalanche', logo: 'https://assets.coingecko.com/coins/images/12559/large/Avalanche_Circle_RedWhite_Trans.png' },
                { name: 'Solana',    logo: 'https://assets.coingecko.com/coins/images/4128/large/solana.png' },
              ].map((c, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3 rounded-2xl border border-[#4a2d1c]/15 bg-[#fff4dc]/80 flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.logo} alt={c.name} style={{ height: 48, width: 48, objectFit: 'contain', borderRadius: 8 }} />
                  <span className="text-base font-semibold text-[#241711] whitespace-nowrap">{c.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* ── end chain marquee ── */}

        <div className="relative mx-auto max-w-7xl">
          <AnimatedSection className="grid gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#445d3b]">Pricing & crypto checkout</p>

              {/* ── Chain support marquee — sudah dipindah ke full-width di atas ── */}

              <h2 className="mt-0 font-display text-4xl font-bold text-[#241711] sm:text-5xl">Pilih paket, bayar pakai crypto.</h2>
              <p className="mt-5 text-lg leading-8 text-[#60412f]">Tanpa kartu kredit. Tanpa ribet KYC. Cukup connect wallet, pilih token, konfirmasi, lalu akses aktif setelah transaksi terverifikasi.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {trustItems.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="rounded-2xl border border-[#4a2d1c]/15 bg-[#fff4dc]/65 p-4 backdrop-blur-xl">
                  <Icon size={19} className="text-[#445d3b]" />
                  <p className="mt-3 text-sm font-semibold text-[#241711]">{title}</p>
                  <p className="mt-2 text-xs leading-6 text-[#8a6b52]">{desc}</p>
                </div>
              ))}
            </div>
          </AnimatedSection>

          <StaggerGroup className="mt-12 grid gap-4 lg:grid-cols-3">
            <StaggerItem>
            <div className="h-full rounded-3xl border border-[#4a2d1c]/15 bg-[#fff4dc]/65 p-6 backdrop-blur-xl transition duration-200 hover:-translate-y-1 hover:border-[#b5502e]/25">
              <Zap size={22} className="text-[#60412f]" />
              <h3 className="mt-5 text-xl font-semibold">Starter</h3>
              <p className="mt-2 text-sm text-[#8a6b52]">Gratis selamanya</p>
              <p className="mt-6 font-display text-4xl font-bold">Gratis</p>
              <ul className="mt-6 space-y-3 text-sm text-[#60412f]">
                {['5 chat per hari', 'Model AI gratis', 'Bahasa daerah', 'Tanpa wallet'].map((item) => (
                  <li key={item} className="flex gap-3"><Check size={16} className="mt-0.5 shrink-0 text-[#445d3b]" />{item}</li>
                ))}
              </ul>
              <Link href="/chat" className="mt-8 flex h-11 items-center justify-center rounded-full border border-[#4a2d1c]/15 text-sm font-semibold text-[#60412f] transition hover:bg-[#ead6b5]/55">Mulai Gratis</Link>
            </div>
            </StaggerItem>

            <StaggerItem>
            <div className="relative h-full rounded-3xl border border-[#b5502e]/35 bg-gradient-to-b from-[#fff4dc] to-[#ead6b5] p-6 shadow-2xl shadow-[#9b6a2f]/18 backdrop-blur-xl transition duration-200 hover:-translate-y-1 hover:border-[#b5502e]/50">
              <div className="absolute -top-3 left-6 rounded-full bg-[#b5502e] px-3 py-1 text-xs font-bold text-[#fff4dc]">Populer</div>
              <Banknote size={22} className="text-[#b5502e]" />
              <h3 className="mt-5 text-xl font-semibold">Pro</h3>
              <p className="mt-2 text-sm text-[#8a6b52]">Untuk pengguna aktif harian</p>
              <p className="mt-6 font-display text-4xl font-bold">$3.99<span className="text-base font-medium text-[#60412f]">/bulan</span></p>
              <ul className="mt-6 space-y-3 text-sm text-[#60412f]">
                {['50 chat per hari', 'Claude dan model premium', 'Vision AI', 'Upload file kode', 'Priority response'].map((item) => (
                  <li key={item} className="flex gap-3"><Check size={16} className="mt-0.5 shrink-0 text-[#b5502e]" />{item}</li>
                ))}
              </ul>
              <button onClick={() => handleSelectPlan(PLANS.find((item) => item.id === 'mini') ?? PLANS[1]!)} className="mt-8 flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[#b5502e] text-sm font-bold text-[#fff4dc] transition hover:bg-[#8f3e24] focus:outline-none focus:ring-2 focus:ring-[#b5502e]/45">
                Bayar dengan Crypto <Wallet size={16} />
              </button>
              <p className="mt-3 text-xs leading-5 text-[#8a6b52]">Pembayaran diproses langsung on-chain. Pastikan jaringan benar sebelum konfirmasi.</p>
            </div>
            </StaggerItem>

            <StaggerItem>
            <div className="h-full rounded-3xl border border-[#445d3b]/25 bg-[#445d3b]/10 p-6 backdrop-blur-xl transition duration-200 hover:-translate-y-1 hover:border-[#445d3b]/45">
              <Globe2 size={22} className="text-[#445d3b]" />
              <div className="mt-5 flex items-center justify-between gap-3">
                <h3 className="text-xl font-semibold">Business</h3>
                <span className="rounded-full border border-[#445d3b]/30 px-2.5 py-1 text-xs font-bold text-[#445d3b]">Best Value</span>
              </div>
              <p className="mt-2 text-sm text-[#60412f]">Untuk profesional dan tim kecil</p>
              <p className="mt-6 font-display text-4xl font-bold">$7.99<span className="text-base font-medium text-[#60412f]">/bulan</span></p>
              <ul className="mt-6 space-y-3 text-sm text-[#60412f]">
                {['200 chat per hari', 'Semua model premium', 'Semua jenis file', 'Akses fitur beta', 'Diskon tahunan 20%'].map((item) => (
                  <li key={item} className="flex gap-3"><Check size={16} className="mt-0.5 shrink-0 text-[#445d3b]" />{item}</li>
                ))}
              </ul>
              <button onClick={() => handleSelectPlan(PLANS.find((item) => item.id === 'pro') ?? PLANS[2]!)} className="mt-8 flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[#445d3b] text-sm font-bold text-[#fff4dc] transition hover:bg-[#34472d] focus:outline-none focus:ring-2 focus:ring-[#445d3b]/45">
                Bayar dengan Crypto <Wallet size={16} />
              </button>
              <p className="mt-3 text-xs leading-5 text-[#60412f]">Harga dikonversi real-time ke token yang dipilih saat checkout.</p>
            </div>
            </StaggerItem>
          </StaggerGroup>
        </div>
      </section>

      {/* ── divider pricing → how it works ── */}
      <SectionDivider from="#eaddc0" to="#f0e8d4" variant={2} />

      <section className="relative z-10 bg-[#f0e8d4] px-4 py-20 sm:px-6">
        <SectionBlobs color="#9b6a2f" color2="#b5502e" count={2} />
        <div className="relative mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <AnimatedSection>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#b5502e]">Cara kerja</p>
            <h2 className="mt-4 font-display text-4xl font-bold text-[#241711] sm:text-5xl">Tulis pertanyaan, pilih gaya, lanjut kerja.</h2>

            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {['Guest bisa mulai cepat', 'Login unlock histori', 'Upload file didukung', 'Crypto upgrade tersedia'].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-2xl border border-[#4a2d1c]/15 bg-[#fff4dc]/65 px-4 py-3 text-sm text-[#60412f]">
                  <Check size={16} className="text-[#445d3b]" />
                  {item}
                </div>
              ))}
            </div>
          </AnimatedSection>
          <AnimatedSection delay={0.12}>
            <div className="relative">
              <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-[#b5502e]/15 via-transparent to-[#445d3b]/15 blur-2xl" />
              {/* minHeight cukup untuk menampung MiniChat paling tinggi — mencegah layout shift pada parent grid */}
              <div className="relative" style={{ minHeight: 320, contain: 'layout' }}>
                <MiniChat />
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ── divider how it works → comparison ── */}
      <SectionDivider from="#f0e8d4" to="#fdf7ec" variant={3} />

      <section id="comparison" className="relative z-10 bg-[#fdf7ec] px-4 py-20 sm:px-6">
        <SectionBlobs color="#445d3b" color2="#9b6a2f" count={1} />
        <div className="relative mx-auto max-w-5xl">
          <AnimatedSection className="text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#b5502e]">Perbandingan</p>
            <h2 className="mt-4 font-display text-4xl font-bold text-[#241711]">Kenapa bukan AI lain?</h2>
          </AnimatedSection>
          <AnimatedSection className="mt-10 overflow-hidden rounded-3xl border border-[#4a2d1c]/15 bg-[#fff4dc]/50 backdrop-blur-xl">
            <table className="w-full min-w-[680px] text-sm">
              <thead className="bg-[#fff4dc]/65 text-left text-[#60412f]">
                <tr>
                  <th className="px-5 py-4 font-medium">Fitur</th>
                  <th className="px-5 py-4 text-center font-semibold text-[#b5502e]">Ngapak AI</th>
                  <th className="px-5 py-4 text-center font-medium">ChatGPT</th>
                  <th className="px-5 py-4 text-center font-medium">Gemini</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map(([label, ngapak, chatgpt, gemini]) => (
                  <tr key={label} className="border-t border-[#4a2d1c]/15">
                    <td className="px-5 py-4 text-[#60412f]">{label}</td>
                    {[ngapak, chatgpt, gemini].map((value, index) => (
                      <td key={index} className="px-5 py-4 text-center">{value ? <Check className="mx-auto text-[#445d3b]" size={18} /> : <X className="mx-auto text-[#8a6b52]" size={18} />}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </AnimatedSection>
        </div>
      </section>

      {/* ── divider comparison → faq ── */}
      <SectionDivider from="#fdf7ec" to="#f4e6ca" variant={0} />

      <section id="faq" className="relative z-10 bg-[#f4e6ca] px-4 py-20 sm:px-6">
        <SectionBlobs color="#b5502e" color2="#445d3b" count={1} />
        <AnimatedSection className="relative mx-auto grid max-w-7xl gap-12 rounded-[2rem] border border-[#4a2d1c]/15 bg-[#fff4dc]/65 p-6 backdrop-blur-xl lg:grid-cols-[0.85fr_1.15fr] lg:p-10">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#445d3b]">FAQ</p>
            <h2 className="mt-4 font-display text-4xl font-bold text-[#241711]">Jawaban singkat sebelum upgrade.</h2>
          </div>
          <div>
            {faqs.map(([question, answer]) => (
              <FAQItem key={question} question={question} answer={answer} />
            ))}
          </div>
        </AnimatedSection>
      </section>

      {/* ── divider faq → cta ── */}
      <SectionDivider from="#f4e6ca" to="#ead6b5" variant={2} />

      <section className="relative z-10 bg-[#ead6b5] px-4 py-20 sm:px-6">
        <SectionBlobs color="#9b6a2f" color2="#b5502e" count={2} />
        <AnimatedSection className="relative mx-auto max-w-4xl rounded-[2rem] border border-[#4a2d1c]/15 bg-gradient-to-br from-[#fff4dc] via-[#ead6b5] to-[#f4e6ca] p-8 text-center shadow-2xl shadow-[#9b6a2f]/15 backdrop-blur-xl sm:p-12">
          <h2 className="font-display text-4xl font-bold text-[#241711] sm:text-5xl">Mulai gratis, upgrade saat butuh tenaga ekstra.</h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-[#60412f]">Ngapak AI dibuat supaya terasa lokal, cepat dipahami, dan tetap siap untuk pengguna Web3 yang ingin bayar tanpa kartu kredit.</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/chat" className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#b5502e] px-6 font-bold text-[#fff4dc] transition hover:bg-[#8f3e24]">Coba Gratis Sekarang <ArrowRight size={17} /></Link>
            <a href="#pricing" className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-[#4a2d1c]/15 px-6 font-semibold text-[#241711] transition hover:bg-[#fff4dc]/60">Pilih Paket Crypto <Wallet size={17} /></a>
          </div>
        </AnimatedSection>
      </section>

      <footer className="relative z-10 border-t border-[#4a2d1c]/10 bg-[#d9c9a8] px-4 py-10 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center" style={{ gap: 0 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Ngapak AI logo" style={{ height: 72, width: 'auto' }} />
            <div style={{ marginLeft: -36 }}>
              <p className="font-bold text-base uppercase"><span style={{ color: '#b5502e' }}>NGAPAK</span><span style={{ color: '#241711' }}> AI</span></p>
              <p className="text-xs text-[#8a6b52]">Asisten AI Indonesia dengan crypto checkout.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-[#8a6b52]">
            <a href="#pricing" className="hover:text-[#60412f]">Docs Pembayaran Crypto</a>
            <a href="#faq" className="hover:text-[#60412f]">FAQ</a>
            <Link href="/chat" className="hover:text-[#60412f]">Chat App</Link>
          </div>
        </div>
      </footer>
    </main>
  )
}
