import { create } from 'zustand';

interface ContractsStore {
  isOpen: boolean;
  activeContractId: number | null;
  openContracts: () => void;
  openContractsWithId: (id: number) => void;
  closeContracts: () => void;
}

export const useContractsStore = create<ContractsStore>((set) => ({
  isOpen: false,
  activeContractId: null,
  openContracts: () => set({ isOpen: true, activeContractId: null }),
  openContractsWithId: (id: number) => set({ isOpen: true, activeContractId: id }),
  closeContracts: () => set({ isOpen: false, activeContractId: null }),
}));
