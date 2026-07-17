import { registerRootComponent } from 'expo';
import { registerWidgetTaskHandler } from 'react-native-android-widget';
import { widgetTaskHandler } from './src/widgets/widgetTaskHandler';
import RootComponent from './src/config/RootComponent';

// index.js is registration glue only. The composed app tree (providers + root
// error boundary) lives in src/config/RootComponent.tsx and the query client in
// src/config/queryClient.ts.
registerRootComponent(RootComponent);
registerWidgetTaskHandler(widgetTaskHandler);
