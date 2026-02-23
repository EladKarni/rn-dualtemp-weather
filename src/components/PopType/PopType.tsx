import { View, Text } from "react-native";
import React from "react";
import { PopTypeStyles } from "./PopTypeStyles.Styles";
import { convertPrecipitation } from "../../utils/temperature";

interface PopTypeProps {
  pop: number;
  percType?: string;
  precipAmount?: number;
  precipUnit?: "mm" | "in";
}

const PopType = ({ pop, percType, precipAmount, precipUnit = "mm" }: PopTypeProps) => {
  const hasAmount = precipAmount != null && precipAmount > 0;
  const showAmountLine = hasAmount || pop > 0;

  const formatAmount = () => {
    if (!hasAmount) {
      return precipUnit === "in" ? " < 0.1in" : " < 1mm";
    }
    const { value, unit } = convertPrecipitation(precipAmount, precipUnit);
    const formatted = value < 0.1 ? value.toFixed(2) : value.toFixed(1);
    return `${formatted}${unit}`;
  };

  const amountEmoji = percType === "❄" ? "🌨️" : "🌧️";

  return (
    <View style={PopTypeStyles.container}>
      <Text style={PopTypeStyles.PopStyles}>
        <Text>{percType}</Text>
        <Text>{`${(pop * 100).toFixed(0)}%`}</Text>
      </Text>
      {showAmountLine && (
        <Text style={PopTypeStyles.amountStyles}>
          <Text>{amountEmoji}</Text>
          <Text>{formatAmount()}</Text>
        </Text>
      )}
    </View>
  );
};

export default PopType;
