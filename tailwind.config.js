/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        dark: {
          900: '#0b0b14',
          800: '#0f0f1a',
          700: '#14141f',
          600: '#1a1a2e',
          500: '#1e1e35',
          400: '#24243e',
          300: '#2e2e50',
          200: '#3d3d6b',
          100: '#5a5a8a',
        },
        accent: {
          DEFAULT: '#dc2626',
          hover: '#b91c1c',
          muted: '#7f1d1d',
          light: '#fca5a5',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'dark-sm': '0 1px 3px rgba(0,0,0,0.5)',
        'dark-md': '0 4px 12px rgba(0,0,0,0.4)',
        'dark-lg': '0 8px 24px rgba(0,0,0,0.5)',
        'glow-red': '0 0 20px rgba(220,38,38,0.3)',
      },
    },
  },
  plugins: [],
};
