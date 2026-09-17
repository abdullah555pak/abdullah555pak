import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#F5F6F8",
        surface: "#FFFFFF",
        "surface-2": "#EDF1F4",
        border: "#DCE2E7",
        ink: "#131A22",
        "ink-soft": "#454E59",
        muted: "#6B7480",
        accent: "#0E7C7B",
        "accent-strong": "#0A605F",
        "accent-soft": "#E1F2F1",
        gold: "#A9700F",
        "gold-soft": "#F7ECD9",
        good: "#2E9563",
        "good-soft": "#E3F5EC",
        warn: "#B5730F",
        "warn-soft": "#FBF0DA",
        critical: "#C9433F",
        "critical-soft": "#FBE6E5",
        info: "#3E63C4",
        "info-soft": "#EAEFFC",
      },
      fontFamily: {
        display: ["Georgia", "Cambria", "serif"],
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
