/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  // The app is always dark (app.json userInterfaceStyle), so NativeWind must not follow the OS.
  darkMode: "class",
  theme: {
    extend: {
      // Keep in sync with src/theme/colors.ts
      colors: {
        ink: "#0B0F1A",
        night: "#1E1B4B",
        surface: "#161B2E",
        brand: "#10B981",
        accent: "#8B5CF6",
        danger: "#EF4444",
        warn: "#F59E0B",
        info: "#6366F1",
      },
    },
  },
  plugins: [],
};
