import { create } from "zustand";

type ModalType = 'location' | 'settings' | 'addLocation' | null;

interface ModalState {
  activeModal: ModalType;
  modalData?: any; // Optional data to pass to modals

  openLocationDropdown: () => void;
  openSettings: () => void;
  openAddLocation: (data?: any) => void;
  closeModal: () => void;
}

export const useModalStore = create<ModalState>((set) => ({
  activeModal: null,
  modalData: undefined,

  openLocationDropdown: () => set({ activeModal: 'location', modalData: undefined }),
  openSettings: () => set({ activeModal: 'settings', modalData: undefined }),
  openAddLocation: (data?: any) => set({ activeModal: 'addLocation', modalData: data }),
  closeModal: () => set({ activeModal: null, modalData: undefined }),
}));
