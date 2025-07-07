import { registerRootComponent } from 'expo';
import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import App from './App';

const queryClient = new QueryClient();

function RootCompponent() {
  return (
    <QueryClientProvider client={queryClient}>
        <App />
    </QueryClientProvider>
  );
}

registerRootComponent(RootCompponent);