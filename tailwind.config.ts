import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        sans:    ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        display: ['Lora', 'Georgia', 'Times New Roman', 'serif'],
        mono:    ['JetBrains Mono', 'Fira Code', 'Cascadia Code', 'monospace'],
      },
      colors: {
        dark: {
          primary:   '#0e0d0b',
          secondary: '#141310',
          sidebar:   '#0a0908',
          tertiary:  '#1c1a16',
          card:      '#181613',
          border:    '#2e2b24',
          subtle:    '#221f1a',
        },
        // warm terracotta accent (replaces old purple)
        accent: {
          DEFAULT: '#d97757',
          hover:   '#c4663e',
          muted:   'rgba(217,119,87,0.15)',
          subtle:  'rgba(217,119,87,0.08)',
        },
        text: {
          primary:   '#f2ede4',
          secondary: '#a09880',
          muted:     '#625d4e',
        },
      },
      animation: {
        'fade-in':    'fadeIn 0.2s ease-out',
        'slide-up':   'slideUp 0.25s ease-out',
        'slide-in':   'slideIn 0.25s ease-out',
        'pulse-dot':  'pulseDot 1.4s infinite ease-in-out',
        'shimmer':    'shimmer 2s infinite',
        'glow-pulse': 'glowPulse 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:    { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp:   { from: { transform: 'translateY(8px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
        slideIn:   { from: { transform: 'translateX(-8px)', opacity: '0' }, to: { transform: 'translateX(0)', opacity: '1' } },
        pulseDot:  { '0%,80%,100%': { transform: 'scale(0.6)', opacity: '0.4' }, '40%': { transform: 'scale(1)', opacity: '1' } },
        shimmer:   { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        glowPulse: { '0%,100%': { opacity: '0.6' }, '50%': { opacity: '1' } },
      },
      boxShadow: {
        'glow-sm':    '0 0 12px rgba(217,119,87,0.18)',
        'glow-md':    '0 0 24px rgba(217,119,87,0.22)',
        'card':       '0 4px 24px rgba(0,0,0,0.5)',
        'card-hover': '0 8px 32px rgba(0,0,0,0.6)',
      },
    },
  },
  plugins: [],
}

export default config
