import React, { useContext } from "react";
import { LineChart } from "react-native-chart-kit";
import { palette } from "../../Styles/Palette";
import { AppStateContext } from "../../utils/AppStateContext";
import { celsiusToFahrenheit } from "../../utils/temperature";

const CHART_WIDTH_RATIO = 1.45;

type TemperatureChartProps = {
  feelsLike: {
    morn: number;
    day: number;
    eve: number;
    night: number;
  };
  cardWidth: number;
};

const TemperatureChart = ({ feelsLike, cardWidth }: TemperatureChartProps) => {
  const graphScale = ["🌅", "🌞", "🌆", "🌃"];
  const context = useContext(AppStateContext);
  const tempScale = context?.tempScale ?? "C";

  const chartStyle = {
    flex: 1,
    marginBottom: -5,
    marginLeft: cardWidth * -0.05,
    marginRight: cardWidth * 0.07,
    paddingRight: cardWidth * 0.15,
  };

  return (
    <LineChart
      data={{
        labels: graphScale,
        datasets: [
          {
            data: [feelsLike.morn, feelsLike.day, feelsLike.eve, feelsLike.night],
          },
        ],
      }}
      width={cardWidth / CHART_WIDTH_RATIO}
      height={196}
      withVerticalLines={false}
      yAxisSuffix="°"
      yAxisInterval={1}
      fromZero={false}
      formatYLabel={(temp) =>
        tempScale === "F"
          ? celsiusToFahrenheit(parseInt(temp)).toFixed(0).toString()
          : temp
      }
      chartConfig={{
        backgroundColor: "transparent",
        backgroundGradientTo: "white",
        backgroundGradientFromOpacity: 0,
        backgroundGradientFrom: "white",
        backgroundGradientToOpacity: 0,
        decimalPlaces: 0,
        color: (opacity = 1) => palette.textColor,
        labelColor: (opacity = 1) => palette.textColor,
        propsForDots: {
          r: "5",
          strokeWidth: "1",
          stroke: palette.textColor,
        },
      }}
      bezier
      style={chartStyle}
    />
  );
};

export default TemperatureChart;
