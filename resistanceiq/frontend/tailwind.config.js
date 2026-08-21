/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        base: '#05070B',
        surface: '#0B1017',
        elevated: '#111820',
        teal: {
          DEFAULT: '#0BDFA0',
          hover: '#1BFAB8',
        },
        violet: {
          DEFAULT: '#8B8CF8',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
