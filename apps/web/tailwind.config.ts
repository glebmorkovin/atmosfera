import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: "rgb(var(--accent-rgb) / <alpha-value>)",
        secondary: "rgb(var(--bg-rgb) / <alpha-value>)",
        accent: "rgb(var(--accent-rgb) / <alpha-value>)",
        muted: "rgb(var(--muted-rgb) / <alpha-value>)",
        panel: "rgb(var(--panel-rgb) / <alpha-value>)"
      }
    }
  },
  plugins: []
};

export default config;
