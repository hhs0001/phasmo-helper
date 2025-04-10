import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { getGhost } from "@/lib/storeLoader";

// Definição do tipo GhostData
export interface GhostData {
  ghosts: Record<string, Ghost>;
  lastUpdate: string | null;
}

// Tipos
export type GameMode =
  | "Amateur"
  | "Intermediate"
  | "Professional"
  | "Nightmare"
  | "Insanity";
export type Evidence =
  | "EMF"
  | "SpiritBox"
  | "Fingerprints"
  | "GhostOrb"
  | "GhostWriting"
  | "FreezingTemps"
  | "DotsProjector";
export type InclusionState = "include" | "exclude" | "neutral";
export type GhostSpeed = "verySlow" | "slow" | "normal" | "fast" | "veryFast";

export interface SpeedDetails {
  baseSpeed: number; // m/s
  losMultiplier?: number; // multiplicador quando tem linha de visão
  description: string;
  variableSpeed?: boolean; // se a velocidade varia (como no caso do Deogen)
}

export interface GhostBehavior {
  description: string;
  gameMode?: GameMode; // Comportamento específico para um modo de jogo
}

interface Media {
  type: "image" | "video" | "gif";
  url: string;
  description: string;
}
export interface Ghost {
  id: string;
  name: string;
  description: string;
  evidences: Evidence[];
  guaranteedEvidences?: Evidence[]; // Evidências garantidas (como o orbe do Mímico)
  strengths: string;
  weaknesses: string;
  behaviors: GhostBehavior[];
  huntThreshold: number; // % de sanidade para começar a caçar
  speed: GhostSpeed; // Categoria geral de velocidade
  hasLOS: boolean; // Se o fantasma acelera quando tem linha de visão com o jogador
  speedDetails: SpeedDetails; // Detalhes específicos de velocidade
  media?: Media[]; // Imagens, vídeos ou gifs relacionados ao fantasma
}

export interface FilterOptions {
  evidenceInclusion: Record<Evidence, InclusionState>;
  speed: Record<GhostSpeed, boolean>;
  hasLOS: InclusionState;
  huntThreshold: {
    min: number | null;
    max: number | null;
  };
}

interface GhostContextType {
  gameMode: GameMode;
  setGameMode: (mode: GameMode) => void;
  ghostData: GhostData;
  isLoading: boolean;
  error: Error | null;
  selectedGhostId: string | null;
  selectGhost: (id: string | null) => void;
  possibleGhosts: Ghost[];
  filterOptions: FilterOptions;
  toggleEvidenceInclusion: (evidence: Evidence) => void;
  toggleSpeedFilter: (speed: GhostSpeed) => void;
  toggleLOSFilter: () => void;
  updateSanityThreshold: (min: number | null, max: number | null) => void;
  resetFilters: () => void;
  refreshFromAPI: () => Promise<boolean>;
  getEvidenceInclusionState: (evidence: Evidence) => InclusionState;
  isGuaranteedEvidence: (ghost: Ghost, evidence: Evidence) => boolean;
  getPossibleEvidenceCombinations: (
    ghost: Ghost,
    mode: GameMode
  ) => Evidence[][];
}

// Contexto
const GhostContext = createContext<GhostContextType | undefined>(undefined);

// Provider
export function GhostProvider({ children }: { children: ReactNode }) {
  const [gameMode, setGameMode] = useState<GameMode>("Professional");
  const [ghostData, setGhostData] = useState<GhostData>({
    ghosts: {},
    lastUpdate: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [selectedGhostId, setSelectedGhostId] = useState<string | null>(null);

  // Filtros
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    evidenceInclusion: {
      EMF: "neutral",
      SpiritBox: "neutral",
      Fingerprints: "neutral",
      GhostOrb: "neutral",
      GhostWriting: "neutral",
      FreezingTemps: "neutral",
      DotsProjector: "neutral",
    },
    speed: {
      verySlow: false,
      slow: false,
      normal: false,
      fast: false,
      veryFast: false,
    },
    hasLOS: "neutral",
    huntThreshold: {
      min: null,
      max: null,
    },
  });

  // Carregar dados dos fantasmas
  useEffect(() => {
    const loadGhosts = async () => {
      try {
        const data = await getGhost();
        setGhostData(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err
            : new Error("Erro ao carregar dados dos fantasmas")
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadGhosts();
  }, []);

  // Funções para gerenciar os filtros
  const toggleEvidenceInclusion = (evidence: Evidence) => {
    setFilterOptions((prev) => {
      const currentState = prev.evidenceInclusion[evidence];
      let newState: InclusionState;

      if (currentState === "neutral") {
        newState = "include";
      } else if (currentState === "include") {
        newState = "exclude";
      } else {
        newState = "neutral";
      }

      return {
        ...prev,
        evidenceInclusion: {
          ...prev.evidenceInclusion,
          [evidence]: newState,
        },
      };
    });
  };

  const toggleSpeedFilter = (speed: GhostSpeed) => {
    setFilterOptions((prev) => ({
      ...prev,
      speed: {
        ...prev.speed,
        [speed]: !prev.speed[speed],
      },
    }));
  };

  const toggleLOSFilter = () => {
    setFilterOptions((prev) => {
      let newState: InclusionState;

      if (prev.hasLOS === "neutral") {
        newState = "include";
      } else if (prev.hasLOS === "include") {
        newState = "exclude";
      } else {
        newState = "neutral";
      }

      return {
        ...prev,
        hasLOS: newState,
      };
    });
  };

  const updateSanityThreshold = (min: number | null, max: number | null) => {
    setFilterOptions((prev) => ({
      ...prev,
      huntThreshold: {
        min,
        max,
      },
    }));
  };

  const resetFilters = () => {
    setFilterOptions({
      evidenceInclusion: {
        EMF: "neutral",
        SpiritBox: "neutral",
        Fingerprints: "neutral",
        GhostOrb: "neutral",
        GhostWriting: "neutral",
        FreezingTemps: "neutral",
        DotsProjector: "neutral",
      },
      speed: {
        verySlow: false,
        slow: false,
        normal: false,
        fast: false,
        veryFast: false,
      },
      hasLOS: "neutral",
      huntThreshold: {
        min: null,
        max: null,
      },
    });
  };

  // Função para verificar se uma evidência é garantida para um fantasma
  const isGuaranteedEvidence = (ghost: Ghost, evidence: Evidence): boolean => {
    return ghost.guaranteedEvidences?.includes(evidence) || false;
  };

  // Função para obter combinações de evidências possíveis no modo pesadelo/insanidade
  const getPossibleEvidenceCombinations = (
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
  };

  // Função para atualizar os dados a partir da API
  const refreshFromAPI = async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      const data = await getGhost(true);
      setGhostData(data);
      return true;
    } catch (err) {
      setError(
        err instanceof Error
          ? err
          : new Error("Erro ao atualizar dados dos fantasmas")
      );
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Função para selecionar um fantasma para visualizar seus detalhes
  const selectGhost = (id: string | null) => {
    setSelectedGhostId(id);
  };

  // Obtém o estado atual de inclusão de uma evidência
  const getEvidenceInclusionState = (evidence: Evidence): InclusionState => {
    return filterOptions.evidenceInclusion[evidence];
  };

  // Filtra os fantasmas com base nos filtros e modo de jogo
  const possibleGhosts = Object.values(ghostData.ghosts).filter((ghost) => {
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
          const possibleCombinations = getPossibleEvidenceCombinations(
            ghost,
            gameMode
          );

          // Se não existe combinação que inclua esta evidência, excluir o fantasma
          if (!possibleCombinations.some((combo) => combo.includes(evidence))) {
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
          const possibleCombinations = getPossibleEvidenceCombinations(
            ghost,
            gameMode
          );

          // Se todas as combinações incluem esta evidência, excluir o fantasma
          if (possibleCombinations.every((combo) => combo.includes(evidence))) {
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

    // Filtragem por velocidade
    // Se algum filtro de velocidade está ativado, verificamos se o fantasma corresponde
    const hasAnySpeedFilter = Object.values(filterOptions.speed).some((v) => v);

    if (hasAnySpeedFilter && !filterOptions.speed[ghost.speed]) {
      return false;
    }

    // Filtragem por Line of Sight (LoS)
    if (filterOptions.hasLOS === "include" && !ghost.hasLOS) {
      return false;
    } else if (filterOptions.hasLOS === "exclude" && ghost.hasLOS) {
      return false;
    }

    return true;
  });

  return (
    <GhostContext.Provider
      value={{
        gameMode,
        setGameMode,
        ghostData,
        isLoading,
        error,
        selectedGhostId,
        selectGhost,
        possibleGhosts,
        filterOptions,
        toggleEvidenceInclusion,
        toggleSpeedFilter,
        toggleLOSFilter,
        updateSanityThreshold,
        resetFilters,
        refreshFromAPI,
        getEvidenceInclusionState,
        isGuaranteedEvidence,
        getPossibleEvidenceCombinations,
      }}
    >
      {children}
    </GhostContext.Provider>
  );
}

// Hook para usar o contexto
export function useGhost() {
  const context = useContext(GhostContext);
  if (!context) {
    throw new Error("useGhost deve ser usado dentro de um GhostProvider");
  }
  return context;
}
