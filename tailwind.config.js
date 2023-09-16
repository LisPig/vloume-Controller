/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['*.html',"/src/**/*.{html,js}"],
  theme: {
    extend: {
      colors: {
        gray: {
          400: '#999999', 
        }
      }
    },
  },
  plugins: [],
}

