import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand NgajiGaes — dari design file
        brand: {
          DEFAULT: '#5E7A5C',
          light: '#7E997B',
          lighter: '#9DB59A',
          dark: '#3F5A3E',
          50: '#E9F1E6',
          100: '#D4E4D0',
        },
        accent: '#C2795A',
        // Backgrounds
        bg: {
          base: '#F4EFDF',
          sidebar: '#FCF8EC',
          header: '#FBF6E9',
          card: '#FCFAF2',
          muted: '#F0EBDA',
          input: '#FCFAF2',
        },
        // Borders
        border: {
          DEFAULT: '#EBE5D4',
          muted: '#F1ECDC',
          strong: '#E7E0CC',
          input: '#E3DCC8',
        },
        // Text
        text: {
          primary: '#2B2A24',
          secondary: '#5A574C',
          tertiary: '#3F3D34',
          muted: '#9A9279',
          light: '#A89F86',
          subtle: '#7A766B',
          placeholder: '#B0A78C',
        },
        // Status
        status: {
          excellent: { DEFAULT: '#5E8C61', bg: '#E9F1E6' },
          good: { DEFAULT: '#4F7CAC', bg: '#E8F0F6' },
          improvement: { DEFAULT: '#B58A1E', bg: '#F6EFD8' },
          warning: { DEFAULT: '#C77B3C', bg: '#F8EEE2' },
          critical: { DEFAULT: '#B4452F', bg: '#F7E7E2' },
        },
        // Priority
        priority: {
          low: '#7A766B',
          medium: '#4F7CAC',
          high: '#C77B3C',
          urgent: '#B4452F',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Bitter', 'Georgia', 'serif'],
      },
      fontSize: {
        '2xs': ['10px', '14px'],
        xs: ['11px', '16px'],
        sm: ['12px', '16px'],
        base: ['13px', '18px'],
        md: ['14px', '20px'],
        lg: ['16px', '22px'],
        xl: ['18px', '24px'],
        '2xl': ['20px', '28px'],
        '3xl': ['24px', '32px'],
        '4xl': ['30px', '36px'],
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '6px',
        md: '7px',
        lg: '8px',
        xl: '9px',
        '2xl': '12px',
        '3xl': '14px',
        full: '9999px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(60,50,20,.06)',
        'card-hover': '0 2px 8px rgba(60,50,20,.10)',
        drawer: '-8px 0 30px rgba(40,35,20,.16)',
        dropdown: '0 4px 16px rgba(40,35,20,.12)',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'none' },
        },
        drawerIn: {
          from: { transform: 'translateX(28px)', opacity: '0.4' },
          to: { transform: 'none', opacity: '1' },
        },
      },
      animation: {
        'fade-up': 'fadeUp .2s ease both',
        'drawer-in': 'drawerIn .28s ease both',
      },
    },
  },
  plugins: [],
};
export default config;
