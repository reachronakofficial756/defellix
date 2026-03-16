import { create } from 'zustand';

interface ContractsStore {
  isOpen: boolean;
  activeContractId: number | null;
  openContracts: (contractId?: number) => void;
  closeContracts: () => void;
  setActiveContractId: (id: number | null) => void;
}

export const useContractsStore = create<ContractsStore>((set) => ({
  isOpen: false,
  activeContractId: null,
  openContracts: (contractId?: number) => set({ isOpen: true, activeContractId: contractId ?? null }),
  closeContracts: () => set({ isOpen: false, activeContractId: null }),
  setActiveContractId: (id) => set({ activeContractId: id }),
}));
