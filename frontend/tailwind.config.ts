import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0B0D10",
        panel: "#12161B",
        line: "#252B33",
        gold: "#E8B84A",
        diffAdd: "#173B2D",
        diffRemove: "#432126",
        muted: "#89919D",
        code: "#D7DCE3",
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
       fontFamily: {
        sans: ["var(--font-geist-sans)", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
      boxShadow: {
        panel: "0 24px 80px rgba(0, 0, 0, 0.28)",
      },
      maxWidth: {
        "8xl": "90rem",
      },
    },
  },
  plugins: [],
} satisfies Config;
