import React from 'react';
import { View, Text, FlatList, ActivityIndicator } from 'react-native';
import type { CityResult } from '../../utils/geocoding';
import type { AppError } from '../../utils/errors';
import { i18n } from '../../localization/i18n';
import { ErrorBanner } from '../ErrorAlert/ErrorBanner';
import { CityResultItem } from './CityResultItem';
import { styles } from './AddLocationContent.styles';

interface AddLocationContentProps {
  searchQuery: string;
  isSearching: boolean;
  error: AppError | null;
  searchResults: CityResult[];
  onCitySelect: (city: CityResult) => void;
  onRetry: () => void;
  onDismissError: () => void;
}

export const AddLocationContent: React.FC<AddLocationContentProps> = ({
  searchQuery,
  isSearching,
  error,
  searchResults,
  onCitySelect,
  onRetry,
  onDismissError,
}) => {
  // Show empty state if search query is too short
  if (searchQuery.trim().length < 3) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateText}>{i18n.t("StartTyping")}</Text>
      </View>
    );
  }

  // Show loading indicator
  if (isSearching) {
    return (
      <View style={styles.emptyState}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.emptyStateText}>{i18n.t("Searching")}</Text>
      </View>
    );
  }

  // Show error banner
  if (error) {
    return (
      <ErrorBanner
        error={error}
        onRetry={onRetry}
        onDismiss={onDismissError}
      />
    );
  }

  // Show no results message
  if (searchResults.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateText}>{i18n.t("NoResults")}</Text>
      </View>
    );
  }

  // Show results list
  return (
    <FlatList
      data={searchResults}
      renderItem={({ item }) => (
        <CityResultItem city={item} onPress={onCitySelect} />
      )}
      keyExtractor={(item, index) => `${item.name}-${item.country}-${index}`}
      style={styles.resultsList}
      keyboardShouldPersistTaps="handled"
    />
  );
};
