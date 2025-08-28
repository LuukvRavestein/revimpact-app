import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        impact: {
          blue: "#3A6FF8",
          lime: "#8AE34C",
          dark: "#1E1E1E",
          light: "#F4F5F7"
        }
      }
    }
  },
  plugins: []
}

export default config
