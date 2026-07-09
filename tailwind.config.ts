import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#151417",
        paper: "#FAF9F6",
        brand: {
          50: "#FBF3EC",
          100: "#F4DECB",
          300: "#E4A672",
          500: "#C9702F", // primary — warm ochre, nod to Mongolian felt/leather craft
          700: "#8F4A18",
          900: "#4A250C",
        },
        accent: "#2E6E5E", // deep juniper green
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
