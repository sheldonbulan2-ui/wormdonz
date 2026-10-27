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
        oled: '#000000',
        charcoal: {
          900: '#121214',
          800: '#1C1C1E',
          700: '#2C2C2E',
          600: '#3A3A3C',
        },
        electric: {
          500: '#0A84FF',
          600: '#0070E0',
        }
      }
    },
  },
  plugins: [],
}
