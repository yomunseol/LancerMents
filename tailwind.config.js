/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#151115",
        surface: "#221C21",
        "primary-text": "#F8F4F7",
        "accent-mauve": "#D8A8D3",
        "deep-border": "#4A2E46",
      },
    },
  },
  plugins: [],
};
