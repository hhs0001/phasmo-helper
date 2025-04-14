import { create } from "zustand";
import {
  GameSession,
  GameStats,
  generateGameSessionId,
  loadGameHistory,
  saveGameSession,
  updateGameSession,
  fetchGameStats,
} from "@/lib/game-tracker";

interface GameState {
  // Estado do jogo atual
  currentGame: GameSession | null;
  gameHistory: GameSession[];
  gameStats: GameStats;
  isGameActive: boolean;
  isLoading: boolean;

  // Ações para manipular o jogo atual
  startNewGame: () => Promise<void>;
  endCurrentGame: () => Promise<void>;
  resetCurrentGame: () => Promise<void>;
  markPlayerDied: (died: boolean) => Promise<void>;

  // Ações para registrar palpites
  guessGhost: (ghostId: string) => Promise<void>;
  confirmActualGhost: (ghostId: string) => Promise<void>;

  // Ações para gerenciar histórico
  loadHistory: () => Promise<void>;
  refreshStats: () => Promise<void>;

  // Getters
  getCurrentGameId: () => string | undefined;
  getStats: () => GameStats;
  getGuessedGhostId: () => string | undefined;
  isGhostGuessed: (ghostId: string) => boolean;
  isConfirmedGhost: (ghostId: string) => boolean;
  getGameDuration: () => number | undefined; // em minutos
}

const initialStats: GameStats = {
  totalGames: 0,
  correctGuesses: 0,
  incorrectGuesses: 0,
  deaths: 0,
  winRate: 0,
};

export const useGameStore = create<GameState>((set, get) => {
  // Carregar estatísticas iniciais apenas uma vez, sem carregar todo o histórico
  fetchGameStats()
    .then((stats) => {
      set({
        gameStats: stats,
        isLoading: false,
      });
    })
    .catch((err) => {
      console.error("Erro ao carregar estatísticas iniciais:", err);
      set({ isLoading: false });
    });

  return {
    // Estado inicial
    currentGame: null,
    gameHistory: [], // Começamos com um array vazio, carregamos sob demanda apenas quando necessário
    gameStats: initialStats,
    isGameActive: false,
    isLoading: true,

    // Ações
    startNewGame: async () => {
      // Se já existe um jogo ativo, finaliza ele primeiro
      const currentGame = get().currentGame;
      if (currentGame && !currentGame.endTime) {
        await get().endCurrentGame();
      }

      try {
        // Criar novo ID sequencial
        const newId = await generateGameSessionId();

        const newGame: GameSession = {
          id: newId,
          startTime: new Date(),
          died: false,
        };

        // Salva a nova sessão no banco de dados
        await saveGameSession(newGame);

        set({
          currentGame: newGame,
          isGameActive: true,
        });
      } catch (error) {
        console.error("Erro ao iniciar novo jogo:", error);
      }
    },

    endCurrentGame: async () => {
      const currentGame = get().currentGame;

      if (!currentGame) return;

      const completedGame: GameSession = {
        ...currentGame,
        endTime: new Date(),
      };

      // Verifica se o palpite estava correto
      if (completedGame.guessedGhostId && completedGame.actualGhostId) {
        completedGame.wasCorrect =
          completedGame.guessedGhostId === completedGame.actualGhostId;
      }

      try {
        // Atualiza o jogo no banco de dados
        await updateGameSession(completedGame);

        // Atualiza apenas as estatísticas, sem recarregar o histórico completo
        const updatedStats = await fetchGameStats();

        // Se o histórico foi carregado previamente, adicionamos o jogo finalizado ao início
        // para manter o estado atualizado sem precisar recarregar o histórico completo
        set((state) => {
          const updatedHistory =
            state.gameHistory.length > 0
              ? [
                  completedGame,
                  ...state.gameHistory.filter(
                    (game) => game.id !== completedGame.id
                  ),
                ]
              : state.gameHistory; // Mantenha como está se ainda não foi carregado

          return {
            currentGame: null,
            isGameActive: false,
            gameHistory: updatedHistory,
            gameStats: updatedStats,
          };
        });
      } catch (error) {
        console.error("Erro ao finalizar jogo:", error);
      }
    },

    resetCurrentGame: async () => {
      const { isGameActive } = get();
      const currentGame = get().currentGame;

      if (isGameActive && currentGame) {
        // Finaliza o jogo atual marcando-o como encerrado
        const completedGame: GameSession = {
          ...currentGame,
          endTime: new Date(),
        };

        try {
          // Atualiza o jogo atual no banco de dados
          await updateGameSession(completedGame);

          // Criar novo ID sequencial
          const newId = await generateGameSessionId();

          // Cria um novo jogo
          const resetGame: GameSession = {
            id: newId,
            startTime: new Date(),
            died: false,
          };

          // Salva o novo jogo no banco de dados
          await saveGameSession(resetGame);

          // Como apenas estamos reiniciando, não precisamos recarregar o histórico
          set({
            currentGame: resetGame,
          });
        } catch (error) {
          console.error("Erro ao reiniciar jogo:", error);
        }
      }
    },

    markPlayerDied: async (died: boolean) => {
      const currentGame = get().currentGame;

      if (!currentGame) return;

      const updatedGame = {
        ...currentGame,
        died,
      };

      try {
        // Atualiza a sessão no banco de dados
        await updateGameSession(updatedGame);

        set({
          currentGame: updatedGame,
        });
      } catch (error) {
        console.error("Erro ao atualizar estado de morte:", error);
      }
    },

    guessGhost: async (ghostId: string) => {
      const currentGame = get().currentGame;

      if (!currentGame) return;

      const updatedGame = {
        ...currentGame,
        guessedGhostId: ghostId,
      };

      try {
        // Atualiza a sessão no banco de dados
        await updateGameSession(updatedGame);

        set({
          currentGame: updatedGame,
        });
      } catch (error) {
        console.error("Erro ao registrar palpite:", error);
      }
    },

    confirmActualGhost: async (ghostId: string) => {
      const currentGame = get().currentGame;

      if (!currentGame) return;

      const updatedGame = {
        ...currentGame,
        actualGhostId: ghostId,
        wasCorrect: currentGame.guessedGhostId === ghostId,
      };

      try {
        // Atualiza a sessão no banco de dados
        await updateGameSession(updatedGame);

        set({
          currentGame: updatedGame,
        });
      } catch (error) {
        console.error("Erro ao confirmar fantasma real:", error);
      }
    },

    loadHistory: async () => {
      set({ isLoading: true });

      try {
        const history = await loadGameHistory();
        const stats = await fetchGameStats();

        set({
          gameHistory: history,
          gameStats: stats,
          isLoading: false,
        });
      } catch (error) {
        console.error("Erro ao carregar histórico de jogos:", error);
        set({ isLoading: false });
      }
    },

    refreshStats: async () => {
      try {
        const stats = await fetchGameStats();
        set({ gameStats: stats });
      } catch (error) {
        console.error("Erro ao atualizar estatísticas:", error);
      }
    },

    // Getters
    getCurrentGameId: () => {
      const currentGame = get().currentGame;
      return currentGame?.id;
    },

    getStats: () => {
      return get().gameStats;
    },

    getGuessedGhostId: () => {
      const currentGame = get().currentGame;
      return currentGame?.guessedGhostId;
    },

    isGhostGuessed: (ghostId: string) => {
      const currentGame = get().currentGame;
      if (!currentGame) return false;

      const currentGuess = currentGame.guessedGhostId;
      return currentGuess === ghostId;
    },

    isConfirmedGhost: (ghostId: string) => {
      const currentGame = get().currentGame;
      if (!currentGame) return false;

      const actualGhost = currentGame.actualGhostId;
      return actualGhost === ghostId;
    },

    getGameDuration: () => {
      const currentGame = get().currentGame;

      if (!currentGame) return undefined;

      const endTime = currentGame.endTime || new Date();
      const durationMs = endTime.getTime() - currentGame.startTime.getTime();
      return Math.floor(durationMs / (1000 * 60)); // Converte para minutos
    },
  };
});
