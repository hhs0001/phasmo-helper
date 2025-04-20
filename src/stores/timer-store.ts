import { create } from "zustand";
import { setConfig, getConfig } from "@/lib/storeLoader";
import { useConfigStore } from "@/stores/config-store";

// Definição dos tipos para os timers
export type TimerType = "hunt" | "smudge" | "cooldown";

export interface Timer {
  id: string;
  type: TimerType;
  startValue: number; // Valor inicial em segundos
  startTime: number; // Timestamp de quando o timer começou
  endTime: number; // Timestamp de quando o timer deve terminar
  isPaused: boolean;
  pausedAt: number; // Timestamp de quando o timer foi pausado (ou 0 se não pausado)
  pausedTime: number; // Tempo total em que o timer ficou pausado (em ms)
}

export type TimerDurations = {
  hunt: {
    amateur: { small: number; medium: number; large: number; cursed: number };
    intermediate: {
      small: number;
      medium: number;
      large: number;
      cursed: number;
    };
    professional: {
      small: number;
      medium: number;
      large: number;
      cursed: number;
    };
  };
  smudge: {
    normal: number;
    spirit: number;
    demon: number;
  };
  cooldown: {
    normal: number;
    demon: number;
  };
};

export const TIMER_DURATIONS: TimerDurations = {
  hunt: {
    amateur: { small: 15, medium: 30, large: 40, cursed: 20 },
    intermediate: { small: 20, medium: 40, large: 50, cursed: 20 },
    professional: { small: 30, medium: 50, large: 60, cursed: 20 },
  },
  smudge: {
    normal: 90,
    spirit: 180,
    demon: 60,
  },
  cooldown: {
    normal: 25,
    demon: 20,
  },
};

export type TimerSettings = {
  soundEnabled: boolean;
  soundVolume: number;
  defaultSoundFile: string;
  minimized: boolean;
  timerSounds: {
    [key in TimerType]: string | null; // Caminhos para os arquivos de áudio de cada tipo de timer
  };
};

export interface TimerState {
  timers: Record<TimerType, Timer | null>;
  settings: TimerSettings;
  // Flag para indicar se estamos usando sons personalizados
  useCustomSounds: boolean;

  // Ações
  initialize: () => Promise<void>;
  startTimer: (type: TimerType, duration: number) => void;
  pauseTimer: (type: TimerType) => void;
  resumeTimer: (type: TimerType) => void;
  resetTimer: (type: TimerType) => void;
  updateTimer: (type: TimerType, updates: Partial<Timer>) => void;
  updateSettings: (settings: Partial<TimerSettings>) => Promise<void>;
  updateTimerSound: (
    type: TimerType,
    soundFile: string | null
  ) => Promise<void>;
  syncWithAppConfig: () => void;

  // Para uso interno do componente
  playTimerCompleteSound: (type: TimerType) => void;
}

const DEFAULT_SETTINGS: TimerSettings = {
  soundEnabled: true,
  soundVolume: 0.7,
  defaultSoundFile: "timer-complete.mp3",
  minimized: false,
  timerSounds: {
    hunt: null,
    smudge: null,
    cooldown: null,
  },
};

export const useTimerStore = create<TimerState>((set, get) => ({
  timers: {
    hunt: null,
    smudge: null,
    cooldown: null,
  },
  settings: DEFAULT_SETTINGS,
  useCustomSounds: false,

  initialize: async () => {
    try {
      // Carregar apenas as configurações de sons e aparência dos timers
      const storedSettings = await getConfig("timerSettings");
      if (storedSettings) {
        set({ settings: { ...DEFAULT_SETTINGS, ...storedSettings } });
      }

      // Verificar e sincronizar com as configurações de app
      get().syncWithAppConfig();
    } catch (error) {
      console.error("Erro ao carregar configurações dos timers:", error);
    }
  },

  syncWithAppConfig: () => {
    try {
      // Buscar sons personalizados diretamente do estado global de config
      const appTimers = useConfigStore.getState().config.timers;
      const currentSettings = get().settings;
      const customSounds = {
        hunt: appTimers.huntSound || null,
        smudge: appTimers.smudgeSound || null,
        cooldown: appTimers.cooldownSound || null,
      };
      const hasCustomSounds = Object.values(customSounds).some(
        (s) => s !== null
      );
      set({
        settings: { ...currentSettings, timerSounds: customSounds },
        useCustomSounds: hasCustomSounds,
      });
    } catch (error) {
      console.error("Erro ao sincronizar sons do app:", error);
    }
  },

  startTimer: (type, duration) => {
    const now = Date.now();
    const newTimer: Timer = {
      id: `${type}-${now}`,
      type,
      startValue: duration,
      startTime: now,
      endTime: now + duration * 1000,
      isPaused: false,
      pausedAt: 0,
      pausedTime: 0,
    };

    const { timers } = get();
    const updatedTimers = { ...timers, [type]: newTimer };

    set({ timers: updatedTimers });
  },

  pauseTimer: (type) => {
    const { timers } = get();
    const timer = timers[type];

    if (timer && !timer.isPaused) {
      const now = Date.now();
      const updatedTimer = {
        ...timer,
        isPaused: true,
        pausedAt: now,
      };
      const updatedTimers = { ...timers, [type]: updatedTimer };

      set({ timers: updatedTimers });
    }
  },

  resumeTimer: (type) => {
    const { timers } = get();
    const timer = timers[type];

    if (timer && timer.isPaused && timer.pausedAt > 0) {
      const now = Date.now();
      const pauseDuration = now - timer.pausedAt;
      const newPausedTime = timer.pausedTime + pauseDuration;

      // Ajustar o tempo final considerando o tempo pausado
      const updatedTimer = {
        ...timer,
        isPaused: false,
        pausedAt: 0,
        pausedTime: newPausedTime,
        endTime: timer.endTime + pauseDuration,
      };

      const updatedTimers = { ...timers, [type]: updatedTimer };
      set({ timers: updatedTimers });
    }
  },

  resetTimer: (type) => {
    const { timers } = get();
    const updatedTimers = { ...timers, [type]: null };

    set({ timers: updatedTimers });
  },

  updateTimer: (type, updates) => {
    const { timers } = get();
    const timer = timers[type];

    if (timer) {
      const updatedTimer = { ...timer, ...updates };
      const updatedTimers = { ...timers, [type]: updatedTimer };

      set({ timers: updatedTimers });
    }
  },

  updateSettings: async (newSettings) => {
    const { settings } = get();
    const updatedSettings = { ...settings, ...newSettings };

    set({ settings: updatedSettings });
    await setConfig("timerSettings", updatedSettings);
  },

  updateTimerSound: async (type, soundFile) => {
    const { settings } = get();
    const timerSounds = { ...settings.timerSounds, [type]: soundFile };
    const updatedSettings = { ...settings, timerSounds };

    set({ settings: updatedSettings });
    await setConfig("timerSettings", updatedSettings);
  },

  playTimerCompleteSound: (type) => {
    const { settings } = get();

    // Verificar se o som está habilitado
    if (!settings.soundEnabled) return;

    // Usar a função global exposta pelo TimerSoundPlayer se disponível
    if (window.__playTimerCompleteSound) {
      window.__playTimerCompleteSound(type);
      return;
    }

    // Fallback caso o TimerSoundPlayer não esteja montado
    try {
      console.log(`Fallback: Reproduzindo som para ${type}`);
      const audio = new Audio(`/assets/sounds/${settings.defaultSoundFile}`);
      audio.volume = settings.soundVolume;
      audio.play().catch((error) => {
        console.error("Erro ao reproduzir som do timer (fallback):", error);
      });
    } catch (error) {
      console.error("Erro no fallback de reprodução de som:", error);
    }
  },
}));

// Inicializa o estado dos timers ao importar a store
useTimerStore.getState().initialize();

// Função auxiliar para calcular o tempo restante em segundos para um timer
export function getTimerRemainingSeconds(timer: Timer | null): number {
  if (!timer) return 0;

  if (timer.isPaused) {
    // Se estiver pausado, calcula quanto tempo faltava no momento da pausa
    const elapsedBeforePause =
      timer.pausedAt - timer.startTime - timer.pausedTime;
    return Math.max(
      0,
      Math.ceil((timer.startValue * 1000 - elapsedBeforePause) / 1000)
    );
  }

  const now = Date.now();
  const adjustedEndTime = timer.endTime;

  if (now >= adjustedEndTime) {
    return 0;
  }

  return Math.ceil((adjustedEndTime - now) / 1000);
}
