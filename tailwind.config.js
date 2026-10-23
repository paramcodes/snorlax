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
          50: '#e6f4ea',
          100: '#ceebd5',
          500: '#34a853',
          600: '#2b8a3e',
          700: '#1e6b2e',
          900: '#134d1f',
        },
        slack: {
          dark: '#1a1d21',
          sidebar: '#19171d',
          hover: '#222529',
          active: '#1164a3',
        }
      }
    },
  },
  plugins: [],
}
