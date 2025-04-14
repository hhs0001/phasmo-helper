import Database from "@tauri-apps/plugin-sql";

// Nome do arquivo do banco de dados SQLite
const DB_FILE = "sqlite:phasmo_games.db";

export interface GameStats {
  totalGames: number;
  correctGuesses: number;
  incorrectGuesses: number;
  deaths: number;
  winRate: number;
}

export interface GameSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  guessedGhostId?: string;
  actualGhostId?: string;
  wasCorrect?: boolean;
  died: boolean;
  mapName?: string;
}

// Alias de tipo para os resultados de consultas SQL
export type SQLiteResult = Record<string, any>[];

/**
 * Conecta ao banco de dados SQLite
 */
export async function getDatabase(): Promise<Database> {
  try {
    return await Database.load(DB_FILE);
  } catch (error) {
    console.error("Erro ao conectar ao banco de dados:", error);
    throw new Error("Falha ao conectar ao banco de dados SQLite");
  }
}

/**
 * Gera um ID sequencial para a sessão de jogo
 * Usa o timestamp atual com um prefixo para garantir unicidade
 */
export async function generateGameSessionId(): Promise<string> {
  try {
    const db = await getDatabase();
    // Obter o próximo ID disponível
    const result = await db.select<[{ count: number }]>(
      "SELECT COUNT(*) as count FROM game_sessions"
    );
    const nextId = result[0].count + 1;

    // Formato: game_SEQUENCIAL_TIMESTAMP
    // O timestamp garante unicidade mesmo se dois jogos forem criados quase simultaneamente
    return `game_${nextId}_${Date.now()}`;
  } catch (error) {
    console.error("Erro ao gerar ID sequencial:", error);
    // Fallback para um método seguro caso haja erro
    return `game_fallback_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
  }
}

/**
 * Converte uma data para string ISO para armazenamento no SQLite
 */
function dateToSQLite(date?: Date): string | null {
  return date ? date.toISOString() : null;
}

/**
 * Converte uma string ISO do SQLite para objeto Date
 */
function sqliteToDate(dateStr: string | null): Date | undefined {
  return dateStr ? new Date(dateStr) : undefined;
}

/**
 * Converte um valor booleano para inteiro para armazenamento no SQLite
 */
function boolToSQLite(value?: boolean): number | null {
  if (value === undefined || value === null) return null;
  return value ? 1 : 0;
}

/**
 * Converte um inteiro do SQLite para valor booleano
 */
function sqliteToBool(value: number | null): boolean | undefined {
  if (value === null) return undefined;
  return value === 1;
}

/**
 * Interface para dados de sessão formatados para SQLite
 */
interface SQLiteSessionData {
  id: string;
  start_time: string | null;
  end_time: string | null;
  guessed_ghost_id: string | null;
  actual_ghost_id: string | null;
  was_correct: number | null;
  died: number;
  map_name: string | null;
}

/**
 * Converte um objeto GameSession para formato compatível com SQLite
 */
function sessionToSQLite(session: GameSession): SQLiteSessionData {
  return {
    id: session.id,
    start_time: dateToSQLite(session.startTime),
    end_time: dateToSQLite(session.endTime),
    guessed_ghost_id: session.guessedGhostId || null,
    actual_ghost_id: session.actualGhostId || null,
    was_correct: boolToSQLite(session.wasCorrect),
    died: session.died ? 1 : 0,
    map_name: session.mapName || null,
  };
}

/**
 * Converte um registro do SQLite para objeto GameSession
 */
function sqliteToSession(record: Record<string, any>): GameSession {
  return {
    id: record.id,
    startTime: sqliteToDate(record.start_time) || new Date(),
    endTime: sqliteToDate(record.end_time),
    guessedGhostId: record.guessed_ghost_id || undefined,
    actualGhostId: record.actual_ghost_id || undefined,
    wasCorrect: sqliteToBool(record.was_correct),
    died: record.died === 1,
    mapName: record.map_name || undefined,
  };
}

/**
 * Salva uma sessão de jogo no banco de dados
 */
export async function saveGameSession(session: GameSession): Promise<void> {
  try {
    const db = await getDatabase();
    const sessionData = sessionToSQLite(session);

    await db.execute(
      `INSERT OR REPLACE INTO game_sessions 
        (id, start_time, end_time, guessed_ghost_id, actual_ghost_id, was_correct, died, map_name) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        sessionData.id,
        sessionData.start_time,
        sessionData.end_time,
        sessionData.guessed_ghost_id,
        sessionData.actual_ghost_id,
        sessionData.was_correct,
        sessionData.died,
        sessionData.map_name,
      ]
    );
  } catch (error) {
    console.error("Erro ao salvar sessão de jogo:", error);
    throw new Error("Falha ao salvar sessão de jogo no banco de dados");
  }
}

/**
 * Carrega todas as sessões de jogo do banco de dados
 */
export async function loadGameHistory(): Promise<GameSession[]> {
  try {
    const db = await getDatabase();
    const result = await db.select<SQLiteResult>(
      "SELECT * FROM game_sessions ORDER BY start_time DESC"
    );

    return result.map(sqliteToSession);
  } catch (error) {
    console.error("Erro ao carregar histórico de jogos:", error);
    return [];
  }
}

/**
 * Carrega as sessões de jogo recentes do banco de dados (últimos 30 dias)
 */
export async function loadRecentGameHistory(
  days: number = 30
): Promise<GameSession[]> {
  try {
    const db = await getDatabase();
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - days);

    const result = await db.select<SQLiteResult>(
      "SELECT * FROM game_sessions WHERE start_time > $1 ORDER BY start_time DESC",
      [dateToSQLite(daysAgo)]
    );

    return result.map(sqliteToSession);
  } catch (error) {
    console.error("Erro ao carregar histórico recente de jogos:", error);
    return [];
  }
}

/**
 * Atualiza uma sessão de jogo existente no banco de dados
 */
export async function updateGameSession(session: GameSession): Promise<void> {
  try {
    const db = await getDatabase();
    const sessionData = sessionToSQLite(session);

    await db.execute(
      `UPDATE game_sessions SET 
        start_time = $1, 
        end_time = $2, 
        guessed_ghost_id = $3, 
        actual_ghost_id = $4, 
        was_correct = $5, 
        died = $6, 
        map_name = $7 
       WHERE id = $8`,
      [
        sessionData.start_time,
        sessionData.end_time,
        sessionData.guessed_ghost_id,
        sessionData.actual_ghost_id,
        sessionData.was_correct,
        sessionData.died,
        sessionData.map_name,
        sessionData.id,
      ]
    );
  } catch (error) {
    console.error("Erro ao atualizar sessão de jogo:", error);
    throw new Error("Falha ao atualizar sessão de jogo no banco de dados");
  }
}

/**
 * Exclui uma sessão de jogo do banco de dados
 */
export async function deleteGameSession(sessionId: string): Promise<void> {
  try {
    const db = await getDatabase();
    await db.execute("DELETE FROM game_sessions WHERE id = $1", [sessionId]);
  } catch (error) {
    console.error("Erro ao excluir sessão de jogo:", error);
    throw new Error("Falha ao excluir sessão de jogo do banco de dados");
  }
}

/**
 * Calcula estatísticas baseadas no histórico de jogos
 */
export function calculateGameStats(gameSessions: GameSession[]): GameStats {
  const totalGames = gameSessions.length;
  // Removida a variável completedGames que não estava sendo utilizada
  const correctGuesses = gameSessions.filter(
    (game) => game.wasCorrect === true
  ).length;
  const incorrectGuesses = gameSessions.filter(
    (game) => game.wasCorrect === false
  ).length;
  const deaths = gameSessions.filter((game) => game.died).length;

  // Calcula a taxa de vitória apenas para jogos completos com um palpite
  const gamesWithGuess = gameSessions.filter(
    (game) => game.guessedGhostId !== undefined
  );
  const winRate =
    gamesWithGuess.length > 0
      ? (correctGuesses / gamesWithGuess.length) * 100
      : 0;

  return {
    totalGames,
    correctGuesses,
    incorrectGuesses,
    deaths,
    winRate,
  };
}

/**
 * Formata uma data para exibição
 */
export function formatGameDate(date: Date): string {
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Busca estatísticas de jogos diretamente do banco de dados
 * Esta função é mais eficiente para calcular estatísticas porque usa SQL
 */
export async function fetchGameStats(): Promise<GameStats> {
  try {
    const db = await getDatabase();

    // Obtém contagens direto do banco de dados
    const totalResult = await db.select<[{ count: number }]>(
      "SELECT COUNT(*) as count FROM game_sessions"
    );
    const correctResult = await db.select<[{ count: number }]>(
      "SELECT COUNT(*) as count FROM game_sessions WHERE was_correct = 1"
    );
    const incorrectResult = await db.select<[{ count: number }]>(
      "SELECT COUNT(*) as count FROM game_sessions WHERE was_correct = 0"
    );
    const deathsResult = await db.select<[{ count: number }]>(
      "SELECT COUNT(*) as count FROM game_sessions WHERE died = 1"
    );
    const guessedResult = await db.select<[{ count: number }]>(
      "SELECT COUNT(*) as count FROM game_sessions WHERE guessed_ghost_id IS NOT NULL"
    );

    const totalGames = totalResult[0].count;
    const correctGuesses = correctResult[0].count;
    const incorrectGuesses = incorrectResult[0].count;
    const deaths = deathsResult[0].count;
    const gamesWithGuess = guessedResult[0].count;

    const winRate =
      gamesWithGuess > 0 ? (correctGuesses / gamesWithGuess) * 100 : 0;

    return {
      totalGames,
      correctGuesses,
      incorrectGuesses,
      deaths,
      winRate,
    };
  } catch (error) {
    console.error("Erro ao buscar estatísticas de jogos:", error);
    return {
      totalGames: 0,
      correctGuesses: 0,
      incorrectGuesses: 0,
      deaths: 0,
      winRate: 0,
    };
  }
}
