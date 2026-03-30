import { Platform } from "react-native";
import { palette } from "./Palette";

export const shadowProp = {
  shadowColor: palette.shadowLight,
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.31,
  shadowRadius: 30,
  elevation: 10,
  ...(Platform.OS === 'web' && {
    boxShadow: '0px 4px 30px rgba(113, 94, 245, 0.31)',
  }),
};
