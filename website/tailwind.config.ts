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
    },
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: [
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
          'base-100': '#1C1B4D',
          'base-200': '#151040',
          'base-300': '#0e0d28',
          'base-content': '#EAEAF3',
          'info': '#8b6fff',
          'success': '#36d399',
          'warning': '#fbbd23',
          'error': '#f87272',
        },
      },
    ],
  },
};

export default config;
