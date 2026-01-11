import { StyleSheet } from "react-native";
import { palette } from "../Palette";
import { spacing } from "../Spacing";

export const styles = StyleSheet.create({
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "90%",
    backgroundColor: palette.primaryDark,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.xl,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: palette.textColor,
  },
  closeButton: {
    padding: spacing.sm,
  },
  closeButtonText: {
    fontSize: 28,
    color: palette.textColor,
    fontWeight: "300",
  },
  searchInput: {
    backgroundColor: palette.primaryLight,
    borderRadius: 10,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: 16,
    color: palette.textColor,
    borderWidth: 1,
    borderColor: palette.highlightColor,
    marginBottom: spacing.sm,
  },
  errorBanner: {
    backgroundColor: "rgba(255, 69, 58, 0.1)",
    borderLeftWidth: 4,
    borderLeftColor: "#FF453A",
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.sm,
  },
  errorContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: spacing.sm,
  },
  errorIcon: {
    fontSize: 18,
    marginRight: spacing.sm,
  },
  errorMessage: {
    flex: 1,
    color: palette.textColor,
    fontSize: 14,
  },
  errorActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  retryButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    backgroundColor: palette.highlightColor,
    borderRadius: 6,
    marginRight: spacing.sm,
  },
  retryText: {
    color: palette.primaryDark,
    fontWeight: "600",
    fontSize: 13,
  },
  dismissButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  dismissText: {
    color: palette.textColor,
    fontSize: 18,
    fontWeight: "bold",
  },
  resultsContainer: {
    flex: 1,
  },
  listContent: {
    gap: spacing.sm,
  },
  loadingState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#999",
    marginTop: spacing.md,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
  },
});
