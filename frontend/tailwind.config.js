/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#0f766e",
        secondary: "#14b8a6",
        accent: "#0d9488",
        background: "#f8fafc",
        text: "#0f172a",
      },
    },
  },
  plugins: [],
} 