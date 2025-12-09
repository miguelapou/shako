const plugin = require('tailwindcss/plugin');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [
    // Custom variant for hover-capable devices (mouse, trackpad, stylus)
    // Uses JavaScript-detected 'has-hover' class on <html> element
    // This dynamically enables hover when mouse/trackpad is actively being used
    // Works on iPad with trackpad where CSS media queries fail
    plugin(function({ addVariant }) {
      addVariant('can-hover', '.has-hover &');
    }),
  ],
}
