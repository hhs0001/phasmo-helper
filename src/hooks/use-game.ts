import { useCallback } from "react";
import { useGameStore } from "@/stores/game-store";
import { useGhostData } from "@/hooks/use-ghost";
import { toast } from "sonner";
import { deleteGameSession } from "@/lib/game-tracker";

/**
 * Hook personalizado para gerenciar o estado de jogos do Phasmophobia
 * Fornece métodos úteis para a interface do usuário interagir com a game store
 */
export function useGame() {
  const gameStore = useGameStore();
  // Usando useGhostData em vez de useGhostStore diretamente para obter ghostsMap
  const { ghostsMap } = useGhostData();

  // Verifica se há um jogo ativo
  const isGameActive = gameStore.isGameActive;

  // Estado do jogo atual e histórico
  const currentGame = gameStore.currentGame;
  const isLoading = gameStore.isLoading;
  const gameHistory = gameStore.gameHistory;

  // Estatísticas gerais
  const gameStats = gameStore.gameStats;

  // Função para atualizar estatísticas
  const refreshStats = useCallback(async () => {
    await gameStore.refreshStats();
  }, [gameStore]);

  // Inicia um novo jogo
  const startGame = useCallback(async () => {
    try {
      await gameStore.startNewGame();
      toast.success("Nova investigação iniciada!");
    } catch (error) {
      toast.error("Erro ao iniciar a investigação");
      console.error("Erro ao iniciar jogo:", error);
    }
  }, [gameStore]);

  // Finaliza o jogo atual
  const endGame = useCallback(async () => {
    if (!isGameActive) {
      toast.error("Não há investigação em andamento.");
      return;
    }

    try {
      await gameStore.endCurrentGame();
      toast.info("Investigação encerrada.");
    } catch (error) {
      toast.error("Erro ao encerrar a investigação");
      console.error("Erro ao finalizar jogo:", error);
    }
  }, [isGameActive, gameStore]);

  // Reseta o jogo atual
  const resetGame = useCallback(async () => {
    if (!isGameActive) {
      toast.error("Não há investigação em andamento.");
      return;
    }

    try {
      await gameStore.resetCurrentGame();
      toast.info("Investigação reiniciada.");
    } catch (error) {
      toast.error("Erro ao reiniciar a investigação");
      console.error("Erro ao reiniciar jogo:", error);
    }
  }, [isGameActive, gameStore]);

  // Marca se o jogador morreu
  const setPlayerDied = useCallback(
    async (died: boolean) => {
      if (!isGameActive) {
        toast.error("Inicie uma investigação primeiro.");
        return;
      }

      try {
        await gameStore.markPlayerDied(died);
        // Removemos as mensagens toast para deixar a interface mais limpa
      } catch (error) {
        toast.error("Erro ao atualizar estado de morte");
        console.error("Erro ao atualizar estado de morte:", error);
      }
    },
    [isGameActive, gameStore]
  );

  // Registra um palpite de fantasma
  const guessGhost = useCallback(
    async (ghostId: string) => {
      if (!isGameActive) {
        toast.error("Inicie uma investigação primeiro.");
        return;
      }

      try {
        const ghostName = ghostsMap[ghostId]?.name || "Desconhecido";
        await gameStore.guessGhost(ghostId);
        toast.info(`Seu palpite: ${ghostName}`);
      } catch (error) {
        toast.error("Erro ao registrar palpite");
        console.error("Erro ao registrar palpite:", error);
      }
    },
    [isGameActive, ghostsMap, gameStore]
  );

  // Confirma qual era o fantasma real
  const confirmActualGhost = useCallback(
    async (ghostId: string) => {
      if (!isGameActive) {
        toast.error("Inicie uma investigação primeiro.");
        return;
      }

      try {
        const guessedGhostId = gameStore.getGuessedGhostId();
        const ghostName = ghostsMap[ghostId]?.name || "Desconhecido";
        const wasCorrect = guessedGhostId === ghostId;

        await gameStore.confirmActualGhost(ghostId);

        if (wasCorrect) {
          toast.success(`Acertou! Era mesmo um ${ghostName}!`);
        } else if (guessedGhostId) {
          const guessedName = ghostsMap[guessedGhostId]?.name || "Desconhecido";
          toast.error(`Errou! Era um ${ghostName}, não um ${guessedName}.`);
        } else {
          toast.info(`Era um ${ghostName}, mas você não deu um palpite.`);
        }
      } catch (error) {
        toast.error("Erro ao confirmar fantasma");
        console.error("Erro ao confirmar fantasma:", error);
      }
    },
    [isGameActive, ghostsMap, gameStore]
  );

  // Verifica se um fantasma foi escolhido como palpite
  const isGhostGuessed = useCallback(
    (ghostId: string) => {
      return gameStore.isGhostGuessed(ghostId);
    },
    [gameStore]
  );

  // Verifica se um fantasma foi confirmado como o real
  const isGhostConfirmed = useCallback(
    (ghostId: string) => {
      return gameStore.isConfirmedGhost(ghostId);
    },
    [gameStore]
  );

  // Verifica se o jogador está morto no jogo atual
  const isPlayerDead = useCallback(() => {
    return currentGame?.died === true;
  }, [currentGame]);

  // Obtém informações sobre o jogo atual
  const getGameInfo = useCallback(() => {
    if (!currentGame) {
      return {
        isActive: false,
        duration: 0,
        died: false,
        guessedGhost: null,
        actualGhost: null,
      };
    }

    const guessedGhost = currentGame.guessedGhostId
      ? ghostsMap[currentGame.guessedGhostId]
      : null;

    const actualGhost = currentGame.actualGhostId
      ? ghostsMap[currentGame.actualGhostId]
      : null;

    return {
      isActive: true,
      duration: gameStore.getGameDuration() || 0,
      died: currentGame.died,
      guessedGhost,
      actualGhost,
    };
  }, [currentGame, ghostsMap, gameStore]);

  // Carrega o histórico de jogos
  const loadHistory = useCallback(async () => {
    try {
      await gameStore.loadHistory();
    } catch (error) {
      toast.error("Erro ao carregar histórico de jogos");
      console.error("Erro ao carregar histórico:", error);
    }
  }, [gameStore]);

  // Exclui um registro de jogo
  const deleteGame = useCallback(
    async (gameId: string) => {
      try {
        // Remove o jogo do banco de dados
        await deleteGameSession(gameId);

        // Se o jogo atual for o que está sendo excluído, limpe o estado do jogo atual
        if (currentGame?.id === gameId) {
          gameStore.endCurrentGame();
        }

        return true;
      } catch (error) {
        console.error("Erro ao excluir jogo:", error);
        throw error;
      }
    },
    [currentGame, gameStore]
  );

  return {
    // Estado
    isGameActive,
    currentGame,
    gameStats,
    gameHistory,
    isLoading,

    // Ações
    startGame,
    endGame,
    resetGame,
    setPlayerDied,
    guessGhost,
    confirmActualGhost,
    loadHistory,
    refreshStats,
    deleteGame,

    // Auxiliares
    isGhostGuessed,
    isGhostConfirmed,
    isPlayerDead,
    getGameInfo,
  };
}
