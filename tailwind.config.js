/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0B2230",
        inksoft: "#1B3A4B",
        sand: "#F5EFE2",
        sanddeep: "#ECE2CC",
        paper: "#FFFFFF",
        gold: "#C68A3D",
        goldsoft: "#EFDCB8",
        teal: "#11645B",
        tealsoft: "#DCEDE9",
        clay: "#BD5B3A",
        claysoft: "#F3DDD3",
        line: "#E3DACB",
        muted: "#6B6155",
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
        mono: ["var(--font-mono)"],
      },
      borderRadius: {
        xl2: "22px",
      },
    },
  },
  plugins: [],
};
