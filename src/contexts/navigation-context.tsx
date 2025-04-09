import { createContext, useContext, useState, ReactNode } from "react";
import { navConfig, pagesConfig } from "@/config/navigation";

export const DEFAULT_PAGE = "Ghosts" as const;

type NavigationContextType = {
  currentPage: string;
  setCurrentPage: (page: string) => void;
  pages: typeof pagesConfig;
  navigation: typeof navConfig;
  defaultPage: typeof DEFAULT_PAGE;
};

const NavigationContext = createContext<NavigationContextType | undefined>(
  undefined
);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [currentPage, setCurrentPage] = useState<string>(DEFAULT_PAGE);

  const value: NavigationContextType = {
    currentPage,
    setCurrentPage: (page: string) => setCurrentPage(page),
    pages: pagesConfig,
    navigation: navConfig,
    defaultPage: DEFAULT_PAGE,
  };

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error("useNavigation must be used within a NavigationProvider");
  }
  return context;
}
