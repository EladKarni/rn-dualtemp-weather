import { createContext, Dispatch, SetStateAction } from 'react';
import { Weather } from '../types/WeatherTypes';
import { Moment } from 'moment';

export const AppStateContext = createContext<AppStateProviderPropTypes | null>(null);

export type AppStateProviderPropTypes = {
  forecast: Weather | undefined;
  date: Moment;
  tempScale: 'C' | 'F';
  setTempScale: Dispatch<SetStateAction<"C" | "F">>;
}