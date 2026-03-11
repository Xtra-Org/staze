import tailwindcssAnimate from 'tailwindcss-animate'

export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        body: ['"Plus Jakarta Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        bg: 'var(--bg)',
        bg2: 'var(--bg2)',
        clay: {
          red: 'var(--clay-red)',
          amber: 'var(--clay-amber)',
          green: 'var(--clay-green)',
          blue: 'var(--clay-blue)',
          purple: 'var(--clay-purple)',
          white: 'var(--clay-white)',
          muted: 'var(--clay-muted)',
        },
      },
      borderRadius: {
        clay: '24px',
        chip: '999px',
      },
      boxShadow: {
        clay: '0 8px 32px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -1px 0 rgba(0,0,0,0.2)',
        'clay-button': '0 6px 0 rgba(0,0,0,0.4), 0 8px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.15)',
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.6s linear infinite',
      },
    },
  },
  plugins: [tailwindcssAnimate],
}
