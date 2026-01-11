/**
 * RTL (Right-to-Left) style utilities
 * Centralizes RTL styling logic to eliminate duplication across components
 */

import { StyleProp, ViewStyle, TextStyle, FlexStyle } from 'react-native';

/**
 * Applies RTL-specific styles conditionally
 * @param baseStyle Base style to always apply
 * @param rtlStyle Style overrides for RTL languages
 * @param isRTL Whether RTL is active
 * @returns Combined style array
 */
export const applyRTLStyle = <T extends ViewStyle | TextStyle>(
  baseStyle: StyleProp<T>,
  rtlStyle: StyleProp<T>,
  isRTL: boolean
): StyleProp<T> => {
  if (isRTL) {
    return [baseStyle, rtlStyle];
  }
  return baseStyle;
};

/**
 * Returns appropriate flex direction based on RTL setting
 * @param isRTL Whether RTL is active
 * @returns 'row' for LTR, 'row-reverse' for RTL
 */
export const getFlexDirection = (isRTL: boolean): FlexStyle['flexDirection'] => {
  return isRTL ? 'row-reverse' : 'row';
};

/**
 * Returns appropriate text alignment based on RTL setting
 * @param isRTL Whether RTL is active
 * @returns 'left' for LTR, 'right' for RTL
 */
export const getTextAlign = (isRTL: boolean): TextStyle['textAlign'] => {
  return isRTL ? 'right' : 'left';
};

/**
 * Returns appropriate writing direction
 * @param isRTL Whether RTL is active
 * @returns 'rtl' or 'ltr'
 */
export const getWritingDirection = (isRTL: boolean): 'rtl' | 'ltr' => {
  return isRTL ? 'rtl' : 'ltr';
};

/**
 * Swaps left/right padding values for RTL
 * @param leftPadding Padding for left side (in LTR)
 * @param rightPadding Padding for right side (in LTR)
 * @param isRTL Whether RTL is active
 * @returns Object with paddingLeft and paddingRight
 */
export const getPaddingHorizontal = (
  leftPadding: number,
  rightPadding: number,
  isRTL: boolean
): { paddingLeft: number; paddingRight: number } => {
  if (isRTL) {
    return {
      paddingLeft: rightPadding,
      paddingRight: leftPadding,
    };
  }
  return {
    paddingLeft: leftPadding,
    paddingRight: rightPadding,
  };
};

/**
 * Swaps left/right margin values for RTL
 * @param leftMargin Margin for left side (in LTR)
 * @param rightMargin Margin for right side (in LTR)
 * @param isRTL Whether RTL is active
 * @returns Object with marginLeft and marginRight
 */
export const getMarginHorizontal = (
  leftMargin: number,
  rightMargin: number,
  isRTL: boolean
): { marginLeft: number; marginRight: number } => {
  if (isRTL) {
    return {
      marginLeft: rightMargin,
      marginRight: leftMargin,
    };
  }
  return {
    marginLeft: leftMargin,
    marginRight: rightMargin,
  };
};

/**
 * Flips a horizontal value for RTL (useful for transforms, positions)
 * @param value Value to flip
 * @param isRTL Whether RTL is active
 * @returns Original value for LTR, negated value for RTL
 */
export const flipHorizontal = (value: number, isRTL: boolean): number => {
  return isRTL ? -value : value;
};

/**
 * Creates a complete RTL-aware style object for flex containers
 * @param isRTL Whether RTL is active
 * @returns Style object with flexDirection set appropriately
 */
export const getRTLFlexStyle = (isRTL: boolean): Pick<ViewStyle, 'flexDirection'> => {
  return {
    flexDirection: getFlexDirection(isRTL),
  };
};

/**
 * Creates a complete RTL-aware style object for text
 * @param isRTL Whether RTL is active
 * @returns Style object with textAlign set appropriately
 */
export const getRTLTextStyle = (isRTL: boolean): Pick<TextStyle, 'textAlign'> => {
  return {
    textAlign: getTextAlign(isRTL),
  };
};
