import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0a0a0a",
        surface: "#111111",
        border: "#1f1f1f",
        muted: "#6b7280",
        accent: "#3b82f6",
      },
      fontFamily: {
        mono: ["var(--font-mono)", "Menlo", "Monaco", "Courier New", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
