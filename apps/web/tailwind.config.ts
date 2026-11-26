import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#087F5B', 600: '#066b4d', 50: '#D7F2E5' },
        navy: '#102A43',
        surface: '#FFFFFF',
        canvas: '#F7F9F8',
        ink: '#182B25',
        muted: '#75847D',
        accent: '#D7F2E5',
      },
      fontFamily: { sans: ['var(--font-inter)', 'system-ui', 'sans-serif'], head: ['var(--font-head)', 'system-ui', 'sans-serif'] },
      boxShadow: { card: '0 1px 2px rgba(16,42,67,.06), 0 8px 24px -12px rgba(16,42,67,.12)' },
    },
  },
  plugins: [],
} satisfies Config;
