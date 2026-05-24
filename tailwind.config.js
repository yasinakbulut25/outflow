/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Web (SPEC.md §13) paletiyle hizalı
        background: '#ffffff',
        foreground: '#0f172a',
        surface: '#f8fafc',
        border: '#e2e8f0',
        muted: '#64748b',
        accent: '#0f172a',
        success: '#22c55e',
        warning: '#f59e0b',
        danger: '#ef4444',
        emerald: { DEFAULT: '#059669', light: '#10b981' }, // birikim / gelir
      },
    },
  },
  plugins: [],
};
