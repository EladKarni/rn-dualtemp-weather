// MUST stay first: initializes Sentry as a side effect, before the rest of the
// module graph is evaluated (widgetTaskHandler pulls in the stores, i18n, the
// logger and fetchWeather at module scope). See src/config/sentryBootstrap.ts.
import './src/config/sentryBootstrap';
import { registerRootComponent } from 'expo';
import { registerWidgetTaskHandler } from 'react-native-android-widget';
import { widgetTaskHandler } from './src/widgets/widgetTaskHandler';
import RootComponent from './src/config/RootComponent';

// index.js is registration glue only. The composed app tree (providers + root
// error boundary) lives in src/config/RootComponent.tsx and the query client in
// src/config/queryClient.ts.
registerRootComponent(RootComponent);
registerWidgetTaskHandler(widgetTaskHandler);
