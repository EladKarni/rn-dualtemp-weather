import AsyncStorage from "@react-native-async-storage/async-storage";
import { logger } from "./logger";

export const storeAsyncStorage = async (key: string, value: string) => {
  try {
    await AsyncStorage.setItem(key, value);
  } catch (e) {
    logger.error("Storing failed: ", e);
  }
};

export const getAsyncStorage = async (key: string): Promise<string> => {
  try {
    const value: string = await AsyncStorage.getItem(key);
    if (value !== null) {
      return value;
    } else {
      return "";
    }
  } catch (e) {
    logger.error("Fetching key failed: ", e);
    return ""; // Return a default empty string in case of an error
  }
};
