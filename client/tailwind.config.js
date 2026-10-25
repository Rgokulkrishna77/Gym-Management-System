/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Brand orange (600+ keeps white text above AA contrast)
        brand: {
          50: '#fff7ed', 100: '#ffedd5', 200: '#fed7aa', 400: '#fb923c',
          500: '#ea580c', 600: '#c2410c', 700: '#9a3412', 900: '#431407',
        },
      },
      fontFamily: { sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
};
