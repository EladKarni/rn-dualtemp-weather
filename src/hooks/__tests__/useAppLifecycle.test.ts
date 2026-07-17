/**
 * Worker E — React Query focus wiring (finding 4b).
 *
 * useAppLifecycle registers an AppState 'change' listener that mirrors app
 * foreground/background into React Query's focusManager, so the default
 * refetchOnWindowFocus refetches stale data on resume. This spies on
 * AppState.addEventListener to capture the handler and asserts focusManager
 * flips accordingly.
 */
import { renderHook, act } from '@testing-library/react-native';
import { AppState, type AppStateStatus } from 'react-native';
import { focusManager } from '@tanstack/react-query';
import { useAppLifecycle } from '../useAppLifecycle';

jest.mock('../../store/useModalStore', () => ({
  useModalStore: (selector: (s: { closeModal: () => void }) => unknown) =>
    selector({ closeModal: jest.fn() }),
}));

describe('useAppLifecycle — focusManager wiring (finding 4b)', () => {
  it('flips focusManager.isFocused() when AppState changes', () => {
    const changeHandlers: ((state: AppStateStatus) => void)[] = [];
    const spy = jest
      .spyOn(AppState, 'addEventListener')
      .mockImplementation((type, handler) => {
        if (type === 'change') {
          changeHandlers.push(handler as (state: AppStateStatus) => void);
        }
        return { remove: jest.fn() } as unknown as ReturnType<
          typeof AppState.addEventListener
        >;
      });

    renderHook(() => useAppLifecycle());

    expect(changeHandlers.length).toBeGreaterThan(0);

    act(() => {
      changeHandlers.forEach(handler => handler('background'));
    });
    expect(focusManager.isFocused()).toBe(false);

    act(() => {
      changeHandlers.forEach(handler => handler('active'));
    });
    expect(focusManager.isFocused()).toBe(true);

    spy.mockRestore();
  });
});
