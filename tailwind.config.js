/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['"Space Grotesk"', 'sans-serif'],
        'dot': ['"DotGothic16"', 'sans-serif'],
        'serif': ['"New York"', 'ui-serif', 'Georgia', 'serif'],
      },
      colors: {
        'brand': {
          DEFAULT: '#E50914', // Nothing Red
          dark: '#B80000',
        },
        'nothing': {
          bg: '#F5F5F5',
          bgDark: '#0A0A0A',
          card: '#FFFFFF',
          cardDark: '#121212',
          text: '#000000',
          textDark: '#FFFFFF',
          border: '#E0E0E0',
          borderDark: '#222222',
        }
      }
    },
  },
  plugins: [],
}
