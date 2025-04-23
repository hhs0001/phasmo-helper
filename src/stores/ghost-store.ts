import { create } from "zustand";
import { getGhost } from "@/lib/storeLoader";
import {
  GameMode,
  Evidence,
  InclusionState,
  Ghost,
  GhostData,
  FilterOptions,
} from "@/types/ghost-schema";
import { toast } from "sonner";

// Estado inicial para as opções de filtro
const DEFAULT_FILTER_OPTIONS: FilterOptions = {
  evidenceInclusion: {
    EMF: "neutral",
    SpiritBox: "neutral",
    Fingerprints: "neutral",
    GhostOrb: "neutral",
    GhostWriting: "neutral",
    FreezingTemps: "neutral",
    DotsProjector: "neutral",
  },
  speedFilter: {
    min: null,
    max: null,
  },
  hasLOS: "neutral",
  huntThreshold: {
    min: null,
    max: null,
  },
};

interface GhostState {
  // Estado
  gameMode: GameMode;
  ghostData: GhostData;
  isLoading: boolean;
  error: Error | null;
  selectedGhostId: string | null;
  filterOptions: FilterOptions;
  possibleGhosts: Ghost[];

  // Ações/Métodos
  setGameMode: (mode: GameMode) => void;
  selectGhost: (id: string | null) => void;
  toggleEvidenceInclusion: (evidence: Evidence) => void;
  updateSpeedFilter: (min: number | null, max: number | null) => void;
  toggleLOSFilter: () => void;
  updateSanityThreshold: (min: number | null, max: number | null) => void;
  resetFilters: () => void;
  refreshFromAPI: () => Promise<boolean | Error>;
  initialize: () => Promise<void>;
  updatePossibleGhosts: () => void;

  // Funções auxiliares
  getEvidenceInclusionState: (evidence: Evidence) => InclusionState;
  isGuaranteedEvidence: (ghost: Ghost, evidence: Evidence) => boolean;
  getPossibleEvidenceCombinations: (
    ghost: Ghost,
    mode: GameMode
  ) => Evidence[][];
}

export const useGhostStore = create<GhostState>((set, get) => ({
  // Estado inicial
  gameMode: "Professional",
  ghostData: { ghosts: {}, lastUpdate: null },
  isLoading: true,
  error: null,
  selectedGhostId: null,
  filterOptions: DEFAULT_FILTER_OPTIONS,
  possibleGhosts: [],

  // Ações
  setGameMode: (mode: GameMode) => {
    set({ gameMode: mode });
    // Recalcula os fantasmas possíveis ao mudar o modo de jogo
    get().updatePossibleGhosts();
  },

  selectGhost: (id: string | null) => set({ selectedGhostId: id }),

  toggleEvidenceInclusion: (evidence: Evidence) => {
    set((state) => {
      const currentState = state.filterOptions.evidenceInclusion[evidence];
      let newState: InclusionState;

      if (currentState === "neutral") {
        newState = "include";
      } else if (currentState === "include") {
        newState = "exclude";
      } else {
        newState = "neutral";
      }

      const newFilterOptions = {
        ...state.filterOptions,
        evidenceInclusion: {
          ...state.filterOptions.evidenceInclusion,
          [evidence]: newState,
        },
      };

      return { filterOptions: newFilterOptions };
    });

    // Recalcula os fantasmas possíveis após mudar o filtro
    get().updatePossibleGhosts();
  },

  updateSpeedFilter: (min: number | null, max: number | null) => {
    set((state) => ({
      filterOptions: {
        ...state.filterOptions,
        speedFilter: { min, max },
      },
    }));
    get().updatePossibleGhosts();
  },

  toggleLOSFilter: () => {
    set((state) => {
      let newState: InclusionState;

      if (state.filterOptions.hasLOS === "neutral") {
        newState = "include";
      } else if (state.filterOptions.hasLOS === "include") {
        newState = "exclude";
      } else {
        newState = "neutral";
      }

      return {
        filterOptions: {
          ...state.filterOptions,
          hasLOS: newState,
        },
      };
    });

    // Recalcula os fantasmas possíveis após mudar o filtro
    get().updatePossibleGhosts();
  },

  updateSanityThreshold: (min: number | null, max: number | null) => {
    set((state) => ({
      filterOptions: {
        ...state.filterOptions,
        huntThreshold: {
          min,
          max,
        },
      },
    }));

    // Recalcula os fantasmas possíveis após mudar o filtro
    get().updatePossibleGhosts();
  },

  resetFilters: () => {
    set({ filterOptions: DEFAULT_FILTER_OPTIONS });

    // Recalcula os fantasmas possíveis após resetar os filtros
    get().updatePossibleGhosts();
  },

  refreshFromAPI: async (): Promise<boolean | Error> => {
    set({ isLoading: true });
    try {
      const data = await getGhost(true);
      set({ ghostData: data });
      get().updatePossibleGhosts();
      return true;
    } catch (err) {
      set({
        error:
          err instanceof Error
            ? err
            : new Error("Erro ao atualizar dados dos fantasmas"),
      });
      return err as Error;
    } finally {
      set({ isLoading: false });
    }
  },

  initialize: async () => {
    set({ isLoading: true });
    try {
      const data = await getGhost();
      set({ ghostData: data });
      get().updatePossibleGhosts();
    } catch (err) {
      toast.error(
        "A maneira como os fantasmas são carregados mudou. Por favor, atualize com a API novamente."
      );
      set({
        error:
          err instanceof Error
            ? err
            : new Error("Erro ao carregar dados dos fantasmas"),
      });
    } finally {
      set({ isLoading: false });
    }
  },

  // Funções auxiliares
  getEvidenceInclusionState: (evidence: Evidence): InclusionState => {
    return get().filterOptions.evidenceInclusion[evidence] || "neutral";
  },

  isGuaranteedEvidence: (ghost: Ghost, evidence: Evidence): boolean => {
    return ghost.guaranteedEvidences?.includes(evidence) || false;
  },

  getPossibleEvidenceCombinations: (
    ghost: Ghost,
    mode: GameMode
  ): Evidence[][] => {
    // Se não estamos no modo Pesadelo ou Insanidade, retornamos todas as evidências
    if (mode !== "Nightmare" && mode !== "Insanity") {
      return [ghost.evidences];
    }

    const guaranteedEvidences = ghost.guaranteedEvidences || [];
    const normalEvidences = ghost.evidences.filter(
      (ev) => !guaranteedEvidences.includes(ev)
    );

    // Calculamos quantas evidências normais (não garantidas) serão mostradas
    // Pesadelo: normalmente 2 de 3, mas se tiver garantidas, pode ser menos
    // Insanidade: normalmente 1 de 3, mas se tiver garantidas, pode ser menos
    let maxNormalEvidences: number;

    if (mode === "Nightmare") {
      // No modo Pesadelo, mostramos 2 evidências no total, incluindo as garantidas
      maxNormalEvidences = Math.max(0, 2 - guaranteedEvidences.length);
    } else {
      // Insanity
      // No modo Insanidade, mostramos 1 evidência no total, incluindo as garantidas
      maxNormalEvidences = Math.max(0, 1 - guaranteedEvidences.length);
    }

    // Caso especial: O Mímico sempre mostra o Orbe + suas evidências normais de acordo com o modo
    // Se não tiver evidências normais suficientes para esconder (ou seja, já tem garantidas demais)
    // mostramos todas
    if (normalEvidences.length <= maxNormalEvidences) {
      return [[...guaranteedEvidences, ...normalEvidences]];
    }

    // Caso contrário, precisamos gerar todas as combinações possíveis
    const combinations: Evidence[][] = [];

    // Função recursiva para gerar combinações
    const generateCombinations = (
      startIdx: number,
      currentCombo: Evidence[],
      size: number
    ) => {
      // Se já temos o número desejado de evidências normais, adicionamos à lista
      if (currentCombo.length === size) {
        combinations.push([...guaranteedEvidences, ...currentCombo]);
        return;
      }

      // Adicionamos cada evidência normal possível à combinação atual
      for (let i = startIdx; i < normalEvidences.length; i++) {
        currentCombo.push(normalEvidences[i]);
        generateCombinations(i + 1, currentCombo, size);
        currentCombo.pop();
      }
    };

    // Geramos todas as combinações possíveis com o número correto de evidências normais
    generateCombinations(0, [], maxNormalEvidences);

    return combinations;
  },

  // Função interna para atualizar a lista de fantasmas possíveis com base nos filtros atuais
  updatePossibleGhosts: () => {
    const state = get();
    const { ghostData, filterOptions, gameMode } = state;

    const filtered = Object.values(ghostData.ghosts).filter((ghost) => {
      // Filtragem por evidências
      for (const evidence of Object.keys(
        filterOptions.evidenceInclusion
      ) as Evidence[]) {
        const inclusion = filterOptions.evidenceInclusion[evidence];

        if (inclusion === "include") {
          // CASO 1: Evidência incluída pelo usuário

          // Se a evidência não está nas evidências do fantasma (nem normais nem garantidas), excluir
          if (
            !ghost.evidences.includes(evidence) &&
            !ghost.guaranteedEvidences?.includes(evidence)
          ) {
            return false;
          }

          // Se estamos no modo Pesadelo ou Insanidade, precisamos verificar
          // se a evidência pode aparecer de acordo com as regras do jogo
          if (gameMode === "Nightmare" || gameMode === "Insanity") {
            const guaranteedEvidences = ghost.guaranteedEvidences || [];

            // Se a evidência é garantida, sempre estará inclusa
            if (guaranteedEvidences.includes(evidence)) {
              continue;
            }

            // Se a evidência não é garantida, verificamos se pode aparecer
            // em alguma combinação possível para este modo
            const possibleCombinations = state.getPossibleEvidenceCombinations(
              ghost,
              gameMode
            );

            // Se não existe combinação que inclua esta evidência, excluir o fantasma
            if (
              !possibleCombinations.some((combo) => combo.includes(evidence))
            ) {
              return false;
            }
          }
        } else if (inclusion === "exclude") {
          // CASO 2: Evidência excluída pelo usuário

          // Se é uma evidência garantida e o usuário excluiu, este fantasma não é possível
          if (ghost.guaranteedEvidences?.includes(evidence)) {
            return false;
          }

          // Se é uma evidência normal e o usuário excluiu, este fantasma não é possível
          // a menos que estejamos em modo Pesadelo/Insanidade e essa evidência possa estar oculta
          if (ghost.evidences.includes(evidence)) {
            // Em modos normais, se a evidência foi excluída, este fantasma não é possível
            if (gameMode !== "Nightmare" && gameMode !== "Insanity") {
              return false;
            }

            // Em modos Pesadelo/Insanidade, verificamos se existem combinações
            // que não incluem esta evidência
            const possibleCombinations = state.getPossibleEvidenceCombinations(
              ghost,
              gameMode
            );

            // Se todas as combinações incluem esta evidência, excluir o fantasma
            if (
              possibleCombinations.every((combo) => combo.includes(evidence))
            ) {
              return false;
            }
          }
        }
      }

      // Filtragem por limiar de caçada (sanidade)
      if (
        filterOptions.huntThreshold.min !== null &&
        (ghost.huntThreshold === undefined ||
          ghost.huntThreshold < filterOptions.huntThreshold.min)
      ) {
        return false;
      }

      if (
        filterOptions.huntThreshold.max !== null &&
        (ghost.huntThreshold === undefined ||
          ghost.huntThreshold > filterOptions.huntThreshold.max)
      ) {
        return false;
      }

      // Filtragem por velocidade em m/s
      if (filterOptions.speedFilter.min !== null) {
        if (ghost.speedRange.max < filterOptions.speedFilter.min) return false;
      }
      if (filterOptions.speedFilter.max !== null) {
        if (ghost.speedRange.min > filterOptions.speedFilter.max) return false;
      }

      // Filtragem por Line of Sight (LoS)
      if (filterOptions.hasLOS === "include" && !ghost.hasLOS) {
        return false;
      } else if (filterOptions.hasLOS === "exclude" && ghost.hasLOS) {
        return false;
      }

      return true;
    });

    set({ possibleGhosts: filtered });
  },
}));

// Inicializa a store ao importar
useGhostStore.getState().initialize();
