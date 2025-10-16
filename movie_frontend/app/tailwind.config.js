// tailwind.config.js
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",  // 👈 this is crucial
  ],
  theme: {
    extend: {},
  },
  plugins: [require('tailwind-scrollbar-hide')],

}
