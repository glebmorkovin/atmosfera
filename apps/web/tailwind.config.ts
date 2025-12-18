import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: "#0ea5e9",
        secondary: "#0f172a",
        accent: "#22d3ee",
        muted: "#e2e8f0"
      }
    }
  },
  plugins: []
};

export default config;
