/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          base: '#06080f',
          surface: 'rgba(255,255,255,0.04)',
          elevated: 'rgba(255,255,255,0.07)',
        },
        accent: {
          teal:    '#10d9a0',
          tealDim: '#0ea27a',
          indigo:  '#6366f1',
          indigoDim:'#4f46e5',
        },
        risk: {
          critical: '#f43f5e',
          high:     '#fb923c',
          moderate: '#f59e0b',
          low:      '#10d9a0',
        },
        border: 'rgba(255,255,255,0.08)',
        'border-bright': 'rgba(255,255,255,0.16)',
        text: {
          primary: '#f0f4ff',
          muted:   '#64748b',
          dim:     '#334155',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-glow': 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(16,217,160,0.15), transparent)',
        'card-gradient': 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
      },
      boxShadow: {
        'glow-teal':   '0 0 20px rgba(16,217,160,0.25)',
        'glow-indigo': '0 0 20px rgba(99,102,241,0.25)',
        'card':        '0 1px 1px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)',
        'card-hover':  '0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
      },
      animation: {
        'fade-up':      'fadeUp 0.5s ease forwards',
        'fade-in':      'fadeIn 0.4s ease forwards',
        'pulse-glow':   'pulseGlow 3s ease-in-out infinite',
        'shimmer':      'shimmer 1.5s linear infinite',
        'spin-slow':    'spin 8s linear infinite',
      },
      keyframes: {
        fadeUp: {
          '0%':   { opacity: 0, transform: 'translateY(16px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%':   { opacity: 0 },
          '100%': { opacity: 1 },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 12px rgba(16,217,160,0.2)' },
          '50%':      { boxShadow: '0 0 28px rgba(16,217,160,0.5)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      borderRadius: {
        xl2: '1rem',
        xl3: '1.5rem',
      },
    },
  },
  plugins: [],
}
