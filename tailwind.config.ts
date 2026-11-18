import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      colors: {
        canvas: "#FAF8F5",
        ink: "#14221B",
        emeraldBrand: "#0F5132",
        saffron: "#D97706",
      },
    },
  },
  plugins: [],
} satisfies Config;