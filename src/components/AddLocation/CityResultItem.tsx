import React from 'react';
import { TouchableOpacity, View, Text } from 'react-native';
import type { CityResult } from '../../utils/geocoding';
import { styles } from './CityResultItem.styles';

interface CityResultItemProps {
  city: CityResult;
  onPress: (city: CityResult) => void;
}

export const CityResultItem: React.FC<CityResultItemProps> = ({ city, onPress }) => {
  return (
    <TouchableOpacity
      style={styles.cityItem}
      onPress={() => onPress(city)}
    >
      <View style={styles.cityInfo}>
        <Text style={styles.cityName}>{city.name}</Text>
        <Text style={styles.cityDetails}>
          {city.state ? `${city.state}, ` : ""}
          {city.country}
        </Text>
      </View>
      <Text style={styles.addIcon}>+</Text>
    </TouchableOpacity>
  );
};
