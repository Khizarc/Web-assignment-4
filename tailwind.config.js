module.exports = {
  content: [
    "./views/**/*.ejs",   
    "./public/**/*.html", 
    "./public/css/tailwind.css" 
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('daisyui'),
  ],
  daisyui: {
    themes: ["fantasy"], 
  },
};
