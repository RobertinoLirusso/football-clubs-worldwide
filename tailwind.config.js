/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  corePlugins: {
    preflight: false
  },
  theme: {
    extend: {
      colors: {
        silver: {
          50: '#f3f4f6',
          100: '#e9ebef',
          200: '#dfe2e8',
          300: '#cfd3d8',
          400: '#bfc3ca',
          500: '#9a9ea5',
          600: '#6b7078'
        },
        pitch: {
          DEFAULT: '#07080b',
          900: '#0d1015',
          800: '#1a1d23',
          700: '#2a2d31'
        },
        football: {
          green: '#27ae60'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Montserrat', 'system-ui', 'sans-serif']
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' }
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.97)' },
          to: { opacity: '1', transform: 'scale(1)' }
        }
      },
      animation: {
        'fade-in': 'fade-in 180ms ease-out both',
        'scale-in': 'scale-in 180ms ease-out both'
      },
      boxShadow: {
        'silver-sm': '0 1px 3px rgba(17, 24, 39, 0.08), 0 1px 2px rgba(17, 24, 39, 0.05)',
        'silver-md': '0 8px 24px rgba(17, 24, 39, 0.12)'
      }
    }
  },
  plugins: []
};
