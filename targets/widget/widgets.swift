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
    let hourlyForecast: [HourlyForecast]
    let dailyForecast: [DailyForecast]
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

func getWeatherIcon(weatherId: Int) -> String {
    switch weatherId {
    case 800: return "☀️"
    case 801: return "⛅"
    case 802...804: return "☁️"
    case 500...504: return "🌧️"
    case 300...321: return "🌦️"
    case 200...232: return "⛈️"
    case 600...602: return "🌨️"
    case 611...622: return "❄️"
    case 701...781: return "🌫️"
    default: return "🌤️"
    }
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
        let entry = WeatherEntry(date: Date(), weatherData: getWeatherData())
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<WeatherEntry>) -> Void) {
        let currentDate = Date()
        let weatherData = getWeatherData()

        // Create entries for the next 30 minutes (matching Android refresh cycle)
        var entries: [WeatherEntry] = []
        for minuteOffset in stride(from: 0, to: 30, by: 15) {
            let entryDate = Calendar.current.date(byAdding: .minute, value: minuteOffset, to: currentDate)!
            entries.append(WeatherEntry(date: entryDate, weatherData: weatherData))
        }

        // Refresh after 30 minutes
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 30, to: currentDate)!
        let timeline = Timeline(entries: entries, policy: .after(nextUpdate))
        completion(timeline)
    }
}

// MARK: - Shared Colors

struct WidgetColors {
    static let background = Color(red: 0.11, green: 0.106, blue: 0.302) // #1C1B4D
    static let textPrimary = Color.white
    static let textSecondary = Color.white.opacity(0.7)
    static let highlight = Color(red: 0.29, green: 0.565, blue: 0.886) // #4A90E2
    static let cardBackground = Color.white.opacity(0.1)
}

// MARK: - Placeholder View

struct PlaceholderView: View {
    var body: some View {
        VStack {
            Text("--°")
                .font(.title2)
                .fontWeight(.bold)
                .foregroundColor(WidgetColors.textPrimary)
            Text("🌤️")
                .font(.title3)
            Text("Loading...")
                .font(.caption2)
                .foregroundColor(WidgetColors.textSecondary)
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
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .background(WidgetColors.background)
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

    var body: some View {
        let temps = formatDualTemp(tempCelsius: forecast.temp, primaryScale: tempScale)
        let time = Date(timeIntervalSince1970: TimeInterval(forecast.dt))
        let timeFormatter: DateFormatter = {
            let f = DateFormatter()
            f.dateFormat = "HH:mm"
            return f
        }()

        VStack(spacing: 2) {
            Text(timeFormatter.string(from: time))
                .font(.system(size: 10))
                .foregroundColor(WidgetColors.highlight)

            Text("💧\(Int(forecast.pop * 100))%")
                .font(.system(size: 9))
                .foregroundColor(WidgetColors.textSecondary)

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
            VStack(spacing: 4) {
                // Hourly forecast row
                HStack(spacing: 4) {
                    ForEach(weather.hourlyForecast.prefix(4), id: \.dt) { forecast in
                        HourlyItemView(forecast: forecast, tempScale: weather.tempScale)
                    }
                }

            }
            .padding(8)
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .background(WidgetColors.background)
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

    var body: some View {
        let highTemps = formatDualTemp(tempCelsius: forecast.tempMax, primaryScale: tempScale)
        let lowTemps = formatDualTemp(tempCelsius: forecast.tempMin, primaryScale: tempScale)
        let date = Date(timeIntervalSince1970: TimeInterval(forecast.dt))
        let dayFormatter: DateFormatter = {
            let f = DateFormatter()
            f.dateFormat = "EEE"
            return f
        }()

        HStack {
            Text(isToday ? "Today" : dayFormatter.string(from: date))
                .font(.system(size: 14, weight: .semibold))
                .foregroundColor(WidgetColors.textPrimary)
                .frame(width: 50, alignment: .leading)

            Text(getWeatherIcon(weatherId: forecast.weatherId))
                .font(.system(size: 16))

            Spacer()

            HStack(spacing: 2) {
                Text("Hi")
                    .font(.system(size: 11))
                    .foregroundColor(WidgetColors.highlight)
                Text("\(highTemps.primary) / \(highTemps.secondary)")
                    .font(.system(size: 11))
                    .foregroundColor(WidgetColors.textPrimary)
            }

            Spacer()

            HStack(spacing: 2) {
                Text("Lo")
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

struct WeatherExtendedView: View {
    let entry: WeatherEntry
    @Environment(\.widgetFamily) var family

    var body: some View {
        if let weather = entry.weatherData {
            VStack(spacing: 4) {
                ForEach(Array(weather.dailyForecast.prefix(family == .systemLarge ? 5 : 3).enumerated()), id: \.element.dt) { index, forecast in
                    DailyItemView(
                        forecast: forecast,
                        tempScale: weather.tempScale,
                        isToday: index == 0
                    )
                }
            }
            .padding(8)
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .background(WidgetColors.background)
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

// MARK: - Previews

@available(iOS 17.0, *)
#Preview("Compact", as: .systemSmall) {
    WeatherCompactWidget()
} timeline: {
    WeatherEntry(date: .now, weatherData: WeatherData(
        temp: 22,
        tempScale: "C",
        weatherId: 800,
        description: "Clear sky",
        humidity: 65,
        windSpeed: 5.5,
        windUnit: "m/s",
        locationName: "Tel Aviv",
        lastUpdated: "12:00",
        hourlyForecast: [],
        dailyForecast: []
    ))
}

@available(iOS 17.0, *)
#Preview("Standard", as: .systemMedium) {
    WeatherStandardWidget()
} timeline: {
    WeatherEntry(date: .now, weatherData: WeatherData(
        temp: 22,
        tempScale: "C",
        weatherId: 800,
        description: "Clear sky",
        humidity: 65,
        windSpeed: 5.5,
        windUnit: "m/s",
        locationName: "Tel Aviv",
        lastUpdated: "12:00",
        hourlyForecast: [
            HourlyForecast(dt: Int(Date().timeIntervalSince1970), temp: 22, weatherId: 800, pop: 0.1, windSpeed: 5),
            HourlyForecast(dt: Int(Date().timeIntervalSince1970) + 3600, temp: 24, weatherId: 801, pop: 0.2, windSpeed: 6),
            HourlyForecast(dt: Int(Date().timeIntervalSince1970) + 7200, temp: 25, weatherId: 802, pop: 0.3, windSpeed: 7),
            HourlyForecast(dt: Int(Date().timeIntervalSince1970) + 10800, temp: 23, weatherId: 800, pop: 0.1, windSpeed: 5)
        ],
        dailyForecast: []
    ))
}

@available(iOS 17.0, *)
#Preview("Extended", as: .systemLarge) {
    WeatherExtendedWidget()
} timeline: {
    WeatherEntry(date: .now, weatherData: WeatherData(
        temp: 22,
        tempScale: "C",
        weatherId: 800,
        description: "Clear sky",
        humidity: 65,
        windSpeed: 5.5,
        windUnit: "m/s",
        locationName: "Tel Aviv",
        lastUpdated: "12:00",
        hourlyForecast: [],
        dailyForecast: [
            DailyForecast(dt: Int(Date().timeIntervalSince1970), tempMax: 28, tempMin: 18, weatherId: 800),
            DailyForecast(dt: Int(Date().timeIntervalSince1970) + 86400, tempMax: 27, tempMin: 17, weatherId: 801),
            DailyForecast(dt: Int(Date().timeIntervalSince1970) + 172800, tempMax: 25, tempMin: 16, weatherId: 802),
            DailyForecast(dt: Int(Date().timeIntervalSince1970) + 259200, tempMax: 24, tempMin: 15, weatherId: 500),
            DailyForecast(dt: Int(Date().timeIntervalSince1970) + 345600, tempMax: 26, tempMin: 17, weatherId: 800)
        ]
    ))
}
