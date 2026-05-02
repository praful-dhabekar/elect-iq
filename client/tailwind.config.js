/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#003f87",
          container: "#0056b3",
          fixed: "#d7e2ff",
        },
        surface: {
          DEFAULT: "#f9f9ff",
          dim: "#d9d9e2",
          bright: "#f9f9ff",
          container: "#ededf6",
        },
        secondary: {
          DEFAULT: "#5b5f62",
          container: "#dde0e3",
        },
        outline: "#727784",
      },
      fontFamily: {
        inter: ["Inter", "sans-serif"],
      },
      borderRadius: {
        'sm': '0.125rem',
        'DEFAULT': '0.25rem',
        'md': '0.375rem',
        'lg': '0.5rem',
        'xl': '0.75rem',
        'bubble': '0.75rem',
      },
    },
  },
  plugins: [],
}
