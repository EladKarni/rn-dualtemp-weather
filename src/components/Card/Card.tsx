import React, { Children } from 'react'
import { View, Text } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { styles } from './Card.Styles'
import { palette } from '../../Styles/Palette'
import CardHeader from '../CardHeader/CardHeader'
import CardFooter from '../CardFooter/CardFooter'

type CardPropTypes = {
  date?: string;
  w?: number;
  h?: number;
  br?: number;
  m?: number;
  pv: number;
  ph: number
  children: JSX.Element;
};

const Card = ({ date, w, h, br, m, pv, ph, children }: CardPropTypes) => {
  return (
    <LinearGradient
      // Background Linear Gradient
      colors={[
        palette.blueLight,
        palette.blue
      ]}
      style={{ ...styles.card, width: w, height: h, borderRadius: br, marginHorizontal: m, paddingVertical: pv, paddingHorizontal: ph }}
    >
      {date ? <CardHeader date={date} /> : null}
      {children}
      {date ? <CardFooter /> : null}
    </LinearGradient>
  )
}

export default Card