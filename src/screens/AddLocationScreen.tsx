import React, { useEffect, useRef, useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Platform,
  Animated,
  TextInput,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { i18n } from "../localization/i18n";
import { styles } from "../styles/screens/AddLocationScreen.styles";
import { CityResult, searchCities, formatLocationName } from "../utils/geocoding";
import { useLocationStore } from "../store/useLocationStore";
import { useLanguageStore } from "../store/useLanguageStore";
import { logger } from "../utils/logger";
import { AppError, toAppError } from "../utils/errors";
import { useModalAnimation } from "../hooks/useModalAnimation";
import { palette } from "../Styles/Palette";
import { CityResultItem } from "../components/AddLocation/CityResultItem/CityResultItem";

type AddLocationScreenProps = {
  visible: boolean;
  onClose: () => void;
};

const AddLocationScreen = ({ visible, onClose }: AddLocationScreenProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<CityResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<AppError | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const selectedLanguage = useLanguageStore((state) => state.selectedLanguage);

  const addLocation = useLocationStore((state) => state.addLocation);
  const canAddMoreLocations = useLocationStore((state) => state.canAddMoreLocations());

  const { fadeAnim, slideAnim } = useModalAnimation(visible);

  useEffect(() => {
    if (!visible) {
      setSearchQuery("");
      setSearchResults([]);
      setError(null);
    }
  }, [visible]);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.trim().length < 3) {
      setSearchResults([]);
      setError(null);
      return;
    }

    setIsSearching(true);
    setError(null);

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const locale = selectedLanguage || 'en';
        const results = await searchCities(searchQuery, locale);
        setSearchResults(results);
        setError(null);
      } catch (err) {
        const appError = toAppError(err);
        logger.error("Search error:", err);
        setError(appError);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, selectedLanguage]);

  const handleSelectCity = (city: CityResult) => {
    if (!canAddMoreLocations) {
      setError(toAppError(new Error(i18n.t("MaxLocationsReached"))));
      return;
    }

    const locationName = formatLocationName(city.name, city.state, city.country);

    addLocation({
      name: locationName,
      latitude: city.lat,
      longitude: city.lon,
    });

    onClose();
  };

  const handleRetry = () => {
    setError(null);
    const currentQuery = searchQuery;
    setSearchQuery("");
    setTimeout(() => setSearchQuery(currentQuery), 0);
  };

  const renderEmptyState = () => {
    if (searchQuery.trim().length < 3) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>{i18n.t('StartTyping')}</Text>
        </View>
      );
    }

    if (searchResults.length === 0 && !isSearching && !error) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>{i18n.t('NoResults')}</Text>
        </View>
      );
    }

    return null;
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />
      </TouchableWithoutFeedback>

      <Animated.View
        style={[
          styles.modalContainer,
          { transform: [{ translateY: slideAnim }] },
        ]}
      >
        <View style={styles.header}>
          <Text style={styles.title}>{i18n.t("AddLocation")}</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.closeButtonText}>×</Text>
          </TouchableOpacity>
        </View>

        <TextInput
          style={styles.searchInput}
          placeholder={i18n.t("SearchLocation")}
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="words"
          autoCorrect={false}
          autoFocus={true}
        />

        {error && (
          <View style={styles.errorBanner}>
            <View style={styles.errorContent}>
              <Text style={styles.errorIcon}>⚠️</Text>
              <Text style={styles.errorMessage}>{error.userMessage}</Text>
            </View>
            <View style={styles.errorActions}>
              {error.recoverable && (
                <TouchableOpacity onPress={handleRetry} style={styles.retryButton}>
                  <Text style={styles.retryText}>{i18n.t('Retry')}</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => setError(null)} style={styles.dismissButton}>
                <Text style={styles.dismissText}>×</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.resultsContainer}>
          {isSearching ? (
            <View style={styles.loadingState}>
              <ActivityIndicator size="large" color={palette.highlightColor} />
              <Text style={styles.loadingText}>{i18n.t('Searching')}</Text>
            </View>
          ) : searchResults.length > 0 ? (
            <FlatList
              data={searchResults}
              renderItem={({ item }) => (
                <CityResultItem city={item} onPress={handleSelectCity} />
              )}
              keyExtractor={(item, index) => `${item.name}-${item.country}-${index}`}
              contentContainerStyle={styles.listContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={true}
            />
          ) : (
            renderEmptyState()
          )}
        </View>
      </Animated.View>
    </Modal>
  );
};

export default AddLocationScreen;
