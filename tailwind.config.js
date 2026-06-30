/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--primary-color, #4f46e5)',
          light: 'var(--primary-light, #818cf8)',
        },
        success: 'var(--success-color, #10b981)',
        warning: 'var(--warning-color, #f59e0b)',
        danger: 'var(--danger-color, #ef4444)',
      }
    },
  },
  plugins: [],
}
