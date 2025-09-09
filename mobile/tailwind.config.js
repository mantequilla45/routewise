/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: '#FFCC66',
        dark: '#404040',
      },
      fontFamily: {
        sans: ['System', 'sans-serif'],
      }
    },
  },
  plugins: [],
}