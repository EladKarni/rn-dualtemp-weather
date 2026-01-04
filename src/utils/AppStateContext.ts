import { createContext } from 'react';
import { Weather } from '../types/WeatherTypes';
import { Moment } from 'moment';

export const AppStateContext = createContext<AppStateProviderPropTypes | null>(null);

export type AppStateProviderPropTypes = {
  forecast: Weather | undefined;
  date: Moment;
  tempScale: string;
}