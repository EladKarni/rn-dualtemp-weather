import React, { Children } from 'react'
import { View, Text } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { styles } from './Card.Styles'
import { palette } from '../../Styles/Palette'
import CardHeader from '../CardHeader/CardHeader'
import CardFooter from '../CardFooter/CardFooter'

type CardPropTypes = {
  date: string;
  children?: JSX.Element;
};

const Card = (props: CardPropTypes) => {
  return (
    <LinearGradient
      // Background Linear Gradient
      colors={[
        palette.blueLight,
        palette.blue
      ]}
      style={styles.card}
    >
      <CardHeader date={props.date} />
      {props.children}
      <CardFooter />
    </LinearGradient>
  )
}

export default Card