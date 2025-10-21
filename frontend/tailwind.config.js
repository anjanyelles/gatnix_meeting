/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}", // <-- scans all React components
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
