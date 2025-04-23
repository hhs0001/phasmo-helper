import { useGhostStore } from "@/stores/ghost-store";
import {
  Ghost,
  Evidence,
  GameMode,
  InclusionState,
  SpeedCategory,
} from "@/types/ghost-schema";

/**
 * Hook personalizado para acessar e manipular os dados dos fantasmas do Phasmophobia
 * Abstrai o acesso ao contexto e fornece métodos úteis para a interface do usuário
 */
export function useGhostData() {
  const state = useGhostStore();

  const selectedGhost = state.selectedGhostId
    ? state.ghostData.ghosts[state.selectedGhostId]
    : null;

  // Mapa de todos os fantasmas para acesso rápido
  const ghostsMap = state.ghostData.ghosts || {};

  // Data da última atualização
  const lastUpdate = state.ghostData.lastUpdate;

  // Evidencias disponíveis para filtro
  const allEvidences: Evidence[] = [
    "EMF",
    "SpiritBox",
    "Fingerprints",
    "GhostOrb",
    "GhostWriting",
    "FreezingTemps",
    "DotsProjector",
  ];

  // Tradução de evidências
  const evidenceTranslation: Record<Evidence, string> = {
    EMF: "EMF Nível 5",
    SpiritBox: "Spirit Box",
    Fingerprints: "Impressões Digitais",
    GhostOrb: "Orbe Fantasma",
    GhostWriting: "Escrita Fantasma",
    FreezingTemps: "Temperaturas Baixas",
    DotsProjector: "D.O.T.S.",
  };

  // Tradução de modos de jogo
  const gameModeTranslation: Record<GameMode, string> = {
    Amateur: "Amador",
    Intermediate: "Intermediário",
    Professional: "Profissional",
    Nightmare: "Pesadelo",
    Insanity: "Insanidade",
  };

  // Tradução dos estados de inclusão
  const inclusionStateTranslation: Record<InclusionState, string> = {
    include: "Incluir",
    exclude: "Excluir",
    neutral: "Neutro",
  };

  // Função para formatar a descrição de velocidade
  const formatSpeedDescription = (ghost: Ghost): string => {
    // Obter a velocidade base em m/s
    const baseSpeed = ghost.speedDetails.baseSpeed;

    // Se o fantasma tem LoS e multiplicador, mostrar o intervalo de velocidade
    if (ghost.hasLOS && ghost.speedDetails.losMultiplier) {
      const maxSpeed = baseSpeed * ghost.speedDetails.losMultiplier;
      return `${baseSpeed.toFixed(1)} - ${maxSpeed.toFixed(1)} m/s`;
    }

    // Se tem velocidade variável, indicar isso
    if (ghost.speedDetails.variableSpeed) {
      return `${baseSpeed.toFixed(1)} m/s (variável)`;
    }

    // Caso padrão: apenas a velocidade base
    return `${baseSpeed.toFixed(1)} m/s`;
  };

  // Função para formatar o limiar de sanidade
  const formatSanityThreshold = (ghost: Ghost): string => {
    return `${ghost.huntThreshold}%`;
  };

  // Função para obter as categorias de velocidade do fantasma
  const getSpeedCategories = (ghost: Ghost): SpeedCategory[] => {
    const { min, max } = ghost.speedRange;
    const toCategory = (v: number): SpeedCategory =>
      v <= 1.5 ? "slow" : v <= 3 ? "normal" : "fast";
    const cats = new Set<SpeedCategory>([toCategory(min), toCategory(max)]);
    return Array.from(cats);
  };

  // Função para obter o ícone do estado de inclusão
  const getInclusionStateIcon = (state: InclusionState): string => {
    switch (state) {
      case "include":
        return "✓";
      case "exclude":
        return "✗";
      default:
        return "○";
    }
  };

  return {
    // Estados
    gameMode: state.gameMode,
    ghostData: state.ghostData,
    isLoading: state.isLoading,
    error: state.error,
    selectedGhost,
    ghostsMap,
    lastUpdate,
    possibleGhosts: state.possibleGhosts,
    filterOptions: state.filterOptions,
    allEvidences,
    evidenceTranslation,
    gameModeTranslation,
    inclusionStateTranslation,

    // Ações
    setGameMode: state.setGameMode,
    selectGhost: state.selectGhost,
    toggleEvidenceInclusion: state.toggleEvidenceInclusion,
    updateSpeedFilter: state.updateSpeedFilter,
    toggleLOSFilter: state.toggleLOSFilter,
    updateSanityThreshold: state.updateSanityThreshold,
    resetFilters: state.resetFilters,
    refreshFromAPI: state.refreshFromAPI,

    // Funções auxiliares
    getEvidenceInclusionState: state.getEvidenceInclusionState,
    getInclusionStateIcon,
    getSpeedCategories,
    isGuaranteedEvidence: state.isGuaranteedEvidence,
    getPossibleEvidenceCombinations: state.getPossibleEvidenceCombinations,
    formatSpeedDescription,
    formatSanityThreshold,
  };
}

/**
 * Hook personalizado para acessar e manipular os dados de fantasmas
 * Abstrai o acesso ao Zustand Store e fornece uma API consistente com a versão anterior
 */
export function useGhost() {
  const state = useGhostStore();

  return {
    // Estados
    gameMode: state.gameMode,
    ghostData: state.ghostData,
    isLoading: state.isLoading,
    error: state.error,
    selectedGhostId: state.selectedGhostId,
    possibleGhosts: state.possibleGhosts,
    filterOptions: state.filterOptions,

    // Ações
    setGameMode: state.setGameMode,
    selectGhost: state.selectGhost,
    toggleEvidenceInclusion: state.toggleEvidenceInclusion,
    updateSpeedFilter: state.updateSpeedFilter,
    toggleLOSFilter: state.toggleLOSFilter,
    updateSanityThreshold: state.updateSanityThreshold,
    resetFilters: state.resetFilters,
    refreshFromAPI: state.refreshFromAPI,

    // Funções auxiliares
    getEvidenceInclusionState: state.getEvidenceInclusionState,
    isGuaranteedEvidence: state.isGuaranteedEvidence,
    getPossibleEvidenceCombinations: state.getPossibleEvidenceCombinations,
  };
}
