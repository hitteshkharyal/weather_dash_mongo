/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Outfit', 'Inter', 'sans-serif'],
      },
      colors: {
        brand: {
          50:  '#eef7ff',
          100: '#d9edff',
          200: '#bce0ff',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
        surface: {
          50:  '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
      },
      boxShadow: {
        'glass': '0 8px 32px rgba(0, 0, 0, 0.12)',
        'glass-lg': '0 16px 48px rgba(0, 0, 0, 0.2)',
        'glow-blue': '0 0 20px rgba(56, 189, 248, 0.3)',
        'glow-green': '0 0 20px rgba(34, 197, 94, 0.3)',
        'glow-amber': '0 0 20px rgba(245, 158, 11, 0.3)',
        'glow-red': '0 0 20px rgba(239, 68, 68, 0.3)',
      },
      backdropBlur: {
        'xs': '2px',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-up': 'slideUp 0.5s ease-out',
        'fade-in': 'fadeIn 0.6s ease-out',
        'rain': 'rain 1s linear infinite',
        'lightning': 'lightning 4s ease-in-out infinite',
        'fog-drift': 'fogDrift 8s ease-in-out infinite',
        'sun-rays': 'sunRays 3s ease-in-out infinite',
        'hail': 'hail 0.5s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        rain: {
          '0%': { transform: 'translateY(-100vh) translateX(0)', opacity: '0.7' },
          '100%': { transform: 'translateY(100vh) translateX(-20px)', opacity: '0' },
        },
        lightning: {
          '0%, 90%, 100%': { opacity: '0' },
          '92%': { opacity: '1' },
          '94%': { opacity: '0' },
          '96%': { opacity: '0.8' },
        },
        fogDrift: {
          '0%, 100%': { transform: 'translateX(-5%) scale(1)', opacity: '0.3' },
          '50%': { transform: 'translateX(5%) scale(1.1)', opacity: '0.5' },
        },
        sunRays: {
          '0%, 100%': { opacity: '0.6', transform: 'scale(1) rotate(0deg)' },
          '50%': { opacity: '1', transform: 'scale(1.1) rotate(5deg)' },
        },
        hail: {
          '0%': { transform: 'translateY(-5vh) translateX(0)', opacity: '1' },
          '100%': { transform: 'translateY(100vh) translateX(10px)', opacity: '0' },
        }
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
