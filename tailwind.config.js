/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        coral: "#FF385C",
        nearBlack: "#222222",
        midGray: "#717171",
        lightGray: "#F7F7F7",
        borderGray: "#DDDDDD",
        teal: "#00A699",
      },
    },
  },
  plugins: [],
};