export const palette = {
  textColor: "#fff",
  textColorSecondary: "#a19ad8ff",
  highlightColor: "#EAEAF3",
  primaryColor: "#3621dcff",
  primaryLight: "#6B58FFFF",
  primaryDark: "#1C1B4DFF",
  shadowLight: "#715EF5FF",
  // The outer surface of a home-screen widget — the area *between* its
  // elements. Transparent, so the user's wallpaper shows through and the widget
  // reads as part of the home screen rather than a card pasted onto it. Note
  // that a `borderRadius` on the root is inert while this is fully transparent;
  // it only takes effect if the surface is given opacity.
  widgetSurface: "rgba(0, 0, 0, 0)",
  // Fill for the individual elements inside a home-screen widget (hour columns,
  // day rows, the compact content block). A DARKENING scrim, unlike the
  // rgba(255,255,255,0.1) it replaces: that was a 10% white *lightening*
  // overlay, which read clearly against the old solid indigo widget card but
  // composites against the user's wallpaper once the widget root is
  // transparent — visible on a dark wallpaper, invisible on a light one.
  widgetElement: "rgba(0, 0, 0, 0.35)",
} as const;
