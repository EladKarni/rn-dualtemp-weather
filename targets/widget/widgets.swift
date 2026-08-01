import WidgetKit
import SwiftUI

// MARK: - iOS Version Compatibility

extension View {
    @ViewBuilder
    func widgetBackground(_ color: Color) -> some View {
        if #available(iOS 17.0, *) {
            self.containerBackground(color, for: .widget)
        } else {
            self.background(color)
        }
    }
}

// MARK: - Shared Data Model

/// Localized chrome strings written by the app (src/widgets/utils/iosWidgetStorage.ts).
/// The age strings are i18n templates whose "%{count}" placeholder is filled here,
/// because data age is computed at render time.
struct WidgetChrome: Codable {
    let today: String
    let hi: String
    let lo: String
    let ageMinutes: String
    let ageHours: String
    let ageDays: String
}

let defaultChrome = WidgetChrome(
    today: "Today",
    hi: "Hi",
    lo: "Lo",
    ageMinutes: "%{count}m ago",
    ageHours: "%{count}h ago",
    ageDays: "%{count}d ago"
)

struct WeatherData: Codable {
    let temp: Double
    let tempScale: String // "C" or "F"
    let weatherId: Int
    let description: String
    let humidity: Int
    let windSpeed: Double
    let windUnit: String
    let locationName: String
    let lastUpdated: String
    let lastUpdatedTimestamp: Int?  // Optional for backward compatibility
    let hourlyForecast: [HourlyForecast]
    let dailyForecast: [DailyForecast]
    // v2 payload fields — all optional so a stale v1 payload (written by an
    // older app build) still decodes and renders with English defaults.
    let schemaVersion: Int?
    let locale: String?     // App language (en/es/fr/ar/he/zh), not device language
    let is24Hour: Bool?     // Clock-format setting with "auto" already resolved
    let chrome: WidgetChrome?
}

extension WeatherData {
    var resolvedChrome: WidgetChrome { chrome ?? defaultChrome }
    var resolvedLocale: Locale { Locale(identifier: locale ?? "en") }
    // v1 payloads always rendered 24-hour time; keep that until the app rewrites.
    var resolvedIs24Hour: Bool { is24Hour ?? true }
    // v1 hourly windSpeed is in m/s with no per-hour unit — only v2 can label it.
    var hasConvertedHourlyWind: Bool { (schemaVersion ?? 1) >= 2 }
    var isRTL: Bool { ["he", "ar"].contains(locale ?? "en") }
}

struct HourlyForecast: Codable {
    let dt: Int
    let temp: Double
    let weatherId: Int
    let pop: Double
    let windSpeed: Double
}

struct DailyForecast: Codable {
    let dt: Int
    let tempMax: Double
    let tempMin: Double
    let weatherId: Int
}

// MARK: - App Group Data Access

let appGroupId = "group.com.ekarni.rndualtempweatherapp.widget"

func getWeatherData() -> WeatherData? {
    guard let defaults = UserDefaults(suiteName: appGroupId) else { return nil }
    guard let jsonString = defaults.string(forKey: "weatherData") else { return nil }
    guard let data = jsonString.data(using: .utf8) else { return nil }

    do {
        return try JSONDecoder().decode(WeatherData.self, from: data)
    } catch {
        print("Failed to decode weather data: \(error)")
        return nil
    }
}

// MARK: - Weather Icon Mapping

/// Weather-condition icons keyed by OpenWeather condition id.
///
/// Mirrors WEATHER_ICON_MAP in src/widgets/utils/widgetDataUtils.ts entry for
/// entry; iosWidgetParity.test.ts diffs the two on every gate run, on Linux,
/// without a Swift compiler.
///
/// This was a handful of Swift ranges, which read as equivalent to the JS table
/// but were not. Ranges cannot express a table whose adjacent entries differ,
/// and this one's do: 500 (light rain) is a sun-and-rain icon while 501-504 are
/// heavy rain; the snow family alternates between snow and ice at 602, 611-613
/// and 620-622; and the tornado codes 731, 761, 762 and 771 sit interleaved
/// with fog codes in the 7xx block. Every one of those landed on the wrong icon
/// — a tornado warning rendered as fog on iPhone while Android showed 🌪️.
let weatherIconMap: [Int: String] = [
    // Clear sky
    800: "☀️",
    // Few clouds
    801: "⛅",
    // Scattered / broken / overcast clouds
    802: "☁️",
    803: "☁️",
    804: "☁️",
    // Rain — 500 is light rain and deliberately differs from its neighbours
    500: "🌦️",
    501: "🌧️",
    502: "🌧️",
    503: "🌧️",
    504: "🌧️",
    // Drizzle
    300: "🌦️",
    301: "🌦️",
    302: "🌦️",
    313: "🌦️",
    314: "🌦️",
    321: "🌦️",
    // Thunderstorm
    200: "⛈️",
    201: "⛈️",
    202: "⛈️",
    210: "⛈️",
    211: "⛈️",
    212: "⛈️",
    221: "⛈️",
    230: "⛈️",
    231: "⛈️",
    232: "⛈️",
    // Snow — snow vs ice alternates, it is not a contiguous run
    600: "🌨️",
    601: "🌨️",
    602: "❄️",
    611: "🌨️",
    612: "🌨️",
    613: "🌨️",
    615: "❄️",
    616: "❄️",
    620: "🌨️",
    621: "🌨️",
    622: "❄️",
    // Atmosphere — tornado codes are interleaved with the fog codes
    701: "🌫️",
    711: "🌫️",
    721: "🌫️",
    731: "🌪️",
    741: "🌫️",
    751: "🌫️",
    761: "🌪️",
    762: "🌪️",
    771: "🌪️",
]

/// Exact id, then the category's base icon (e.g. 5xx -> 500), then a generic
/// fallback — the same two-step chain as getWeatherIcon in widgetDataUtils.ts.
func getWeatherIcon(weatherId: Int) -> String {
    if let exact = weatherIconMap[weatherId] {
        return exact
    }
    if let category = weatherIconMap[(weatherId / 100) * 100] {
        return category
    }
    return "🌤️"
}

// MARK: - Temperature Helpers

func celsiusToFahrenheit(_ celsius: Double) -> Double {
    return celsius * 9.0 / 5.0 + 32.0
}

func formatDualTemp(tempCelsius: Double, primaryScale: String) -> (primary: String, secondary: String) {
    let celsius = Int(round(tempCelsius))
    let fahrenheit = Int(round(celsiusToFahrenheit(tempCelsius)))

    if primaryScale == "F" {
        return ("\(fahrenheit)°F", "\(celsius)°C")
    } else {
        return ("\(celsius)°C", "\(fahrenheit)°F")
    }
}

// MARK: - Date Formatting

/// Mirrors the Android widget's formatTime: "HH:mm" for 24-hour, "h:mm a" for 12-hour,
/// in the app's language (not the device language, which may differ).
func makeTimeFormatter(locale: Locale, is24Hour: Bool) -> DateFormatter {
    let f = DateFormatter()
    f.locale = locale
    f.dateFormat = is24Hour ? "HH:mm" : "h:mm a"
    return f
}

/// Mirrors the Android widget's moment("ddd") day label in the app's language.
func makeDayFormatter(locale: Locale) -> DateFormatter {
    let f = DateFormatter()
    f.locale = locale
    f.dateFormat = "EEE"
    return f
}

// MARK: - Age Calculation

func fillCount(_ template: String, _ n: Int) -> String {
    return template.replacingOccurrences(of: "%{count}", with: String(n))
}

/**
 * Calculate data age and return a localized string.
 * Contract matches the Android widget's formatDataAge:
 * < 30 min fresh (nil), then Xm / Xh / Xd ago.
 */
func calculateDataAge(timestamp: Int, chrome: WidgetChrome) -> String? {
    let now = Date().timeIntervalSince1970
    let ageMinutes = Int((now - Double(timestamp)) / 60)

    // Don't show age if fresh (< 30 min)
    if ageMinutes < 30 { return nil }

    if ageMinutes < 60 { return fillCount(chrome.ageMinutes, ageMinutes) }
    let hours = ageMinutes / 60
    if hours < 24 { return fillCount(chrome.ageHours, hours) }
    return fillCount(chrome.ageDays, hours / 24)
}

// MARK: - Timeline Entry

struct WeatherEntry: TimelineEntry {
    let date: Date
    let weatherData: WeatherData?
}

// MARK: - Timeline Provider

struct WeatherProvider: TimelineProvider {
    func placeholder(in context: Context) -> WeatherEntry {
        WeatherEntry(date: Date(), weatherData: nil)
    }

    func getSnapshot(in context: Context, completion: @escaping (WeatherEntry) -> Void) {
        // Gallery browsing calls getSnapshot with isPreview, and a fresh install
        // has no payload yet — show fixtures there; real data still wins.
        let data = getWeatherData()
        if data == nil, context.isPreview {
            completion(WeatherEntry(date: Date(), weatherData: previewWeatherData()))
            return
        }
        completion(WeatherEntry(date: Date(), weatherData: data))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<WeatherEntry>) -> Void) {
        // The data doesn't change until the app (or its background task) rewrites
        // the App Group payload, so a single entry refreshed every 30 minutes
        // (matching the Android cycle) is sufficient.
        let currentDate = Date()
        let entry = WeatherEntry(date: currentDate, weatherData: getWeatherData())
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 30, to: currentDate)!
        completion(Timeline(entries: [entry], policy: .after(nextUpdate)))
    }
}

// MARK: - Shared Colors

struct WidgetColors {
    static let background = Color(red: 0.11, green: 0.106, blue: 0.302) // #1C1B4D
    static let textPrimary = Color.white
    static let textSecondary = Color.white.opacity(0.7)
    static let highlight = Color(red: 0.29, green: 0.565, blue: 0.886) // #4A90E2
    static let cardBackground = Color.white.opacity(0.1)
    static let ageText = Color(red: 0.61, green: 0.64, blue: 0.69) // #9CA3AF
}

// MARK: - Placeholder View

struct PlaceholderView: View {
    var body: some View {
        // No text: the placeholder renders before any payload exists, so there is
        // no locale to localize copy into.
        VStack(spacing: 4) {
            Text("--°")
                .font(.title2)
                .fontWeight(.bold)
                .foregroundColor(WidgetColors.textPrimary)
            Text("🌤️")
                .font(.title3)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(WidgetColors.background)
    }
}

// MARK: - WeatherCompact Widget (Small - 1x1)

struct WeatherCompactView: View {
    let entry: WeatherEntry

    var body: some View {
        if let weather = entry.weatherData {
            let temps = formatDualTemp(tempCelsius: weather.temp, primaryScale: weather.tempScale)
            let ageText = weather.lastUpdatedTimestamp.flatMap {
                calculateDataAge(timestamp: $0, chrome: weather.resolvedChrome)
            }

            VStack(spacing: 2) {
                Text(temps.primary)
                    .font(.system(size: 22, weight: .bold))
                    .foregroundColor(WidgetColors.textPrimary)
                    .minimumScaleFactor(0.6)

                Text(getWeatherIcon(weatherId: weather.weatherId))
                    .font(.system(size: 20))

                Text(temps.secondary)
                    .font(.system(size: 14))
                    .foregroundColor(WidgetColors.highlight)
                    .minimumScaleFactor(0.6)

                // Age indicator (only if stale)
                if let ageText = ageText {
                    Text(ageText)
                        .font(.system(size: 9))
                        .foregroundColor(WidgetColors.ageText)
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .background(WidgetColors.background)
            .environment(\.layoutDirection, weather.isRTL ? .rightToLeft : .leftToRight)
        } else {
            PlaceholderView()
        }
    }
}

struct WeatherCompactWidget: Widget {
    let kind: String = "WeatherCompact"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: WeatherProvider()) { entry in
            WeatherCompactView(entry: entry)
                .widgetBackground(WidgetColors.background)
        }
        .configurationDisplayName("Weather (Compact)")
        .description("Essential weather info with dual temperature display")
        .supportedFamilies([.systemSmall])
    }
}

// MARK: - WeatherStandard Widget (Medium - 1x2)

struct HourlyItemView: View {
    let forecast: HourlyForecast
    let tempScale: String
    let windUnit: String
    let showWind: Bool
    let timeFormatter: DateFormatter

    var body: some View {
        let temps = formatDualTemp(tempCelsius: forecast.temp, primaryScale: tempScale)
        let time = Date(timeIntervalSince1970: TimeInterval(forecast.dt))

        VStack(spacing: 2) {
            Text(timeFormatter.string(from: time))
                .font(.system(size: 10))
                .foregroundColor(WidgetColors.highlight)

            Text("💧\(Int(forecast.pop * 100))%")
                .font(.system(size: 9))
                .foregroundColor(WidgetColors.textSecondary)

            // Wind is only labeled correctly by v2 payloads (converted units)
            if showWind {
                Text("\(Int(forecast.windSpeed.rounded()))\(windUnit)")
                    .font(.system(size: 9))
                    .foregroundColor(WidgetColors.textSecondary)
                    .minimumScaleFactor(0.7)
            }

            Text(getWeatherIcon(weatherId: forecast.weatherId))
                .font(.system(size: 16))

            Text(temps.primary)
                .font(.system(size: 11, weight: .semibold))
                .foregroundColor(WidgetColors.textPrimary)
                .minimumScaleFactor(0.7)

            Text(temps.secondary)
                .font(.system(size: 9))
                .foregroundColor(WidgetColors.textSecondary)
                .minimumScaleFactor(0.7)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .padding(4)
        .background(WidgetColors.cardBackground)
        .cornerRadius(8)
    }
}

struct WeatherStandardView: View {
    let entry: WeatherEntry

    var body: some View {
        if let weather = entry.weatherData {
            let ageText = weather.lastUpdatedTimestamp.flatMap {
                calculateDataAge(timestamp: $0, chrome: weather.resolvedChrome)
            }
            let timeFormatter = makeTimeFormatter(
                locale: weather.resolvedLocale,
                is24Hour: weather.resolvedIs24Hour
            )

            VStack(spacing: 4) {
                // Hourly forecast row
                HStack(spacing: 4) {
                    ForEach(weather.hourlyForecast.prefix(4), id: \.dt) { forecast in
                        HourlyItemView(
                            forecast: forecast,
                            tempScale: weather.tempScale,
                            windUnit: weather.windUnit,
                            showWind: weather.hasConvertedHourlyWind,
                            timeFormatter: timeFormatter
                        )
                    }
                }

                // Age indicator (only if stale)
                if let ageText = ageText {
                    Text(ageText)
                        .font(.system(size: 9))
                        .foregroundColor(WidgetColors.ageText)
                }
            }
            .padding(8)
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .background(WidgetColors.background)
            .environment(\.layoutDirection, weather.isRTL ? .rightToLeft : .leftToRight)
        } else {
            PlaceholderView()
        }
    }
}

struct WeatherStandardWidget: Widget {
    let kind: String = "WeatherStandard"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: WeatherProvider()) { entry in
            WeatherStandardView(entry: entry)
                .widgetBackground(WidgetColors.background)
        }
        .configurationDisplayName("Weather (Standard)")
        .description("Hourly forecast with dual temperature display")
        .supportedFamilies([.systemMedium])
    }
}

// MARK: - WeatherExtended Widget (Large - 3x1+)

struct DailyItemView: View {
    let forecast: DailyForecast
    let tempScale: String
    let isToday: Bool
    let chrome: WidgetChrome
    let dayFormatter: DateFormatter

    var body: some View {
        let highTemps = formatDualTemp(tempCelsius: forecast.tempMax, primaryScale: tempScale)
        let lowTemps = formatDualTemp(tempCelsius: forecast.tempMin, primaryScale: tempScale)
        let date = Date(timeIntervalSince1970: TimeInterval(forecast.dt))

        HStack {
            Text(isToday ? chrome.today : dayFormatter.string(from: date))
                .font(.system(size: 14, weight: .semibold))
                .foregroundColor(WidgetColors.textPrimary)
                .frame(width: 50, alignment: .leading)

            Text(getWeatherIcon(weatherId: forecast.weatherId))
                .font(.system(size: 16))

            Spacer()

            HStack(spacing: 2) {
                Text(chrome.hi)
                    .font(.system(size: 11))
                    .foregroundColor(WidgetColors.highlight)
                Text("\(highTemps.primary) / \(highTemps.secondary)")
                    .font(.system(size: 11))
                    .foregroundColor(WidgetColors.textPrimary)
            }

            Spacer()

            HStack(spacing: 2) {
                Text(chrome.lo)
                    .font(.system(size: 11))
                    .foregroundColor(WidgetColors.highlight)
                Text("\(lowTemps.primary) / \(lowTemps.secondary)")
                    .font(.system(size: 11))
                    .foregroundColor(WidgetColors.textPrimary)
            }
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 6)
        .background(WidgetColors.cardBackground)
        .cornerRadius(8)
    }
}

// Content is split from the widget-family switch so the screenshot harness
// (scripts/widget-screenshots) can render it at an explicit day count —
// \.widgetFamily is a read-only environment value and cannot be injected.
struct WeatherExtendedContent: View {
    let weather: WeatherData
    let dayCount: Int

    var body: some View {
        let ageText = weather.lastUpdatedTimestamp.flatMap {
            calculateDataAge(timestamp: $0, chrome: weather.resolvedChrome)
        }
        let dayFormatter = makeDayFormatter(locale: weather.resolvedLocale)

        VStack(spacing: 4) {
            ForEach(Array(weather.dailyForecast.prefix(dayCount).enumerated()), id: \.element.dt) { index, forecast in
                DailyItemView(
                    forecast: forecast,
                    tempScale: weather.tempScale,
                    isToday: index == 0,
                    chrome: weather.resolvedChrome,
                    dayFormatter: dayFormatter
                )
            }

            // Age indicator (only if stale)
            if let ageText = ageText {
                Text(ageText)
                    .font(.system(size: 9))
                    .foregroundColor(WidgetColors.ageText)
            }
        }
        .padding(8)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(WidgetColors.background)
        .environment(\.layoutDirection, weather.isRTL ? .rightToLeft : .leftToRight)
    }
}

struct WeatherExtendedView: View {
    let entry: WeatherEntry
    @Environment(\.widgetFamily) var family

    var body: some View {
        if let weather = entry.weatherData {
            WeatherExtendedContent(weather: weather, dayCount: family == .systemLarge ? 5 : 3)
        } else {
            PlaceholderView()
        }
    }
}

struct WeatherExtendedWidget: Widget {
    let kind: String = "WeatherExtended"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: WeatherProvider()) { entry in
            WeatherExtendedView(entry: entry)
                .widgetBackground(WidgetColors.background)
        }
        .configurationDisplayName("Weather (Extended)")
        .description("Daily forecast with dual temperature display")
        .supportedFamilies([.systemMedium, .systemLarge])
    }
}

// MARK: - Preview Fixtures

func previewHourlyForecast() -> [HourlyForecast] {
    let now = Int(Date().timeIntervalSince1970)
    return [
        HourlyForecast(dt: now, temp: 22, weatherId: 800, pop: 0.1, windSpeed: 18),
        HourlyForecast(dt: now + 3600, temp: 24, weatherId: 801, pop: 0.2, windSpeed: 22),
        HourlyForecast(dt: now + 7200, temp: 25, weatherId: 802, pop: 0.3, windSpeed: 25),
        HourlyForecast(dt: now + 10800, temp: 23, weatherId: 800, pop: 0.1, windSpeed: 18)
    ]
}

func previewDailyForecast() -> [DailyForecast] {
    let now = Int(Date().timeIntervalSince1970)
    return [
        DailyForecast(dt: now, tempMax: 28, tempMin: 18, weatherId: 800),
        DailyForecast(dt: now + 86400, tempMax: 27, tempMin: 17, weatherId: 801),
        DailyForecast(dt: now + 172800, tempMax: 25, tempMin: 16, weatherId: 802),
        DailyForecast(dt: now + 259200, tempMax: 24, tempMin: 15, weatherId: 500),
        DailyForecast(dt: now + 345600, tempMax: 26, tempMin: 17, weatherId: 800)
    ]
}

func previewWeatherData(
    hourlyForecast: [HourlyForecast] = previewHourlyForecast(),
    dailyForecast: [DailyForecast] = previewDailyForecast()
) -> WeatherData {
    WeatherData(
        temp: 22,
        tempScale: "C",
        weatherId: 800,
        description: "Clear sky",
        humidity: 65,
        windSpeed: 19.8,
        windUnit: "km/h",
        locationName: "Tel Aviv",
        lastUpdated: "12:00",
        lastUpdatedTimestamp: Int(Date().timeIntervalSince1970),
        hourlyForecast: hourlyForecast,
        dailyForecast: dailyForecast,
        schemaVersion: 2,
        locale: "en",
        is24Hour: false,
        chrome: defaultChrome
    )
}

// MARK: - Previews

@available(iOS 17.0, *)
#Preview("Compact", as: .systemSmall) {
    WeatherCompactWidget()
} timeline: {
    WeatherEntry(date: .now, weatherData: previewWeatherData())
}

@available(iOS 17.0, *)
#Preview("Standard", as: .systemMedium) {
    WeatherStandardWidget()
} timeline: {
    WeatherEntry(date: .now, weatherData: previewWeatherData())
}

@available(iOS 17.0, *)
#Preview("Extended", as: .systemLarge) {
    WeatherExtendedWidget()
} timeline: {
    WeatherEntry(date: .now, weatherData: previewWeatherData())
}
