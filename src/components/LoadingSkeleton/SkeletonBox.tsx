import React from "react";
import { View, StyleSheet, StyleProp, ViewStyle } from "react-native";
import { palette } from "../../styles/Palette";

interface SkeletonBoxProps {
  /** Size / shape overrides (height, width, borderRadius, margins, …). */
  style?: StyleProp<ViewStyle>;
}

/**
 * Single placeholder primitive for all loading skeletons. Provides the shared
 * palette-derived tint (textColor @ 15% opacity); callers pass dimensions via
 * `style`.
 */
export const SkeletonBox: React.FC<SkeletonBoxProps> = ({ style }) => (
  <View style={[styles.skeletonBox, style]} />
);

const styles = StyleSheet.create({
  skeletonBox: {
    backgroundColor: palette.textColor,
    opacity: 0.15,
    borderRadius: 4,
  },
});

export default SkeletonBox;
