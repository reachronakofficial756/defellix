/** @type {import('tailwindcss').Config} */
import daisyui from "daisyui";

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        syne: ["Syne", "system-ui", "sans-serif"],
        dmsans: ["DM Sans", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [daisyui],
};
