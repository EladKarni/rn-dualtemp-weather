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
      width: 3,
      height: 1,        // True 3x1 (270dp x 40dp) - expands vertically
      minWidth: '270dp',
      minHeight: '40dp'
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
      '2x2': 20,    // Large size available
      '3x2': 14      // Wide layout for daily forecast
    },
    'secondary-temp': {
      '1x1': 12,    // Smaller for supporting temp
      '1x2': 14,    // Medium size
      '2x2': 16,    // Medium-large size
      '3x2': 12      // Wide layout for daily forecast
    },
    'slash': {
      '1x1': 10,     // Small separator
      '1x2': 12,     // Medium separator
      '2x2': 14,     // Medium-large separator
      '3x2': 10       // Wide layout separator
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

/**
 * Calculate how many hourly forecast items can fit in the given width
 * Each item needs ~80-100px minimum + gaps between items
 * @param widthPx - Widget width in pixels
 * @param maxItems - Maximum items to show (default: 4)
 * @returns Number of items that fit (1-4)
 */
export const calculateHourlyItemCount = (widthPx: number, maxItems: number = 4): number => {
  // Constants based on HourlyItem component requirements
  const MIN_ITEM_WIDTH = 70;  // Minimum width per item including padding and spacing
  const ITEM_GAP = 8;          // Gap between items
  const CONTAINER_PADDING = 12 * 2; // 12px padding on each side

  // Calculate available width for items
  const availableWidth = widthPx - CONTAINER_PADDING;

  // Calculate how many items fit
  // Formula: (availableWidth + gap) / (itemWidth + gap)
  const itemCount = Math.floor((availableWidth + ITEM_GAP) / (MIN_ITEM_WIDTH + ITEM_GAP));

  // Clamp between 1 and maxItems
  return Math.max(1, Math.min(itemCount, maxItems));
};

/**
 * Calculate optimal gap between items based on item count
 * More items = tighter gaps to maximize space
 */
export const getItemSpacing = (itemCount: number): number => {
  return itemCount === 1 ? 0 : itemCount <= 2 ? 4 : 6;
};

/**
 * Calculate how many daily forecast items can fit in the given height
 * @param heightPx - Widget height in pixels (minimum 40dp for 3x1)
 * @param maxItems - Maximum items to show (default: 7 for full week)
 * @returns Number of items that fit (1-7)
 */
export const calculateDailyItemCount = (heightPx: number, maxItems: number = 7): number => {
  const MIN_ITEM_HEIGHT = 56;   // Height per daily item
  const CONTAINER_PADDING = 12 * 2; // 12px padding top/bottom
  const ITEM_GAP = 4;           // Minimal gap (space-evenly handles distribution)

  // Calculate available height for items (no header/footer in new design)
  const availableHeight = heightPx - CONTAINER_PADDING;

  // Calculate how many items fit
  const itemCount = Math.floor((availableHeight + ITEM_GAP) / (MIN_ITEM_HEIGHT + ITEM_GAP));

  console.log('[calculateDailyItemCount] heightPx:', heightPx, 'availableHeight:', availableHeight, 'itemCount:', itemCount, 'maxItems:', maxItems);

  // Clamp between 1 and maxItems
  return Math.max(1, Math.min(itemCount, maxItems));
};