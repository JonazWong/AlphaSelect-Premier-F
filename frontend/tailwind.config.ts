import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#00D9FF',
        secondary: '#B24BF3',
        accent: '#00FFB3',
        background: '#0A1628',
        card: '#1A2332',
      },
      fontFamily: {
        mono: ['monospace'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-cyan-purple': 'linear-gradient(90deg, #00D9FF 0%, #B24BF3 100%)',
      },
      boxShadow: {
        'neon-cyan': '0 0 10px #00D9FF, 0 0 20px #00D9FF, 0 0 30px #00D9FF',
        'neon-purple': '0 0 10px #B24BF3, 0 0 20px #B24BF3, 0 0 30px #B24BF3',
        'neon-green': '0 0 10px #00FFB3, 0 0 20px #00FFB3, 0 0 30px #00FFB3',
      },
    },
  },
  plugins: [],
}

export default config
