/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#060040",
        secondary: "#eaa400"
      },
      fontFamily: {
        poppins: ["Poppins"]
      }
    },
  },
  plugins: [],
}

