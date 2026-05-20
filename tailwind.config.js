/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fffae6',
          100: '#fff5cc',
          200: '#ffeb99',
          300: '#ffdf66',
          400: '#ffd333',
          500: '#ffc700',
          600: '#e6b300',
          700: '#cc9f00',
          800: '#997700',
          900: '#665000',
        },
      },
    },
  },
  plugins: [],
}
