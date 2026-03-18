/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#fdf2f8",
          100: "#fce7f3",
          500: "#e1306c",
          600: "#c13584",
          700: "#833ab4",
          gradient: "linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
        "scale-in": "scaleIn 0.2s ease-out",
        "pulse-heart": "pulseHeart 0.3s ease-in-out",
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: "translateY(20px)" }, to: { opacity: 1, transform: "translateY(0)" } },
        scaleIn: { from: { opacity: 0, transform: "scale(0.95)" }, to: { opacity: 1, transform: "scale(1)" } },
        pulseHeart: { "0%,100%": { transform: "scale(1)" }, "50%": { transform: "scale(1.3)" } },
      },
    },
  },
  plugins: [],
};
