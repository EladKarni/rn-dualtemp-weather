/**
 * Widget layout utilities for responsive design across different widget sizes
 * Provides consistent spacing, font sizes, and styling for all weather widgets
 */

export type WidgetSize = 'compact' | 'standard' | 'extended';

export interface LayoutConfig {
  fonts: {
    temp: number;
    location: number;
    text: number;
    metrics: number;
    smallText: number;
  };
  spacing: {
    padding: number;
    margin: number;
    small: number;
    large: number;
  };
  colors: {
    background: string;
    primary: string;
    secondary: string;
    tertiary: string;
    text: string;
    subtext: string;
    faint: string;
  };
}

export const getLayoutConfig = (size: WidgetSize): LayoutConfig => ({
  fonts: {
    temp: { compact: 20, standard: 32, extended: 40 }[size],
    location: { compact: 9, standard: 12, extended: 14 }[size],
    text: { compact: 10, standard: 12, extended: 14 }[size],
    metrics: { compact: 9, standard: 11, extended: 12 }[size],
    smallText: { compact: 8, standard: 10, extended: 11 }[size],
  },
  spacing: {
    padding: { compact: 8, standard: 12, extended: 16 }[size],
    margin: { compact: 4, standard: 8, extended: 12 }[size],
    small: { compact: 2, standard: 4, extended: 6 }[size],
    large: { compact: 8, standard: 16, extended: 24 }[size],
  },
  colors: {
    background: '#1C1B4D',
    primary: '#FFFFFF',
    secondary: '#E5E7EB',
    tertiary: '#9CA3AF',
    text: '#FFFFFF',
    subtext: '#E5E7EB',
    faint: '#6B7280',
  },
});

/**
 * Get font size for specific text element based on widget size
 */
export const getFontSize = (size: WidgetSize, type: keyof LayoutConfig['fonts']): number => {
  return getLayoutConfig(size).fonts[type];
};

/**
 * Get spacing value for widget size
 */
export const getSpacing = (size: WidgetSize, type: keyof LayoutConfig['spacing']): number => {
  return getLayoutConfig(size).spacing[type];
};

/**
 * Get color value for widget styling
 */
export const getColor = (size: WidgetSize, type: keyof LayoutConfig['colors']): string => {
  return getLayoutConfig(size).colors[type];
};