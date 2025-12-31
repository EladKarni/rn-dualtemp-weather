import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useLanguageStore } from "../../store/useLanguageStore";
import { i18n } from "../../localization/i18n";
import { styles } from "./LanguageSelector.Styles";

const getAutoDetectLabel = (locale: string) => {
  const labels: { [key: string]: string } = {
    en: "Auto-detect (Device Language)",
    es: "Detectar Automáticamente (Idioma del Dispositivo)",
    fr: "Détection Automatique (Langue de l'Appareil)",
    ar: "الكشف التلقائي (لغة الجهاز)",
    he: "זיהוי אוטומטי (שפת המכשיר)",
    zh: "自动检测（设备语言）",
  };
  return labels[locale] || labels.en;
};

export const LanguageSelector = () => {
  const selectedLanguage = useLanguageStore((state) => state.selectedLanguage);
  const setLanguage = useLanguageStore((state) => state.setLanguage);

  const languages = [
    { code: null, name: "Auto-detect", nativeName: getAutoDetectLabel(i18n.locale) },
    { code: "en", name: "English", nativeName: "English" },
    { code: "es", name: "Spanish", nativeName: "Español" },
    { code: "fr", name: "French", nativeName: "Français" },
    { code: "ar", name: "Arabic", nativeName: "العربية" },
    { code: "he", name: "Hebrew", nativeName: "עברית" },
    { code: "zh", name: "Chinese", nativeName: "简体中文" },
  ];

  const handleLanguageSelect = (code: string | null) => {
    setLanguage(code);
    // Force a re-render by triggering locale fetch
    // This will be handled by App.tsx React Query dependency
  };

  return (
    <View style={styles.container}>
      {languages.map((lang, index) => {
        const isSelected = selectedLanguage === lang.code;
        const isLast = index === languages.length - 1;

        return (
          <TouchableOpacity
            key={lang.code || "auto"}
            style={[
              styles.languageOption,
              isSelected && styles.selectedOption,
              isLast && styles.lastOption,
            ]}
            onPress={() => handleLanguageSelect(lang.code)}
          >
            <View style={styles.languageInfo}>
              {isSelected && <Text style={styles.checkmark}>✓</Text>}
              <Text style={styles.languageName}>{lang.nativeName}</Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};
