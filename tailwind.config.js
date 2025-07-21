/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,js,jsx,ts,tsx}",
    "./src/app/*.html",
  ],
  theme: {
    extend: {
      colors: {
        // Base backgrounds - matching design tokens
        background: '#1A1D21',        // Primary Background
        component: '#24282F',         // Component Background
        
        // Borders & Dividers
        border: 'rgba(255, 255, 255, 0.1)',
        ring: 'rgba(255, 255, 255, 0.2)',
        
        // Text colors
        text: {
          primary: '#E1E1E6',         // Primary text - high readability
          secondary: '#A8A8B3',       // Secondary text - muted
        },
        
        // Interactive states
        accent: {
          DEFAULT: '#8257E5',         // Purple accent for primary actions
          foreground: '#E1E1E6',      // Text on accent background
          hover: '#9466F0',           // Lighter purple for hover
        },
        
        // State colors
        destructive: {
          DEFAULT: '#F75A68',         // Critical red for danger actions
          foreground: '#E1E1E6',      // Text on destructive background
          hover: '#FF6B7A',           // Lighter red for hover
        },
        success: {
          DEFAULT: '#04D361',         // Success green
          foreground: '#E1E1E6',
        },
        warning: {
          DEFAULT: '#F39C12',         // Warning orange
          foreground: '#E1E1E6',
        },
        
        // Component-specific colors
        recording: '#F75A68',         // Recording indicator dot
        muted: 'rgba(255, 255, 255, 0.05)', // Very subtle backgrounds
        'muted-foreground': '#A8A8B3',
      },
      
      // Typography - Inter font family with monospace for data
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['SF Mono', 'Menlo', 'Consolas', 'Monaco', 'monospace'],
      },
      
      // Font sizes - matching design tokens
      fontSize: {
        '11': '11px',                 // Small UI text
        '12': '12px',                 // Footer, labels
        '13': '13px',                 // Timer, status bar text
        '14': '14px',                 // Body text, descriptions
        '16': '16px',                 // Section titles
        '20': '20px',                 // Modal titles
        '24': '24px',                 // Main headings
        '28': '28px',                 // Large headings
        '36': '36px',                 // Hero titles
      },
      
      // Border radius - Professional, subtle radii
      borderRadius: {
        lg: '6px',                    // Main radius for cards, modals
        md: '4px',                    // Button radius
        sm: '3px',                    // Small elements
      },
      
      // Spacing - 4px base unit system
      spacing: {
        '18': '4.5rem',               // 72px
      },
      
      // Component dimensions
      height: {
        '9': '36px',                  // Professional status bar height
        '11': '44px',                 // Standard button height
      },
      
      // Transitions - Subtle, fast animations
      transitionDuration: {
        '150': '150ms',               // Fast hover states
        '200': '200ms',               // Standard transitions
        '300': '300ms',               // Modal appearances
      },
      
      // Box shadows - Subtle depth without glassmorphism
      boxShadow: {
        sm: '0 2px 8px rgba(0, 0, 0, 0.1)',      // Subtle element elevation
        md: '0 4px 16px rgba(0, 0, 0, 0.15)',    // Modal shadows
        lg: '0 8px 32px rgba(0, 0, 0, 0.2)',     // Major component shadows
      },
      
      // Animation
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-in': 'slideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      
      // Keyframes
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { 
            opacity: '0',
            transform: 'translateY(8px)',
          },
          '100%': { 
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
      },
    },
  },
  plugins: [],
}