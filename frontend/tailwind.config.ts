import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          50: "#FDFBF7",
          100: "#FAF6F0",
          200: "#F5EFE5",
          300: "#EDE4D5",
          400: "#DCCEB8",
        },
        amber: {
          50: "#FBF3E8",
          100: "#F4E2C7",
          200: "#E8C99A",
          300: "#D4A36B",
          400: "#CE8E50",
          500: "#C77A3A",
          600: "#A85F26",
          700: "#7A4218",
        },
        shadow: {
          50: "#EFEBE6",
          100: "#D8D2CB",
          300: "#8A8278",
          500: "#5C5448",
          700: "#3A3530",
          900: "#1F1B17",
        },
        peach: {
          100: "#F8E4D2",
          200: "#F4D5C0",
          300: "#E8B89A",
        },
        ivory: {
          100: "#F7E9CB",
          200: "#F0D9A8",
        },

        success: "#6B8E5A",
        warning: "#C77A3A",
        danger: "#A84A3A",
        info: "#5C7A8E",

        // Semantic aliases used across the app.
        canvas: "#FAF6F0",
        "canvas-2": "#F5EFE5",
        surface: "#FDFBF7",
        "surface-soft": "#F5EFE5",
        "surface-tint": "#EDE4D5",
        background: "#FAF6F0",
        ink: "#1F1B17",
        "ink-2": "#3A3530",
        muted: "#5C5448",
        "muted-2": "#8A8278",
        line: "#EDE4D5",
        border: "#EDE4D5",
        mint: "#6B8E5A",
      },
      borderRadius: {
        "4xl": "2rem",
      },
      boxShadow: {
        sm: "0 1px 2px rgba(58, 53, 48, 0.04)",
        soft: "0 4px 12px rgba(58, 53, 48, 0.06)",
        pop: "0 12px 32px rgba(58, 53, 48, 0.10)",
        ring: "0 0 0 6px rgba(199, 122, 58, 0.10)",
      },
      animation: {
        "fade-in": "fade-in 0.4s ease-out",
        "rise-in": "rise-in 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)",
        "soft-pulse": "soft-pulse 3s ease-in-out infinite",
        marquee: "marquee 40s linear infinite",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "rise-in": {
          from: { opacity: "0", transform: "translateY(16px) scale(0.98)" },
          to: { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        "soft-pulse": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(199, 122, 58, 0.0)" },
          "50%": { boxShadow: "0 0 0 12px rgba(199, 122, 58, 0.10)" },
        },
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        serif: ["var(--font-fraunces)", "Georgia", "Cambria", "serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
