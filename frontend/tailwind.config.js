/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        heading: ["'Space Grotesk'", "sans-serif"],
        body: ["'Manrope'", "sans-serif"],
      },
      colors: {
        sand: "#F6E7CF",
        ember: "#D14D2D",
        pine: "#0F4C5C",
        slate: "#1F2937",
        cream: "#FFF8ED",
      },
      boxShadow: {
        panel: "0 22px 60px -20px rgba(18, 38, 46, 0.45)",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseAlert: {
          "0%, 100%": { transform: "scale(1)", opacity: "1" },
          "50%": { transform: "scale(1.03)", opacity: "0.85" },
        },
      },
      animation: {
        fadeUp: "fadeUp 450ms ease-out both",
        pulseAlert: "pulseAlert 1.5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
