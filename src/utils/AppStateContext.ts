import { createContext, Dispatch, SetStateAction } from 'react';
import { Weather } from '../types/WeatherTypes';
import { Moment } from 'moment';
import { QueryObserverResult } from '@tanstack/react-query';

export const AppStateContext = createContext<AppStateProviderPropTypes | null>(null);

export type AppStateProviderPropTypes = {
  forecast: Weather | undefined;
  date: Moment;
  tempScale: 'C' | 'F';
  updateTempScale: () => void;
}