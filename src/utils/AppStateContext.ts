import { createContext } from 'react';
import { Weather } from '../types/WeatherTypes';
import { Moment } from 'moment';

export const AppStateContext = createContext<AppStateProviderPropTypes | null>(null);

type AppStateProviderPropTypes = {
  forecast: Weather | undefined;
  date: Moment;
}