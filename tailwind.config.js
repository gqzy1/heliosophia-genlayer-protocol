/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        alabaster: '#F6F4EE',
        linen: '#EFECE4',
        vellum: '#E6E1D5',
        hairline: '#D4CFC3',
        carbon: '#141413',
        graphite: '#52504C',
        stoneMuted: '#827E77',
        vermilion: '#D9381E',
        prussian: '#1D4ED8',
        verdigris: '#15803D',
        ochre: '#B45309',
        nocturneBg: '#0E1012',
        nocturneSurface: '#16191D',
        nocturneRule: '#262A30',
      },
      fontFamily: {
        serif: ['"Instrument Serif"', '"Newsreader"', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      }
    },
  },
  plugins: [],
};
