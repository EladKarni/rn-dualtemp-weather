/**
 * Worker J — widget emoji icon map. The map is now a single module-scoped source
 * (WEATHER_ICON_MAP) shared by getWeatherIcon() and the widget WeatherIcon
 * component. This locks the three-step lookup fallback chain:
 *   1. exact condition-code match
 *   2. category base code (floor(id/100) * 100)
 *   3. generic '🌤️'
 */
import { getWeatherIcon, WEATHER_ICON_MAP } from "../widgetDataUtils";

describe("getWeatherIcon — lookup fallback chain", () => {
  it("returns the exact icon for a known condition code", () => {
    expect(getWeatherIcon(800)).toBe("☀️");
    expect(getWeatherIcon(501)).toBe("🌧️");
    expect(getWeatherIcon(602)).toBe("❄️");
    expect(getWeatherIcon(200)).toBe("⛈️");
  });

  it("falls back to the category base code when the exact code is unmapped", () => {
    // 511 (freezing rain) isn't mapped → floor(511/100)*100 = 500 → 🌦️
    expect(getWeatherIcon(511)).toBe(WEATHER_ICON_MAP[500]);
    expect(getWeatherIcon(511)).toBe("🌦️");
    // 899 → 800 (clear) → ☀️
    expect(getWeatherIcon(899)).toBe("☀️");
    // 250 → 200 (thunderstorm) → ⛈️
    expect(getWeatherIcon(250)).toBe("⛈️");
    // 650 → 600 (snow) → 🌨️
    expect(getWeatherIcon(650)).toBe("🌨️");
  });

  it("falls back to the generic icon when neither the code nor its category is mapped", () => {
    expect(getWeatherIcon(900)).toBe("🌤️");
    expect(getWeatherIcon(999)).toBe("🌤️");
    expect(getWeatherIcon(100)).toBe("🌤️");
    expect(getWeatherIcon(0)).toBe("🌤️");
  });

  it("exposes the map as the single source of truth", () => {
    expect(WEATHER_ICON_MAP[800]).toBe("☀️");
    expect(WEATHER_ICON_MAP[804]).toBe("☁️");
  });
});
