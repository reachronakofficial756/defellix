import { create } from 'zustand';

interface ContractsStore {
  isOpen: boolean;
  openContracts: () => void;
  closeContracts: () => void;
}

export const useContractsStore = create<ContractsStore>((set) => ({
  isOpen: false,
  openContracts: () => set({ isOpen: true }),
  closeContracts: () => set({ isOpen: false }),
}));
