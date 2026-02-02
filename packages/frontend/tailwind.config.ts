import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Dark theme colors inspired by OpenClaw
        dark: {
          950: '#030712',
          900: '#050810',
          800: '#0a0f1a',
          700: '#111827',
          600: '#1f2937',
          500: '#374151',
        },
        // Accent colors
        accent: {
          cyan: '#00e5cc',
          coral: '#ff6b6b',
          purple: '#a855f7',
          blue: '#3b82f6',
        },
        // Gradient colors for claims
        gradient: {
          false: '#ef4444',
          uncertain: '#eab308',
          true: '#22c55e',
        },
      },
      boxShadow: {
        'glow-cyan': '0 0 30px rgba(0, 229, 204, 0.15)',
        'glow-coral': '0 0 30px rgba(255, 107, 107, 0.15)',
        'glow-purple': '0 0 30px rgba(168, 85, 247, 0.15)',
        'glow-blue': '0 0 30px rgba(59, 130, 246, 0.15)',
        'glow-green': '0 0 20px rgba(34, 197, 94, 0.15)',
        'glow-red': '0 0 20px rgba(239, 68, 68, 0.15)',
        'glow-yellow': '0 0 20px rgba(234, 179, 8, 0.15)',
      },
      fontSize: {
        'stat': ['2rem', { lineHeight: '1', fontWeight: '700' }],
        'display': ['3.5rem', { lineHeight: '1.1', fontWeight: '700' }],
        'display-sm': ['2.5rem', { lineHeight: '1.2', fontWeight: '700' }],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'grid-pattern': 'linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)',
      },
      backgroundSize: {
        'grid': '60px 60px',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'fade-in-up': 'fadeInUp 0.5s ease-out',
        'vote-pulse': 'votePulse 0.3s ease-out',
        'number-pop': 'numberPop 0.2s ease-out',
        'shimmer': 'shimmer 1.5s infinite',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        votePulse: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.15)' },
          '100%': { transform: 'scale(1)' },
        },
        numberPop: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.1)' },
          '100%': { transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        glowPulse: {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
