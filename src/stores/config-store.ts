import { create } from "zustand";
import { getConfig, setConfig } from "@/lib/storeLoader";
import { useTimerStore } from "@/stores/timer-store";

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
  timers: {
    huntSound: string | null;
    smudgeSound: string | null;
    cooldownSound: string | null;
  };
};

// Configuração padrão
export const DEFAULT_CONFIG: AppConfig = {
  keybinds: {
    EMF5: { key: "Shift+1", description: "EMF 5", enabled: true },
    SpiritBox: { key: "Shift+2", description: "Spirit Box", enabled: true },
    Fingerprints: {
      key: "Shift+3",
      description: "Fingerprints",
      enabled: true,
    },
    GhostOrb: { key: "Shift+4", description: "Ghost Orb", enabled: true },
    GhostWriting: {
      key: "Shift+5",
      description: "Ghost Writing",
      enabled: true,
    },
    Freezing: {
      key: "Shift+6",
      description: "Freezing Temperatures",
      enabled: true,
    },
    DOTSProjector: {
      key: "Shift+7",
      description: "D.O.T.S Projector",
      enabled: true,
    },
    resetEvidence: {
      key: "Shift+8",
      description: "Reset Evidence",
      enabled: true,
    },
    ghostSpeed: {
      key: "Shift+S",
      description: "Calcular Velocidade do Fantasma",
      enabled: true,
    },
    huntTrack: {
      key: "Space",
      description: "Hunt Track",
      enabled: true,
    },
    smudgeTimer: {
      key: "Shift+9",
      description: "Smudge Timer",
      enabled: true,
    },
    colldownTimer: {
      key: "Shift+0",
      description: "Colldown Timer",
      enabled: true,
    },
    huntTimer: {
      key: "Shift+-",
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
  timers: {
    huntSound: null,
    smudgeSound: null,
    cooldownSound: null,
  },
};

interface ConfigState {
  config: AppConfig;
  isLoading: boolean;
  // Ações
  initialize: () => Promise<void>;
  updateConfig: <K extends keyof AppConfig>(
    key: K,
    value: AppConfig[K]
  ) => Promise<void>;
  updateKeybind: (id: string, keybind: Partial<KeybindConfig>) => Promise<void>;
  updateOverlay: (overlay: Partial<AppConfig["overlay"]>) => Promise<void>;
  updateTimers: (timers: Partial<AppConfig["timers"]>) => Promise<void>;
  resetConfig: () => Promise<void>;
}

export const useConfigStore = create<ConfigState>((set, get) => ({
  config: DEFAULT_CONFIG,
  isLoading: true,

  initialize: async () => {
    try {
      set({ isLoading: true });
      const storedConfig = await getConfig("appConfig");
      if (storedConfig) {
        // Mescla as configurações armazenadas com as padrões para garantir que novos campos sejam incluídos
        set({ config: { ...DEFAULT_CONFIG, ...storedConfig } });
      }
    } catch (error) {
      console.error("Erro ao carregar configurações:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  updateConfig: async <K extends keyof AppConfig>(
    key: K,
    value: AppConfig[K]
  ) => {
    try {
      const { config } = get();
      const newConfig = { ...config, [key]: value };
      set({ config: newConfig });
      await setConfig("appConfig", newConfig);
    } catch (error) {
      console.error(`Erro ao atualizar configuração ${String(key)}:`, error);
      throw error;
    }
  },

  updateKeybind: async (id: string, keybind: Partial<KeybindConfig>) => {
    try {
      const { config } = get();
      const currentKeybind = config.keybinds[id] || DEFAULT_CONFIG.keybinds[id];
      if (!currentKeybind) {
        throw new Error(`Keybind ${id} não encontrado`);
      }

      const updatedKeybind = { ...currentKeybind, ...keybind };
      const newKeybinds = { ...config.keybinds, [id]: updatedKeybind };

      const newConfig = { ...config, keybinds: newKeybinds };
      set({ config: newConfig });
      await setConfig("appConfig", newConfig);
    } catch (error) {
      console.error(`Erro ao atualizar keybind ${id}:`, error);
      throw error;
    }
  },

  updateOverlay: async (overlay: Partial<AppConfig["overlay"]>) => {
    try {
      const { config } = get();
      const newOverlay = { ...config.overlay, ...overlay };
      const newConfig = { ...config, overlay: newOverlay };
      set({ config: newConfig });
      await setConfig("appConfig", newConfig);
    } catch (error) {
      console.error("Erro ao atualizar overlay:", error);
      throw error;
    }
  },

  updateTimers: async (timers: Partial<AppConfig["timers"]>) => {
    try {
      const { config } = get();
      const newTimers = { ...config.timers, ...timers };
      const newConfig = { ...config, timers: newTimers };
      set({ config: newConfig });
      await setConfig("appConfig", newConfig);
      // Sincronizar sons customizados na store de timers
      useTimerStore.getState().syncWithAppConfig();
    } catch (error) {
      console.error("Erro ao atualizar timers:", error);
      throw error;
    }
  },

  resetConfig: async () => {
    try {
      set({ config: DEFAULT_CONFIG });
      await setConfig("appConfig", DEFAULT_CONFIG);
    } catch (error) {
      console.error("Erro ao resetar configurações:", error);
      throw error;
    }
  },
}));

// Inicializa o estado de configuração ao importar a store
useConfigStore.getState().initialize();
