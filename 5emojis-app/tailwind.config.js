/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#6C5CE7",
        secondary: "#A29BFE",
        accent: "#FD79A8",
        background: "#FAFAFA",
        surface: "#FFFFFF",
        text: "#2D3436",
        "text-secondary": "#636E72",
      },
    },
  },
  darkMode: "class",
  plugins: [],
};
