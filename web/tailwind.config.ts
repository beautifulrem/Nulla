import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}", "./server/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          50: "#f7f7fb",
          100: "#ececf5",
          200: "#d7d7ea",
          300: "#b4b4d0",
          400: "#8787b1",
          500: "#66668f",
          600: "#4e4e72",
          700: "#393956",
          800: "#25253c",
          900: "#151520"
        }
      }
    }
  },
  plugins: []
};

export default config;
