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
        register: {
          bg: "#F7F5F0",
          panel: "#FFFFFF",
          ink: "#1C2430",
          navy: "#1B2A4A",
          navy2: "#283B63",
          ochre: "#B8862B",
          line: "#DCD6C8",
          official: "#1F7A4C",
          sample: "#B8862B",
          derived: "#2E5F8A",
          historical: "#6B6458",
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
        card: "0 1px 2px rgba(28, 36, 48, 0.04), 0 1px 1px rgba(28, 36, 48, 0.03)",
        raised: "0 4px 16px rgba(27, 42, 74, 0.10), 0 1px 2px rgba(27, 42, 74, 0.06)",
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
