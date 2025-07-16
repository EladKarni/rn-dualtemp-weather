import AsyncStorage from "@react-native-async-storage/async-storage";

export const storeAsyncStorage = async (key: string, value: string) => {
  try {
    await AsyncStorage.setItem(key, value);
  } catch (e) {
    console.log("Storing failed: ", e);
  }
};

export const getAsyncStorage = async (key: string): Promise<string> => {
  try {
    const value: string = await AsyncStorage.getItem(key);
    if (value !== null) {
      return value;
    } else {
      return null;
    }
  } catch (e) {
    console.error("Fetching key failed: ", e);
  }
};
