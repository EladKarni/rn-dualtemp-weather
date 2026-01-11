import WidgetKit
import SwiftUI

@main
struct WeatherWidgetBundle: WidgetBundle {
    var body: some Widget {
        WeatherCompactWidget()
        WeatherStandardWidget()
        WeatherExtendedWidget()
    }
}
