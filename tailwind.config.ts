import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#485353",
        paper: "#FFFBF6",
        brand: {
          50: "#FFF1EC",
          100: "#FFDDD0",
          300: "#FFAD8C",
          500: "#FF7F56", // primary — Ариг Академи coral
          700: "#E35F37",
          900: "#7A2F14",
        },
        accent: "#2E6E5E", // deep juniper green — success/progress indicators
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
      },
      borderRadius: {
        sm: "4px",
        md: "8px",
        lg: "14px",
      },
    },
  },
  plugins: [],
};

export default config;
