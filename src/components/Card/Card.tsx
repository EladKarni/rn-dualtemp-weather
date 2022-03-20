import React, { Children } from 'react'
import { View, Text } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { styles } from './Card.Styles'
import { palette } from '../../Styles/Palette'
import CardHeader from '../CardHeader/CardHeader'
import CardFooter from '../CardFooter/CardFooter'

type CardPropTypes = {
  // w?: number;
  // h?: number;
  // br?: number;
  // m?: number;
  // pv: number;
  // ph: number;
  cardType: string;
  children: React.ReactNode;
};

const Card = ({ cardType, children }: CardPropTypes) => {

  const applyCardTypeStyling = () => {
    switch (cardType) {
      case 'main':
        return styles.cardMain;

      case 'hourly':
        return styles.cardHourly;

      case 'daily':
        return styles.cardDaily;

      default:
        return styles.cardMain;

    }
  }

  return (
    <LinearGradient
      colors={[
        palette.blueLight,
        palette.blue
      ]}
      style={[styles.card, applyCardTypeStyling()]}
    >
      {children}
    </LinearGradient>
  )
}

export default Card