import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0fdf9",
          100: "#ccfbef",
          200: "#99f6e4",
          500: "#14b8a6",
          600: "#0d9488",
          700: "#0f766e",
          800: "#115e59",
        },
      },
      boxShadow: {
        panel: "0 12px 32px rgba(15, 23, 42, 0.07)",
      },
    },
  },
  plugins: [],
} satisfies Config;
