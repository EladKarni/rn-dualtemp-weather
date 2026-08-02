import { useEffect } from 'react';
import { AppState } from 'react-native';
import { focusManager } from '@tanstack/react-query';
import { useModalStore } from '../store/useModalStore';

/**
 * Custom hook to manage app lifecycle events
 * - Closes all modals when app moves to background
 * - Initializes modal state on mount
 * - Keeps React Query's focusManager in sync with app foreground/background
 *   (finding 4b) so the default `refetchOnWindowFocus` refetches stale data on
 *   resume. This hook is already mounted in App.tsx, so no new hook/mount is
 *   needed for the focus wiring.
 */
export function useAppLifecycle() {
  const closeModal = useModalStore((state) => state.closeModal);

  // Reset all modals on mount for clean state
  useEffect(() => {
    closeModal();
  }, [closeModal]);

  // Close modals when app backgrounds
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'background') {
        closeModal();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [closeModal]);

  // Keep React Query's focusManager in sync with app state so stale-on-resume
  // active queries refetch when the app returns to the foreground.
  useEffect(() => {
    focusManager.setFocused(AppState.currentState === 'active');

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      focusManager.setFocused(nextAppState === 'active');
    });

    return () => {
      subscription.remove();
    };
  }, []);
}
