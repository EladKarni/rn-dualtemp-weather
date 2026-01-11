import React from 'react';
import { FlatList } from 'react-native';
import type { CityResult } from '../../../utils/geocoding';
import { styles } from './ResultsList.styles';
import { CityResultItem } from '../CityResultItem/CityResultItem';

interface ResultsListProps {
  results: CityResult[];
  onCitySelect: (city: CityResult) => void;
}

export const ResultsList: React.FC<ResultsListProps> = ({ results, onCitySelect }) => {
  return (
    <FlatList
      data={results}
      renderItem={({ item }) => (
        <CityResultItem city={item} onPress={onCitySelect} />
      )}
      keyExtractor={(item, index) => `${item.name}-${item.country}-${index}`}
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={true}
    />
  );
};
