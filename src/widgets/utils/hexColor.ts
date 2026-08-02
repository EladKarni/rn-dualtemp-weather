/**
 * Colour-string normalisation for the iOS widget payload.
 *
 * The widget themes are declared as `rgba(...)` because that is what
 * react-native-android-widget's ColorProp accepts, but SwiftUI has no rgba()
 * parser and the App Group payload is plain JSON. Rather than teach Swift to
 * parse CSS colour syntax — or duplicate the palette as a second hardcoded
 * table on the Swift side, which is exactly the drift the parity test exists to
 * prevent — the JS side normalises to `#RRGGBB` before writing.
 *
 * Opaque only, deliberately. src/styles/widgetThemes.ts documents why every
 * preset is opaque (a translucent fill composites against the user's wallpaper,
 * so contrast stops being something the app can guarantee), so an alpha channel
 * here would be a bug worth surfacing rather than silently encoding.
 */

const clampByte = (n: number): number => Math.max(0, Math.min(255, Math.round(n)));

const toHexPair = (n: number): string =>
  clampByte(n).toString(16).padStart(2, "0");

/**
 * Normalise a CSS colour string to uppercase `#RRGGBB`.
 *
 * Returns null for anything it cannot represent — a named colour, an unparsable
 * string, or a translucent one — so the caller decides the fallback rather than
 * having a wrong colour invented for it.
 */
export const toHexColor = (value: string | undefined | null): string | null => {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();

  const hex = trimmed.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) {
    const digits = hex[1];
    const expanded =
      digits.length === 3
        ? digits
            .split("")
            .map((d) => d + d)
            .join("")
        : digits;
    return `#${expanded.toUpperCase()}`;
  }

  // Signs are accepted so that clamping is total: without them "rgb(300,20,0)"
  // clamps but "rgb(-20,20,0)" fails to match and returns null, which is an
  // arbitrary difference between two equally out-of-range inputs.
  const rgb = trimmed.match(
    /^rgba?\(\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*(?:,\s*(-?[\d.]+)\s*)?\)$/i
  );
  if (!rgb) {
    return null;
  }

  const [, r, g, b, a] = rgb;
  // A translucent fill cannot be represented as #RRGGBB, and flattening it
  // would silently produce a colour the contrast test never checked.
  if (a !== undefined && Number(a) !== 1) {
    return null;
  }

  return `#${toHexPair(Number(r))}${toHexPair(Number(g))}${toHexPair(
    Number(b)
  )}`.toUpperCase();
};
