/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT:  '#0f131c',
          dim:      '#0f131c',
          bright:   '#353942',
          lowest:   '#0a0e16',
          low:      '#181c24',
          container:'#1c2028',
          high:     '#262a33',
          highest:  '#31353e',
          deep:     '#0B0F17',
          canvas:   '#111827',
        },
        on: {
          surface:        '#dfe2ee',
          'surface-variant': '#cbc3d7',
        },
        outline: {
          DEFAULT: '#958ea0',
          variant: '#494454',
        },
        primary: {
          DEFAULT:   '#d0bcff',
          container: '#a078ff',
          glow:      'rgba(139,92,246,0.18)',
        },
        secondary: {
          DEFAULT:   '#c0c1ff',
          container: '#3131c0',
        },
        tertiary: {
          DEFAULT: '#7bd0ff',
        },
        telemetry: {
          success: '#10B981',
          warning: '#F59E0B',
          danger:  '#EF4444',
          cyan:    '#06B6D4',
        },
        // Semantic shortcuts
        violet:  '#8B5CF6',
        indigo:  '#6366F1',
      },
      fontFamily: {
        sans:  ['var(--font-inter)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono:  ['var(--font-jetbrains)', 'ui-monospace', 'JetBrains Mono', 'monospace'],
      },
      fontSize: {
        'display-lg': ['48px', { lineHeight: '56px', letterSpacing: '-0.03em', fontWeight: '700' }],
        'display-sm': ['36px', { lineHeight: '44px', letterSpacing: '-0.025em', fontWeight: '700' }],
        'headline-lg':['30px', { lineHeight: '38px', letterSpacing: '-0.02em',  fontWeight: '600' }],
        'headline-md':['22px', { lineHeight: '30px', letterSpacing: '-0.015em', fontWeight: '600' }],
        'headline-sm':['18px', { lineHeight: '26px', letterSpacing: '-0.01em',  fontWeight: '600' }],
        'body-lg':    ['16px', { lineHeight: '24px', letterSpacing: '-0.005em' }],
        'body-md':    ['14px', { lineHeight: '22px', letterSpacing: '0' }],
        'body-sm':    ['12px', { lineHeight: '18px', letterSpacing: '0' }],
        'code-lg':    ['15px', { lineHeight: '22px', letterSpacing: '-0.01em' }],
        'code-md':    ['13px', { lineHeight: '20px', letterSpacing: '0' }],
        'telemetry':  ['11px', { lineHeight: '14px', letterSpacing: '0.06em',   fontWeight: '600' }],
        'caption':    ['11px', { lineHeight: '16px', letterSpacing: '0.02em',   fontWeight: '500' }],
      },
      borderRadius: {
        sm:   '0.125rem',
        DEFAULT: '0.25rem',
        md:   '0.375rem',
        lg:   '0.5rem',
        xl:   '0.75rem',
        '2xl':'1rem',
        '3xl':'1.5rem',
        full: '9999px',
      },
      spacing: {
        xxs: '0.125rem',
        xs:  '0.25rem',
        sm:  '0.5rem',
        md:  '0.75rem',
        lg:  '1rem',
        xl:  '1.5rem',
        '2xl':'2rem',
        '3xl':'3rem',
      },
      backdropBlur: {
        xs: '4px',
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
      },
      boxShadow: {
        'violet-glow': '0 0 16px rgba(139, 92, 246, 0.35)',
        'violet-glow-lg': '0 0 24px -4px rgba(139, 92, 246, 0.25)',
        'modal': '0 20px 40px -15px rgba(0,0,0,0.7)',
        'card': '0 4px 24px rgba(0,0,0,0.4)',
      },
    },
  },
  plugins: [],
}
