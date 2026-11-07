import type { Config } from "tailwindcss";
import flowbite from "flowbite/plugin";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./node_modules/flowbite/**/*.js",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-manrope)", "system-ui", "sans-serif"],
      },
      colors: {
        deep: "#0c2342",
        ocean: "#1f5a8e",
        sky: "#3f7fb3",
        soft: "#f3f6fa",
        navy: "#0C2242",
        brand: "#E3081C",
      },
      boxShadow: {
        float: "0 18px 50px -12px rgba(12,35,66,.28)",
        card: "0 12px 36px -10px rgba(12,35,66,.16)",
      },
    },
  },
  plugins: [flowbite],
};
export default config;
