import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        yt: {
          red: "#FF0000",
          "red-dark": "#CC0000",
          dark: "#0F0F0F",
          "dark-2": "#212121",
          "dark-3": "#272727",
          panel: "#181818",
          border: "#3F3F3F",
        },
      },
      fontFamily: {
        sans: [
          "Roboto",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Arial",
          "sans-serif",
        ],
      },
      borderRadius: {
        yt: "12px",
      },
    },
  },
  plugins: [],
};

export default config;
