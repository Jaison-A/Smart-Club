/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'rgb(var(--color-primary) / <alpha-value>)',
          light: 'rgb(var(--color-primary-light) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'rgb(var(--color-accent) / <alpha-value>)',
          light: 'rgb(var(--color-accent-light) / <alpha-value>)',
        },
        surface: 'rgb(var(--color-surface) / <alpha-value>)',
        onaccent: 'rgb(var(--color-on-accent) / <alpha-value>)',
        onprimary: 'rgb(var(--color-on-primary) / <alpha-value>)',
        teal: 'rgb(var(--color-teal) / <alpha-value>)',
        purple: 'rgb(var(--color-purple) / <alpha-value>)',
        canvas: 'rgb(var(--color-bg) / <alpha-value>)',
        sidebar: 'rgb(var(--color-sidebar) / <alpha-value>)',
        border: 'rgb(var(--color-border) / <alpha-value>)',
        ink: {
          DEFAULT: 'rgb(var(--color-text) / <alpha-value>)',
          muted: 'rgb(var(--color-text-muted) / <alpha-value>)',
          inverse: 'rgb(var(--color-text-inverse) / <alpha-value>)',
        },
        success: {
          DEFAULT: 'rgb(var(--color-success) / <alpha-value>)',
          bg: 'rgb(var(--color-success-bg) / <alpha-value>)',
        },
        warning: {
          DEFAULT: 'rgb(var(--color-warning) / <alpha-value>)',
          bg: 'rgb(var(--color-warning-bg) / <alpha-value>)',
        },
        danger: {
          DEFAULT: 'rgb(var(--color-danger) / <alpha-value>)',
          bg: 'rgb(var(--color-danger-bg) / <alpha-value>)',
        },
        info: {
          DEFAULT: 'rgb(var(--color-info) / <alpha-value>)',
          bg: 'rgb(var(--color-info-bg) / <alpha-value>)',
        },
      },
      fontFamily: {
        display: ['Sora', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
      },
    },
  },
  plugins: [],
};
