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
      // Default placement size (targetCellWidth/Height in app.json). Unlike the
      // others this one is resizable on BOTH axes, 2-5 cells, so these values
      // describe where it starts, not where it stays — anything that needs the
      // live size must read the width/height props instead.
      width: 3,
      height: 1,
      minWidth: '110dp',  // 2 cells
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
 * How much detail a daily-forecast row can carry at a given widget width.
 *
 * Each temperature is a two-line stack — the preferred scale over the other,
 * e.g. "31°C" over "87°F" — so a "reading" below means that block, not a line.
 *
 * - `wide`   day · icon · UV · "Hi" + reading · "Lo" + reading
 * - `full`   drops UV
 * - `medium` also drops the Hi/Lo labels
 * - `narrow` shows a single AVERAGE temperature instead of a high/low pair
 *
 * The icon survives every step: dropping the high/low pair frees far more room
 * than the icon occupies, and it is the most scannable thing in the row.
 *
 * Both temperature scales survive every step too — showing °C and °F together
 * is the point of the app, so it is the last thing that should go. At `narrow`
 * that means one dual-scale average rather than two cramped dual-scale pairs.
 *
 * UV is the last thing added rather than the first, because it is the only
 * element the row can lose without losing meaning: the labels say which
 * temperature is which, and the icon and day say what and when.
 */
export type DailyRowDensity = 'wide' | 'full' | 'medium' | 'narrow';

/**
 * Widget widths in dp, as the launcher MEASURES them (`widgetInfo.width`) —
 * not as app.json declares them.
 *
 * These are easy to conflate and the difference is large. `minWidth = 70n - 30`
 * sizes the *declaration*; what arrives at render time is whatever width the
 * launcher's grid actually gave the widget. Measured on device 2026-07-30
 * (Pixel launcher, 411dp screen): consecutive resize steps reported 179dp and
 * 276dp — roughly 97dp per cell, not 70. Thresholds derived from the
 * declaration formula therefore misclassify every size, so these come from what
 * each layout NEEDS instead.
 *
 * Budgets below are measured from rendered pixels, in dp. A stacked reading is
 * only as wide as its widest line, so 36dp covers even "100°F"; "Today" is 36dp
 * inside a 44dp column; the icon column is 26dp and UV 38dp; an "Hi "/"Lo "
 * label is 17dp; columns are 4dp apart; and the widget's own padding plus the
 * row's costs a flat 40dp.
 *
 *   narrow  44 + 26 + 36 + 8                + 40 = 154
 *   medium  44 + 26 + 36x2 + 12             + 40 = 194
 *   full    44 + 26 + (17 + 36)x2 + 12      + 40 = 228
 *   wide    44 + 26 + 38 + (17 + 36)x2 + 16 + 40 = 270
 *
 * The thresholds sit above those figures rather than on them, and the `wide`
 * one deliberately sits far above: 3 cells measured 276dp on the reference
 * device and app.json declares targetCellWidth 3, so 276dp is the size most
 * users get by default. Letting the wide threshold fall below it would put UV
 * in the default row, which is the one place it was explicitly not wanted.
 */
const DAILY_WIDTH_HIGH_LOW = 200;
const DAILY_WIDTH_LABELS = 235;
const DAILY_WIDTH_UV = 330;

/**
 * Pick a row density for the given widget width.
 *
 * `widthDp` is dp, not pixels — confirmed on device by rendering the raw value
 * the task handler passes in: a three-row widget reported 203, which only
 * resolves to three rows when read as dp.
 *
 * Undefined width falls to `narrow` rather than a roomier tier: an unknown
 * width must not assume space it may not have, because guessing too wide
 * overflows the row while guessing too narrow merely leaves space unused.
 */
export const calculateDailyRowDensity = (
  widthDp?: number
): DailyRowDensity => {
  if (widthDp === undefined) {
    return 'narrow';
  }
  if (widthDp >= DAILY_WIDTH_UV) {
    return 'wide';
  }
  if (widthDp >= DAILY_WIDTH_LABELS) {
    return 'full';
  }
  if (widthDp >= DAILY_WIDTH_HIGH_LOW) {
    return 'medium';
  }
  return 'narrow';
};

/**
 * Calculate optimal gap between items based on item count
 * More items = tighter gaps to maximize space
 */
export const getItemSpacing = (itemCount: number): number => {
  return itemCount === 1 ? 0 : itemCount <= 2 ? 4 : 6;
};

/**
 * Calculate how many daily forecast items fit in the given height.
 *
 * The widget root is measured with MeasureSpec.EXACTLY and drawn into a bitmap:
 * there is no scrolling and no overflow warning, so asking for one row too many
 * does not fail loudly — the rows quietly shrink below their natural height and
 * the bottom of each one is cut off. This function is the only thing standing
 * between the widget and that, so its two constants have to stay honest.
 *
 * MIN_ITEM_HEIGHT tracks the daily row's natural height, which is set by the
 * tallest thing in it — since the readings became two stacked lines, that is the
 * reading: two lines of 13dp type is ~34dp, plus the row card's 8dp padding top
 * and bottom, so 50dp. It is NOT independent of WeatherExtended's `tempSize`;
 * raising that raises this.
 *
 * ITEM_GAP is 2x the flexGap, not 1x, because the row container uses
 * `justifyContent: "space-between"` and this renderer implements that by
 * injecting an invisible weighted child between every pair of rows — so each
 * visible gap is TWO dividers with a phantom row between them, and n rows cost
 * 2n-2 dividers rather than n-1.
 *
 * @param heightPx - Widget height in dp, already net of anything drawn below
 *   the list (the stale-data indicator) — see WeatherExtended.
 * @param maxItems - Maximum items to show (default: 7 for full week)
 * @returns Number of items that fit (1-7)
 */
export const calculateDailyItemCount = (heightPx: number, maxItems: number = 7): number => {
  const MIN_ITEM_HEIGHT = 50;   // Two stacked 13dp lines (~34dp) + 8dp padding x2
  const CONTAINER_PADDING = 12 * 2; // 12dp padding top/bottom
  const ITEM_GAP = 12;          // 6dp flexGap x 2 dividers per visible gap

  // Calculate available height for items (no header/footer in new design)
  const availableHeight = heightPx - CONTAINER_PADDING;

  // Calculate how many items fit
  const itemCount = Math.floor((availableHeight + ITEM_GAP) / (MIN_ITEM_HEIGHT + ITEM_GAP));

  // Clamp between 1 and maxItems
  return Math.max(1, Math.min(itemCount, maxItems));
};

/**
 * Height, in dp, that the stale-data indicator takes below the daily list.
 *
 * It is a 9dp line with a 4dp top margin, and it only renders when the data is
 * over 30 minutes old — which is why it is easy to miss: the widget looks right
 * on a fresh emulator and clips its bottom row hours later, in the field, where
 * it reads as a flake rather than a layout bug. Subtract it from the height
 * handed to calculateDailyItemCount whenever it is showing.
 */
export const DAILY_AGE_INDICATOR_HEIGHT = 16;