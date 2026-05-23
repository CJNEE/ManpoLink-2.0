/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#C41E3A',
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        dark: {
          bg: '#1F2937',
          card: '#1E1E1E',
          text: '#F3F4F6'
        },
        light: {
          bg: '#FFFFFF',
          card: '#F3F4F6',
          text: '#111827'
        },
        status: {
          active: '#10B981',
          inactive: '#6B7280',
          awol: '#F59E0B',
          blacklist: '#EF4444',
          present: '#10B981',
          late: '#F59E0B',
          absent: '#EF4444'
        }
      },
      animation: {
        'fadeIn': 'fadeIn 0.3s ease-in-out',
        'slideIn': 'slideIn 0.3s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        }
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
  darkMode: 'class'
}
