import { create } from "zustand";
import { navConfig, pagesConfig } from "@/config/navigation";

export const DEFAULT_PAGE = "Ghosts" as const;

interface NavigationState {
  currentPage: string;
  pages: typeof pagesConfig;
  navigation: typeof navConfig;
  defaultPage: typeof DEFAULT_PAGE;
  // Ações
  setCurrentPage: (page: string) => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
  currentPage: DEFAULT_PAGE,
  pages: pagesConfig,
  navigation: navConfig,
  defaultPage: DEFAULT_PAGE,

  setCurrentPage: (page: string) => set({ currentPage: page }),
}));
