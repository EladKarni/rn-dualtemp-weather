import React from "react";
import { LinearGradient } from "expo-linear-gradient";
import { palette } from "../../styles/Palette";
import { CardStyles } from "./Card.Styles";

type CardPropTypes = {
  cardType: CardStyleTypes;
  children: React.ReactNode;
};

export enum CardStyleTypes {
  MAIN = "cardMain",
  HOURLY = "cardHourly",
  HOURLYXL = "cardHourlyExpanded",
  DAILY = "cardDaily",
  DAILYXL = "cardDailyExpanded",
}

const Card = ({ cardType, children }: CardPropTypes) => {
  const colors =
    cardType === CardStyleTypes.DAILYXL
      ? ([palette.primaryColor, palette.primaryColor] as const)
      : cardType === CardStyleTypes.HOURLYXL
        ? ([palette.primaryLighter, palette.primaryLight] as const)
        : ([palette.primaryLight, palette.primaryColor] as const);

  return (
    <LinearGradient
      colors={colors}
      style={[CardStyles.card, CardStyles[cardType]]}
    >
      {children}
    </LinearGradient>
  );
};

export default Card;
