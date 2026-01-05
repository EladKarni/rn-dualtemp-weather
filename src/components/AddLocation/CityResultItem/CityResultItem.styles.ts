import { StyleSheet } from 'react-native';
import { palette } from '../../../Styles/Palette';
import { spacing } from '../../../Styles/Spacing';

export const styles = StyleSheet.create({
  cityItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: palette.primaryLight,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(74, 144, 226, 0.2)",
  },
  cityInfo: {
    flex: 1,
  },
  cityName: {
    fontSize: 16,
    fontWeight: "600",
    color: palette.textColor,
    marginBottom: 4,
  },
  cityDetails: {
    fontSize: 14,
    color: "#999",
  },
  addIcon: {
    fontSize: 28,
    color: palette.highlightColor,
    fontWeight: "300",
    marginLeft: spacing.sm,
  },
});
