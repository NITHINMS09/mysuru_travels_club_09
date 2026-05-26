import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f3e8ff',
          100: '#e4ccff',
          200: '#c89dff',
          300: '#a96eff',
          400: '#8b3fff',
          500: '#6c2bd9',
          600: '#5a1fba',
          700: '#48169b',
          800: '#360f7c',
          900: '#24085d',
        },
        dark: {
          100: '#1a1a3e',
          200: '#14142e',
          300: '#0f0f24',
          400: '#0a0e27',
          500: '#050816',
          600: '#030510',
        },
        accent: {
          gold: '#f5a623',
          pink: '#ec4899',
          cyan: '#06b6d4',
          blue: '#3b82f6',
        },
      },
      fontFamily: {
        outfit: ['Outfit', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'hero-gradient': 'linear-gradient(135deg, #6c2bd9 0%, #3b82f6 50%, #06b6d4 100%)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'float-slow': 'float 8s ease-in-out infinite',
        'float-slower': 'float 10s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'slide-up': 'slideUp 0.8s ease-out forwards',
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'spin-slow': 'spin 8s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0) scale(1)' },
          '50%': { transform: 'translateY(-20px) scale(1.05)' },
        },
      },
      boxShadow: {
        'glow': '0 0 20px rgba(108, 43, 217, 0.3)',
        'glow-lg': '0 0 40px rgba(108, 43, 217, 0.4)',
        'glow-xl': '0 0 60px rgba(108, 43, 217, 0.5)',
        'card': '0 8px 32px rgba(0, 0, 0, 0.3)',
        'card-hover': '0 20px 60px rgba(108, 43, 217, 0.15)',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};

export default config;
