import type { Config } from "tailwindcss";

// Design tokens carried over from the V1 site: near-black background,
// signal red as the single accent, gold reserved for template placeholders,
// Barlow / Barlow Condensed / IBM Plex Mono type system.
export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0b0b0d",
        raise: "#121215",
        card: "#16161a",
        line: "#26262c",
        linestrong: "#3a3a42",
        ink: "#f2f1ec",
        opp: "#8d99ae",
        brand: "#e5322d",
        branddeep: "#b01e1a",
        gold: "#e8b33c",
      },
      fontFamily: {
        sans: ["Barlow", "system-ui", "sans-serif"],
        condensed: ["'Barlow Condensed'", "Barlow", "sans-serif"],
        mono: ["'IBM Plex Mono'", "ui-monospace", "monospace"],
      },
      boxShadow: {
        panel: "0 18px 50px rgba(0,0,0,0.5)",
      },
    },
  },
  plugins: [],
} satisfies Config;
