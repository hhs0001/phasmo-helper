import { useGhost } from "@/contexts/ghost-context";
import type {
  Evidence,
  Ghost,
  GameMode,
  InclusionState,
  GhostSpeed,
} from "@/contexts/ghost-context";

/**
 * Hook personalizado para acessar e manipular os dados dos fantasmas do Phasmophobia
 * Abstrai o acesso ao contexto e fornece métodos úteis para a interface do usuário
 */
export function useGhostData() {
  const {
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
  } = useGhost();

  const selectedGhost = selectedGhostId
    ? ghostData.ghosts[selectedGhostId]
    : null;

  // Mapa de todos os fantasmas para acesso rápido
  const ghostsMap = ghostData.ghosts || {};

  // Data da última atualização
  const lastUpdate = ghostData.lastUpdate;

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

  // Tradução de velocidades
  const speedTranslations: Record<GhostSpeed, string> = {
    verySlow: "Muito Lento",
    slow: "Lento",
    normal: "Normal",
    fast: "Rápido",
    veryFast: "Muito Rápido",
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

  // Função para verificar se uma evidência é garantida para um fantasma
  const isGuaranteedEvidence = (ghost: Ghost, evidence: Evidence): boolean => {
    return ghost.guaranteedEvidences?.includes(evidence) || false;
  };

  // Função para obter combinações de evidências possíveis no modo pesadelo/insanidade
  const getPossibleEvidenceCombinations = (
    ghost: Ghost,
    mode: GameMode
  ): Evidence[][] => {
    const guaranteedEvidences = ghost.guaranteedEvidences || [];
    const normalEvidences = ghost.evidences.filter(
      (ev) => !guaranteedEvidences.includes(ev)
    );

    // No modo normal, todas as evidências estão visíveis
    if (mode !== "Nightmare" && mode !== "Insanity") {
      return [ghost.evidences];
    }

    // Número de evidências visíveis além das garantidas
    const visibleNormalEvidences = mode === "Nightmare" ? 2 : 1;

    // Se o número de evidências normais é menor ou igual ao número de evidências visíveis
    // então todas as combinações possíveis são as evidências normais juntamente com as garantidas
    if (normalEvidences.length <= visibleNormalEvidences) {
      return [ghost.evidences];
    }

    // Caso contrário, precisamos calcular todas as combinações possíveis
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
    generateCombinations(
      0,
      [],
      Math.min(visibleNormalEvidences, normalEvidences.length)
    );

    return combinations;
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

  // Função para obter a tradução da velocidade do fantasma
  const getSpeedTranslation = (ghost: Ghost): string => {
    return (
      speedTranslations[ghost.speed] +
      (ghost.hasLOS ? " (acelera com LOS)" : "")
    );
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
    gameMode,
    setGameMode,
    ghostData,
    ghostsMap,
    isLoading,
    error,
    selectedGhost,
    selectGhost,
    possibleGhosts,
    allEvidences,
    evidenceTranslation,
    speedTranslations,
    gameModeTranslation,
    inclusionStateTranslation,
    filterOptions,
    toggleEvidenceInclusion,
    toggleSpeedFilter,
    toggleLOSFilter,
    updateSanityThreshold,
    resetFilters,
    refreshFromAPI,
    getEvidenceInclusionState,
    getInclusionStateIcon,
    getSpeedTranslation,
    isGuaranteedEvidence,
    getPossibleEvidenceCombinations,
    formatSpeedDescription,
    formatSanityThreshold,
    lastUpdate,
  };
}
