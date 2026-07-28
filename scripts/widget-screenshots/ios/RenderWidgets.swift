// Renders the DualTemp iOS widget SwiftUI views to PNGs at exact WidgetKit
// dimensions, without a simulator or Springboard automation. This is the
// deterministic capture route chosen in plans/store-metadata-automation.md
// ("Widget screenshots"), and doubles as the visual check for the widget
// localization/clock-format fixes.
//
// macOS 14+ only (ImageRenderer + WidgetKit availability). Compiled together
// with targets/widget/widgets.swift by render.sh — run that, not this file.
import SwiftUI
import WidgetKit
import AppKit

@main
struct RenderWidgets {
    // iPhone 16 Pro Max (6.9-inch store size) widget dimensions in points,
    // rendered @3x: small 510×510, medium 1092×510, large 1092×1146 px.
    static let smallSize = CGSize(width: 170, height: 170)
    static let mediumSize = CGSize(width: 364, height: 170)
    static let largeSize = CGSize(width: 364, height: 382)
    static let scale: CGFloat = 3

    @MainActor
    static func main() throws {
        let outputPath = CommandLine.arguments.count > 1
            ? CommandLine.arguments[1]
            : "store/screenshots/widgets/ios"
        let outputDir = URL(fileURLWithPath: outputPath, isDirectory: true)
        try FileManager.default.createDirectory(at: outputDir, withIntermediateDirectories: true)

        let now = Int(Date().timeIntervalSince1970)

        func fixture(locale: String, is24Hour: Bool, chrome: WidgetChrome, location: String) -> WeatherData {
            WeatherData(
                temp: 22,
                tempScale: "C",
                weatherId: 800,
                description: "Clear sky",
                humidity: 65,
                windSpeed: 19.8,
                windUnit: "km/h",
                locationName: location,
                lastUpdated: "12:00",
                lastUpdatedTimestamp: now,
                hourlyForecast: [
                    HourlyForecast(dt: now, temp: 22, weatherId: 800, pop: 0.1, windSpeed: 18),
                    HourlyForecast(dt: now + 3600, temp: 24, weatherId: 801, pop: 0.2, windSpeed: 22),
                    HourlyForecast(dt: now + 7200, temp: 25, weatherId: 802, pop: 0.45, windSpeed: 25),
                    HourlyForecast(dt: now + 10800, temp: 23, weatherId: 500, pop: 0.6, windSpeed: 18),
                ],
                dailyForecast: [
                    DailyForecast(dt: now, tempMax: 28, tempMin: 18, weatherId: 800),
                    DailyForecast(dt: now + 86400, tempMax: 27, tempMin: 17, weatherId: 801),
                    DailyForecast(dt: now + 172_800, tempMax: 25, tempMin: 16, weatherId: 802),
                    DailyForecast(dt: now + 259_200, tempMax: 24, tempMin: 15, weatherId: 500),
                    DailyForecast(dt: now + 345_600, tempMax: 26, tempMin: 17, weatherId: 200),
                ],
                schemaVersion: 2,
                locale: locale,
                is24Hour: is24Hour,
                chrome: chrome
            )
        }

        // Values mirror src/localization/he.ts (Today / WidgetHi / WidgetLo / WidgetAge*).
        let heChrome = WidgetChrome(
            today: "היום",
            hi: "מקס",
            lo: "מינ",
            ageMinutes: "לפני %{count} ד׳",
            ageHours: "לפני %{count} ש׳",
            ageDays: "לפני %{count} י׳"
        )

        let variants: [(name: String, data: WeatherData)] = [
            ("en", fixture(locale: "en", is24Hour: false, chrome: defaultChrome, location: "New York")),
            ("he", fixture(locale: "he", is24Hour: true, chrome: heChrome, location: "תל אביב")),
        ]

        for (name, data) in variants {
            let entry = WeatherEntry(date: Date(), weatherData: data)
            try writePNG(WeatherCompactView(entry: entry), size: smallSize,
                         to: outputDir.appendingPathComponent("compact-\(name).png"))
            try writePNG(WeatherStandardView(entry: entry), size: mediumSize,
                         to: outputDir.appendingPathComponent("standard-\(name).png"))
            try writePNG(WeatherExtendedContent(weather: data, dayCount: 5), size: largeSize,
                         to: outputDir.appendingPathComponent("extended-\(name).png"))
        }
    }

    @MainActor
    static func writePNG<V: View>(_ view: V, size: CGSize, to url: URL) throws {
        let renderer = ImageRenderer(content: view.frame(width: size.width, height: size.height))
        renderer.scale = scale
        guard let cgImage = renderer.cgImage else {
            fatalError("ImageRenderer produced no image for \(url.lastPathComponent)")
        }
        let rep = NSBitmapImageRep(cgImage: cgImage)
        guard let png = rep.representation(using: .png, properties: [:]) else {
            fatalError("PNG encoding failed for \(url.lastPathComponent)")
        }
        try png.write(to: url)
        print("wrote \(url.path) (\(cgImage.width)×\(cgImage.height))")
    }
}
