import { create } from 'zustand';

interface UIStore {
  sidebarOpen: boolean;
  selectedEmployeeId: number | null;
  selectedHubId: number | null;
  
  setSidebarOpen: (open: boolean) => void;
  setSelectedEmployeeId: (id: number | null) => void;
  setSelectedHubId: (id: number | null) => void;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: true,
  selectedEmployeeId: null,
  selectedHubId: null,
  
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setSelectedEmployeeId: (id) => set({ selectedEmployeeId: id }),
  setSelectedHubId: (id) => set({ selectedHubId: id }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}));
