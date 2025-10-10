/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    screens: {
      'xs': '480px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
    fontFamily: {
      'sans': ['Merriweather', 'serif'],
      'serif': ['Merriweather', 'serif'],
      'display': ['Merriweather', 'serif'],
      'body': ['Merriweather', 'serif'],
    },
    extend: {
      colors: {
        terraveil: {
          bg:   '#0f1115', // page background
          card: '#12151b', // card background
          line: '#c23c3c', // crimson accent (headers/dividers)
          text: '#E6E6E6',
          mute: '#9AA0A6',
          link: '#d56060',
        },
      },
      typography: ({ theme }) => ({
        DEFAULT: {
          css: {
            fontFamily: 'Merriweather, serif',
            lineHeight: '1.7',
            maxWidth: '70ch',
          }
        },
        invert: {
          css: {
            '--tw-prose-body': theme('colors.terraveil.text'),
            '--tw-prose-headings': theme('colors.terraveil.line'),
            '--tw-prose-links': theme('colors.terraveil.link'),
            '--tw-prose-bold': theme('colors.terraveil.text'),
            '--tw-prose-bullets': theme('colors.terraveil.mute'),
            '--tw-prose-hr': theme('colors.terraveil.line'),
            fontFamily: 'Merriweather, serif',
            h1: {
              fontFamily: 'Merriweather, serif',
              fontWeight: '900',
              letterSpacing: '-0.025em',
            },
            h2: {
              fontFamily: 'Merriweather, serif',
              fontWeight: '700',
              letterSpacing: '-0.015em',
            },
            h3: {
              fontFamily: 'Merriweather, serif',
              fontWeight: '700',
            },
            p: {
              fontFamily: 'Merriweather, serif',
              fontWeight: '300',
            },
            strong: {
              fontWeight: '700',
            },
          },
        },
      }),
    },
  },
  plugins: [require('daisyui'), require('@tailwindcss/typography')],
  daisyui: {
    darkTheme: 'terraveil',
    themes: [
      {
        terraveil: {
          'color-scheme': 'dark',
          primary:   '#d56060',
          secondary: '#7a8aa1',
          accent:    '#c23c3c',
          neutral:   '#1a1d23',
          'base-100': '#0f1115', // bg
          'base-200': '#12151b', // card
          'base-300': '#191d24', // borders
          info:    '#58a6ff',
          success: '#34d399',
          warning: '#f59e0b',
          error:   '#ef4444',
        },
      },
      'dark', // fallback
    ],
  },
}
