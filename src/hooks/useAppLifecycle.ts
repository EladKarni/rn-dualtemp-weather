import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useModalStore } from '../store/useModalStore';

/**
 * Custom hook to manage app lifecycle events
 * - Closes all modals when app moves to background
 * - Initializes modal state on mount
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
}
