import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // --- Public/Citizen portal (BhumiKosh) semantic tokens, scoped
        // under [data-portal="public"] in globals.css ---
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        "land-green": {
          DEFAULT: "hsl(140 55% 28%)",
          light: "hsl(140 40% 92%)",
          dark: "hsl(140 55% 18%)",
        },
        // --- Government/Policy portal "register" palette ---
        // Warmed and deepened from the original flat navy/ochre-on-white
        // pass: a warmer parchment page, an off-white (not pure white) card
        // surface, a warm taupe line instead of a cool grey one, and two
        // tint washes (navyTint / ochreTint) for highlighted panels like the
        // area summary header -- meant to read like an actual government
        // register/gazette page rather than a generic dashboard template.
        register: {
          bg: "#F5EFE3",
          panel: "#FFFDF8",
          panelAlt: "#FBF3E3",
          ink: "#231F1A",
          navy: "#152238",
          navy2: "#22345A",
          navyTint: "#EAEEF3",
          ochre: "#A8752A",
          ochreTint: "#F3E6C9",
          line: "#E1D3B4",
          lineStrong: "#CBB98F",
          official: "#1F7A4C",
          sample: "#A8752A",
          derived: "#2E5F8A",
          historical: "#6B5D45",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        serif: ["\"Source Serif 4\"", "Georgia", "serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(64, 45, 15, 0.05), 0 1px 1px rgba(64, 45, 15, 0.04)",
        raised: "0 8px 20px rgba(21, 34, 56, 0.10), 0 2px 4px rgba(21, 34, 56, 0.07)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-400px 0" },
          "100%": { backgroundPosition: "400px 0" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.45s ease-out both",
        shimmer: "shimmer 1.6s linear infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
