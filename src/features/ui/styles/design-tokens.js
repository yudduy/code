/**
 * Codexel Design Tokens - Developer Focus Design System
 * 
 * Centralized design values for consistent, professional UI that developers respect.
 * Inspired by modern IDEs like VS Code, GitHub, and Linear.
 */

export const designTokens = {
  // Color Palette - Professional Developer Tool Aesthetic
  colors: {
    // Backgrounds
    primaryBackground: '#1A1D21',      // Very dark, slightly blue-tinted charcoal
    componentBackground: '#24282F',     // Slightly lighter slate for modals and headers
    
    // Borders & Dividers
    border: 'rgba(255, 255, 255, 0.1)', // Subtle white with 10% opacity
    borderHover: 'rgba(255, 255, 255, 0.2)', // Slightly more prominent on hover
    
    // Text
    primaryText: '#E1E1E6',            // Soft, off-white for high readability
    secondaryText: '#A8A8B3',          // Muted gray for labels and non-critical info
    
    // Interactive States
    accent: '#8257E5',                 // Strong, modern purple for primary actions
    accentHover: '#9466F0',            // Slightly lighter purple for hover states
    
    // State Colors
    critical: '#F75A68',               // Clear, unambiguous red for stop/danger
    criticalHover: '#FF6B7A',          // Lighter red for hover
    success: '#04D361',                // Vibrant green for success states
    warning: '#F39C12',                // Orange for warning states
    
    // Component-specific Colors
    recording: '#F75A68',              // Red dot for recording indicator
    timerNormal: '#E1E1E6',           // Normal timer color
    timerWarning: '#F39C12',          // Timer warning (last 15 min)
    timerCritical: '#F75A68',         // Timer critical (last 5 min)
  },

  // Typography - Inter font family with monospace for data
  typography: {
    // Font Families
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontFamilyMono: "'SF Mono', 'Menlo', 'Consolas', 'Monaco', monospace",
    
    // Font Weights
    fontWeightRegular: 400,
    fontWeightMedium: 500,
    fontWeightSemiBold: 600,
    
    // Font Sizes
    fontSize12: '12px',               // Small text, footer, labels
    fontSize13: '13px',               // Timer, counters, status bar text
    fontSize14: '14px',               // Body text, descriptions
    fontSize16: '16px',               // Section titles, important text
    fontSize20: '20px',               // Modal titles
    fontSize24: '24px',               // Main headings
    
    // Line Heights
    lineHeightTight: 1.2,             // Headings
    lineHeightNormal: 1.4,            // Body text
    lineHeightRelaxed: 1.6,           // Large blocks of text
  },

  // Spacing System - 4px base unit
  spacing: {
    xs: '4px',                        // Tiny gaps
    sm: '8px',                        // Small gaps, inner padding
    md: '12px',                       // Medium gaps
    lg: '16px',                       // Large gaps, section padding
    xl: '20px',                       // Extra large gaps
    xxl: '24px',                      // Section spacing
    xxxl: '32px',                     // Modal padding, major sections
  },

  // Border Radius - Subtle, professional radii
  borderRadius: {
    small: '4px',                     // Buttons, small elements
    medium: '6px',                    // Cards, modals, containers
    large: '8px',                     // Large containers
  },

  // Component Dimensions
  dimensions: {
    // Header/Status Bar
    headerHeight: '36px',             // Professional status bar height
    headerPadding: '8px 16px',        // Header internal padding
    
    // Buttons
    buttonHeight: '32px',             // Standard button height
    buttonHeightSmall: '24px',        // Small button height (header)
    buttonPadding: '8px 16px',        // Standard button padding
    buttonPaddingSmall: '4px 8px',    // Small button padding
    
    // Modals
    modalWidth: '480px',              // Standard modal width
    modalPadding: '32px',             // Modal internal padding
    modalMaxWidth: '90vw',            // Modal responsive max width
    modalMaxHeight: '90vh',           // Modal responsive max height
  },

  // Transitions - Subtle, fast animations
  transitions: {
    fast: '0.15s ease',               // Quick hover states
    normal: '0.2s ease',              // Standard transitions
    slow: '0.3s ease',                // Modal appearances
    
    // Specific easing functions
    easeOut: 'cubic-bezier(0.23, 1, 0.32, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },

  // Shadows - Subtle depth without glassmorphism
  shadows: {
    small: '0 2px 8px rgba(0, 0, 0, 0.1)',      // Subtle element elevation
    medium: '0 4px 16px rgba(0, 0, 0, 0.15)',   // Modal shadows
    large: '0 8px 32px rgba(0, 0, 0, 0.2)',     // Major component shadows
  },

  // Z-Index Scale
  zIndex: {
    base: 1,
    elevated: 10,
    modal: 1000,
    overlay: 10000,
  },
};

/**
 * CSS Custom Properties Generator
 * Converts design tokens to CSS custom properties for use in stylesheets
 */
export function generateCSSCustomProperties() {
  const cssVars = {
    // Colors
    '--color-primary-bg': designTokens.colors.primaryBackground,
    '--color-component-bg': designTokens.colors.componentBackground,
    '--color-border': designTokens.colors.border,
    '--color-border-hover': designTokens.colors.borderHover,
    '--color-text-primary': designTokens.colors.primaryText,
    '--color-text-secondary': designTokens.colors.secondaryText,
    '--color-accent': designTokens.colors.accent,
    '--color-accent-hover': designTokens.colors.accentHover,
    '--color-critical': designTokens.colors.critical,
    '--color-critical-hover': designTokens.colors.criticalHover,
    '--color-success': designTokens.colors.success,
    '--color-warning': designTokens.colors.warning,
    '--color-recording': designTokens.colors.recording,
    '--color-timer-normal': designTokens.colors.timerNormal,
    '--color-timer-warning': designTokens.colors.timerWarning,
    '--color-timer-critical': designTokens.colors.timerCritical,

    // Typography
    '--font-family': designTokens.typography.fontFamily,
    '--font-family-mono': designTokens.typography.fontFamilyMono,
    '--font-weight-regular': designTokens.typography.fontWeightRegular,
    '--font-weight-medium': designTokens.typography.fontWeightMedium,
    '--font-weight-semibold': designTokens.typography.fontWeightSemiBold,
    '--font-size-12': designTokens.typography.fontSize12,
    '--font-size-13': designTokens.typography.fontSize13,
    '--font-size-14': designTokens.typography.fontSize14,
    '--font-size-16': designTokens.typography.fontSize16,
    '--font-size-20': designTokens.typography.fontSize20,
    '--font-size-24': designTokens.typography.fontSize24,

    // Spacing
    '--spacing-xs': designTokens.spacing.xs,
    '--spacing-sm': designTokens.spacing.sm,
    '--spacing-md': designTokens.spacing.md,
    '--spacing-lg': designTokens.spacing.lg,
    '--spacing-xl': designTokens.spacing.xl,
    '--spacing-xxl': designTokens.spacing.xxl,
    '--spacing-xxxl': designTokens.spacing.xxxl,

    // Border Radius
    '--radius-sm': designTokens.borderRadius.small,
    '--radius-md': designTokens.borderRadius.medium,
    '--radius-lg': designTokens.borderRadius.large,

    // Dimensions
    '--header-height': designTokens.dimensions.headerHeight,
    '--button-height': designTokens.dimensions.buttonHeight,
    '--button-height-sm': designTokens.dimensions.buttonHeightSmall,
    '--modal-width': designTokens.dimensions.modalWidth,

    // Transitions
    '--transition-fast': designTokens.transitions.fast,
    '--transition-normal': designTokens.transitions.normal,
    '--transition-slow': designTokens.transitions.slow,

    // Shadows
    '--shadow-sm': designTokens.shadows.small,
    '--shadow-md': designTokens.shadows.medium,
    '--shadow-lg': designTokens.shadows.large,
  };

  return cssVars;
}

/**
 * Apply design tokens as CSS custom properties to the document root
 * Call this function on app initialization to make tokens available globally
 */
export function applyDesignTokensToRoot() {
  const cssVars = generateCSSCustomProperties();
  const root = document.documentElement;
  
  Object.entries(cssVars).forEach(([property, value]) => {
    root.style.setProperty(property, value);
  });
}

export default designTokens;