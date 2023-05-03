import React from 'react'
import { LinearGradient } from 'expo-linear-gradient'
import { palette } from '../../Styles/Palette'
import { CardStyles } from './Card.Styles';

type CardPropTypes = {
  cardType: CardStyleTypes;
  children: React.ReactNode;
};

export enum CardStyleTypes {
  MAIN = 'cardMain',
  HOURLY = 'cardHourly',
  DAILY = 'cardDaily',
  DAILYXL = 'cardDailyExpanded'
}

const Card = ({ cardType, children }: CardPropTypes) => {
  return (
    <LinearGradient
      colors={[
        palette.primaryLight,
        palette.primaryColor
      ]}
      style={[CardStyles.card, CardStyles[cardType]]}
    >
      {children}
    </LinearGradient>
  )
}

export default Card