import { Text } from "react-native";
import React from "react";
import { PopTypeStyles } from "./PopTypeStyles.Styles";

interface PopTypeProps {
  pop: number;
  percType?: string;
}

const PopType = ({ pop, percType }: PopTypeProps) => {
  return (
    <Text style={PopTypeStyles.PopStyles}>
      <Text>{`${(pop * 100).toFixed(0)}%`}</Text>
      <Text>{percType}</Text>
    </Text>
  );
};

export default PopType;
