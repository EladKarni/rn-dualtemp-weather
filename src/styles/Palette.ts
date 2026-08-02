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
  // day rows, the compact content block). This is #1C1B4D — deliberately the
  // same value as `primaryDark` above, but written out rather than referenced,
  // because the contrast figures below were measured against this exact colour
  // and an unrelated tweak to the app's theme should not silently invalidate
  // them.
  //
  // OPAQUE on purpose. Any translucent fill composites against the user's
  // wallpaper, which makes legibility depend on something we don't control:
  // measured on device, this colour at 0.55 alpha gave the secondary text tier
  // (`textColorSecondary`, ~9-10px) a contrast ratio of 7.05 over a dark
  // wallpaper but only 2.98 over a light one — well under the 4.5 WCAG AA wants.
  // Fully opaque it is wallpaper-independent and lands at 6.19, with the large
  // white temperatures at 15.99.
  //
  // `widgetSurface` stays transparent, so the wallpaper still shows in the gaps
  // between elements — the widget keeps reading as part of the home screen even
  // though each element is solid.
  widgetElement: "rgba(28, 27, 77, 1)",
} as const;
