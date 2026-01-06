/**
 * Widget layout utilities for responsive design across different widget sizes
 * Provides consistent spacing, font sizes, and styling for all weather widgets
 * Now supports actual widget dimensions from app.json configuration
 */

export type WidgetSize = 'compact' | 'standard' | 'extended';

// Actual widget dimensions from app.json configuration
export interface WidgetDimensions {
  width: number;  // Number of cells horizontally
  height: number; // Number of cells vertically
  minWidth: string;
  minHeight: string;
}

export interface LayoutConfig {
  fonts: {
    temp: number;
    location: number;
    text: number;
    metrics: number;
    smallText: number;
    // New: Specific font sizes for different contexts
    primaryTemp: number;     // Primary temperature in stacked layout
    secondaryTemp: number;   // Secondary temperature in stacked layout
    slash: number;          // Separator character size
  };
  spacing: {
    padding: number;
    margin: number;
    small: number;
    large: number;
    // New: Optimized spacing for 1x1
    minimalPadding: number;     // Minimal padding for 1x1 dual temps
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

// Map widget names to actual cell dimensions from app.json
export const getActualDimensions = (widgetName: string): WidgetDimensions => {
  const dimensions: Record<string, WidgetDimensions> = {
    'WeatherCompact': {
      width: 1,
      height: 1,        // True 1x1 (90dp x 90dp)
      minWidth: '90dp',
      minHeight: '90dp'
    },
    'WeatherStandard': {
      width: 1,
      height: 2,        // True 1x2 (90dp x 180dp)
      minWidth: '90dp',
      minHeight: '180dp'
    },
    'WeatherExtended': {
      width: 2,
      height: 2,        // True 2x2 (180dp x 180dp)
      minWidth: '180dp',
      minHeight: '180dp'
    }
  };
  
  return dimensions[widgetName] || {
    width: 1,
    height: 1,
    minWidth: '90dp',
    minHeight: '90dp'
  };
};

// Calculate optimal font sizes based on actual widget dimensions
export const calculateOptimalFontSize = (widgetName: string, contentType: 'primary-temp' | 'secondary-temp' | 'slash' | 'temp' | 'location' | 'text' | 'small-text'): number => {
  const dims = getActualDimensions(widgetName);
  const gridSize = `${dims.width}x${dims.height}`;
  
  const fontSizes: Record<string, Record<string, number>> = {
    // Temperature font sizes optimized for space constraints
    'primary-temp': {
      '1x1': 16,    // Largest possible for dual temp primary
      '1x2': 18,    // Medium size for dual temp
      '2x2': 20      // Large size available
    },
    'secondary-temp': {
      '1x1': 12,    // Smaller for supporting temp
      '1x2': 14,    // Medium size
      '2x2': 16      // Medium-large size
    },
    'slash': {
      '1x1': 10,     // Small separator
      '1x2': 12,     // Medium separator
      '2x2': 14       // Medium-large separator
    },
    // Legacy compatibility
    'temp': { compact: 20, standard: 32, extended: 40 },
    'location': { compact: 9, standard: 12, extended: 14 },
    'text': { compact: 10, standard: 12, extended: 14 },
    'small-text': { compact: 8, standard: 10, extended: 11 }
  };
  
  return fontSizes[contentType]?.[gridSize] || 12;
};

export const getLayoutConfig = (size: WidgetSize): LayoutConfig => ({
  fonts: {
    temp: { compact: 20, standard: 32, extended: 40 }[size],
    location: { compact: 9, standard: 12, extended: 14 }[size],
    text: { compact: 10, standard: 12, extended: 14 }[size],
    metrics: { compact: 9, standard: 11, extended: 12 }[size],
    smallText: { compact: 8, standard: 10, extended: 11 }[size],
    // New optimized font sizes for stacked temperature layout
    primaryTemp: { compact: 16, standard: 18, extended: 20 }[size],
    secondaryTemp: { compact: 12, standard: 14, extended: 16 }[size],
    slash: { compact: 10, standard: 12, extended: 14 }[size],
  },
  spacing: {
    padding: { compact: 8, standard: 12, extended: 16 }[size],
    margin: { compact: 4, standard: 8, extended: 12 }[size],
    small: { compact: 2, standard: 4, extended: 6 }[size],
    large: { compact: 8, standard: 16, extended: 24 }[size],
    // New minimal spacing for 1x1 to maximize dual temp space
    minimalPadding: { compact: 4, standard: 8, extended: 12 }[size],
  },
  colors: {
    background: '#3621dcff', // palette.primaryColor
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