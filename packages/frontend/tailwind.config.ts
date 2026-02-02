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
        // OpenClaw-inspired dark theme
        dark: {
          950: '#030712',
          900: '#050810',
          800: '#0a0f1a',
          700: '#111827',
          600: '#1a2332',
          500: '#2a3444',
        },
        // Text colors (blue-tinted, not pure white)
        text: {
          primary: '#f0f4ff',
          secondary: '#8892b0',
          muted: '#5a6480',
        },
        // Accent colors - coral is primary
        accent: {
          coral: '#ff4d4d',
          'coral-hover': '#e63946',
          'coral-muted': '#991b1b',
          cyan: '#00e5cc',
          'cyan-hover': '#14b8a6',
        },
        // Gradient colors for claims
        gradient: {
          false: '#ef4444',
          uncertain: '#eab308',
          true: '#22c55e',
        },
      },
      borderColor: {
        subtle: 'rgba(136, 146, 176, 0.15)',
        'subtle-hover': 'rgba(136, 146, 176, 0.25)',
        'accent-coral': 'rgba(255, 77, 77, 0.3)',
        'accent-cyan': 'rgba(0, 229, 204, 0.3)',
      },
      boxShadow: {
        'glow-coral': '0 0 30px rgba(255, 77, 77, 0.15)',
        'glow-cyan': '0 0 30px rgba(0, 229, 204, 0.15)',
        'glow-coral-strong': '0 0 40px rgba(255, 77, 77, 0.25)',
        'glow-cyan-strong': '0 0 40px rgba(0, 229, 204, 0.25)',
      },
      fontSize: {
        'stat': ['2rem', { lineHeight: '1', fontWeight: '700' }],
        'display': ['3.5rem', { lineHeight: '1.1', fontWeight: '700' }],
        'display-sm': ['2.5rem', { lineHeight: '1.2', fontWeight: '700' }],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'grid-pattern': 'linear-gradient(rgba(136, 146, 176, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(136, 146, 176, 0.03) 1px, transparent 1px)',
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
