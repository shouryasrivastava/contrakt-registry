import type { Config } from "tailwindcss";

const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // semantic, theme-aware tokens (see globals.css :root / [data-theme="light"])
        background: token("bg-rgb"),
        surface: token("surface-rgb"),
        panel: token("panel-rgb"),
        inset: token("inset-rgb"),
        hover: token("hover-rgb"),
        border: token("border-rgb"),
        border2: token("border2-rgb"),
        ink: token("ink-rgb"),
        ink2: token("ink2-rgb"),
        sub: token("sub-rgb"),
        muted: token("muted-rgb"),
        faint: token("faint-rgb"),
        accent: token("accent-rgb"),
        lime: token("lime-rgb"),
        limefg: token("limefg-rgb"),
        limedim: token("limedim-rgb"),
      },
      fontFamily: {
        mono: ["var(--font-mono)", "Menlo", "Monaco", "Courier New", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
