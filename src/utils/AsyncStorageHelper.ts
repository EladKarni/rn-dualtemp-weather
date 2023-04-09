import AsyncStorage from '@react-native-async-storage/async-storage';

type tempScales = 'C' | 'F'

export const storeSelectedTempScale = async (value: "C" | "F") => {
    try {
      await AsyncStorage.setItem('@selected_temp_scale', value)
    } catch (e) {
        console.log("Test: ", e)
    }
}


export const getSelectedTempScale = async () : Promise<'C' | 'F'> => {
    try {
      const value: tempScales = await AsyncStorage.getItem('@selected_temp_scale') as tempScales
      if(value !== null) {
        return value
      } else {
        return "C"
      }
    } catch(e) {
      return "C"
    }
}