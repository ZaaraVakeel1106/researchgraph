/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        academic: {
          50: '#f8faf9',
          100: '#edf2f0',
          200: '#d7e2de',
          300: '#b4c9c1',
          400: '#8caaa0',
          500: '#678c81',
          600: '#4e7066',
          700: '#3f5a52',
          800: '#344943',
          900: '#0f766e', // Primary Academic Teal
          950: '#142724',
        },
        paper: '#0f766e',
        author: '#d97706',
        institution: '#4338ca',
        topic: '#e11d48'
      },
      fontFamily: {
        sans: ['Inter', 'Geist', 'Manrope', 'sans-serif'],
        serif: ['Newsreader', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'monospace']
      }
    },
  },
  plugins: [],
}
