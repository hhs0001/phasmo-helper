import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { getConfig, setConfig } from "@/lib/storeLoader";

// Definição dos tipos para as configurações
export type KeybindConfig = {
  key: string;
  description: string;
  enabled: boolean;
};

export type AppConfig = {
  keybinds: Record<string, KeybindConfig>;
  overlay: {
    enabled: boolean;
    opacity: number;
    position: "top-left" | "top-right" | "bottom-left" | "bottom-right";
    alwaysOnTop: boolean;
  };
  application: {
    showInfo: "modal" | "panel";
    theme: "light" | "dark" | "system";
  };
};

// Configuração padrão
export const DEFAULT_CONFIG: AppConfig = {
  keybinds: {
    EMF5: { key: "F1", description: "EMF 5", enabled: true },
    DOTSProjector: {
      key: "F2",
      description: "D.O.T.S Projector",
      enabled: true,
    },
    GhostOrb: { key: "F3", description: "Ghost Orb", enabled: true },
    GhostWriting: { key: "F4", description: "Ghost Writing", enabled: true },
    Fingerprints: { key: "F5", description: "Fingerprints", enabled: true },
    SpiritBox: { key: "F6", description: "Spirit Box", enabled: true },
    Freezing: {
      key: "F7",
      description: "Freezing Temperatures",
      enabled: true,
    },
    resetEvidence: {
      key: "F8",
      description: "Reset Evidence",
      enabled: true,
    },
    huntTrack: {
      key: "SPACE",
      description: "Hunt Track",
      enabled: true,
    },
    smudgeTimer: {
      key: "F9",
      description: "Smudge Timer",
      enabled: true,
    },
    colldownTimer: {
      key: "F10",
      description: "Colldown Timer",
      enabled: true,
    },
    huntTimer: {
      key: "F11",
      description: "Hunt Timer",
      enabled: true,
    },
  },
  overlay: {
    enabled: true,
    opacity: 0.8,
    position: "top-right",
    alwaysOnTop: true,
  },
  application: {
    showInfo: "modal",
    theme: "system",
  },
};

type ConfigContextType = {
  config: AppConfig;
  isLoading: boolean;
  updateConfig: <K extends keyof AppConfig>(
    key: K,
    value: AppConfig[K]
  ) => Promise<void>;
  updateKeybind: (id: string, keybind: Partial<KeybindConfig>) => Promise<void>;
  updateOverlay: (overlay: Partial<AppConfig["overlay"]>) => Promise<void>;
  resetConfig: () => Promise<void>;
};

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfigState] = useState<AppConfig>(DEFAULT_CONFIG);
  const [isLoading, setIsLoading] = useState(true);

  // Carrega as configurações ao iniciar
  useEffect(() => {
    async function loadConfig() {
      try {
        setIsLoading(true);
        const storedConfig = await getConfig("appConfig");
        if (storedConfig) {
          // Mescla as configurações armazenadas com as padrões para garantir que novos campos sejam incluídos
          setConfigState({ ...DEFAULT_CONFIG, ...storedConfig });
        }
      } catch (error) {
        console.error("Erro ao carregar configurações:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadConfig();
  }, []);

  // Atualiza uma configuração específica
  const updateConfig = async <K extends keyof AppConfig>(
    key: K,
    value: AppConfig[K]
  ) => {
    try {
      const newConfig = { ...config, [key]: value };
      setConfigState(newConfig);
      await setConfig("appConfig", newConfig);
    } catch (error) {
      console.error(`Erro ao atualizar configuração ${String(key)}:`, error);
      throw error;
    }
  };

  // Atualiza um keybind específico
  const updateKeybind = async (id: string, keybind: Partial<KeybindConfig>) => {
    try {
      const currentKeybind = config.keybinds[id] || DEFAULT_CONFIG.keybinds[id];
      if (!currentKeybind) {
        throw new Error(`Keybind ${id} não encontrado`);
      }

      const updatedKeybind = { ...currentKeybind, ...keybind };
      const newKeybinds = { ...config.keybinds, [id]: updatedKeybind };

      const newConfig = { ...config, keybinds: newKeybinds };
      setConfigState(newConfig);
      await setConfig("appConfig", newConfig);
    } catch (error) {
      console.error(`Erro ao atualizar keybind ${id}:`, error);
      throw error;
    }
  };

  // Atualiza as configurações do overlay
  const updateOverlay = async (overlay: Partial<AppConfig["overlay"]>) => {
    try {
      const newOverlay = { ...config.overlay, ...overlay };
      const newConfig = { ...config, overlay: newOverlay };
      setConfigState(newConfig);
      await setConfig("appConfig", newConfig);
    } catch (error) {
      console.error("Erro ao atualizar overlay:", error);
      throw error;
    }
  };

  // Reseta todas as configurações para o padrão
  const resetConfig = async () => {
    try {
      setConfigState(DEFAULT_CONFIG);
      await setConfig("appConfig", DEFAULT_CONFIG);
    } catch (error) {
      console.error("Erro ao resetar configurações:", error);
      throw error;
    }
  };

  const value: ConfigContextType = {
    config,
    isLoading,
    updateConfig,
    updateKeybind,
    updateOverlay,
    resetConfig,
  };

  return (
    <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>
  );
}

export function useConfig() {
  const context = useContext(ConfigContext);
  if (context === undefined) {
    throw new Error("useConfig deve ser usado dentro de um ConfigProvider");
  }
  return context;
}
