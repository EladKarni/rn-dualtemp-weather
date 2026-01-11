export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const modalSpacing = {
  horizontal: spacing.xl,  // 20px - single source of truth
  vertical: spacing.lg,
  headerBottom: spacing.md,
  contentTop: spacing.sm,
} as const;

export const errorSpacing = {
  height: 64,  // Fixed height to prevent layout shifts
  marginTop: spacing.sm,
} as const;
