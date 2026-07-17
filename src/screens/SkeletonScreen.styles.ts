import { StyleSheet } from "react-native";
import { palette } from "../styles/Palette";

export const skeletonScreenStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.primaryDark,
  },
  content: {
    paddingHorizontal: 16,
  },
});
