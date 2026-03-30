import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/views/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['var(--font-dm-serif)', 'Georgia', 'serif'],
        sans: ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
      },
      colors: {
        dualtemp: {
          50: '#f0edff',
          100: '#e0dbff',
          200: '#c4b8ff',
          300: '#a894ff',
          400: '#8b6fff',
          500: '#6B58FF',
          600: '#5040e0',
          700: '#3621dc',
          800: '#2a1ab0',
          900: '#1C1B4D',
          950: '#0e0d28',
        },
      },
      keyframes: {
        'aurora-pulse': {
          '0%, 100%': { opacity: '0.3', transform: 'scale(1)' },
          '50%': { opacity: '0.6', transform: 'scale(1.1)' },
        },
        'gradient-shift': {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
      },
      animation: {
        'aurora-pulse': 'aurora-pulse 8s ease-in-out infinite',
        'gradient-shift': 'gradient-shift 15s ease infinite',
      },
    },
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: [
      {
        dark: {
          'primary': '#6B58FF',
          'primary-content': '#ffffff',
          'secondary': '#715EF5',
          'secondary-content': '#ffffff',
          'accent': '#a894ff',
          'accent-content': '#ffffff',
          'neutral': '#0e0d28',
          'neutral-content': '#EAEAF3',
          'base-100': '#0b0f1a',
          'base-200': '#131525',
          'base-300': '#1C1B4D',
          'base-content': '#E8E6F0',
          'info': '#8b6fff',
          'success': '#36d399',
          'warning': '#fbbd23',
          'error': '#f87272',
        },
      },
      {
        light: {
          'primary': '#3621dc',
          'primary-content': '#ffffff',
          'secondary': '#6B58FF',
          'secondary-content': '#ffffff',
          'accent': '#715EF5',
          'accent-content': '#ffffff',
          'neutral': '#1C1B4D',
          'neutral-content': '#EAEAF3',
          'base-100': '#f8f6ff',
          'base-200': '#f0edff',
          'base-300': '#e0dbff',
          'base-content': '#1C1B4D',
          'info': '#6B58FF',
          'success': '#36d399',
          'warning': '#fbbd23',
          'error': '#f87272',
        },
      },
    ],
  },
};

export default config;
