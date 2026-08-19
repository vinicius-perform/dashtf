/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: '#0B0B0D',
          sidebar: '#0E0E10',
          card: '#151518',
          cardHover: '#1B1B1F',
          border: '#232328',
          borderLight: '#2F2F36',
          neon: '#CCFF00',
          neonHover: '#B6E600',
          neonMuted: 'rgba(204, 255, 0, 0.15)',
          textMuted: '#8E8E93',
          textSub: '#A1A1AA',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
