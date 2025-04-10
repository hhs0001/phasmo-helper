import { load } from "@tauri-apps/plugin-store";
import { fetch } from "@tauri-apps/plugin-http";
import type { Ghost, GhostData } from "@/contexts/ghost-context";

const store = await load("store.json", { autoSave: true });

export async function setConfig(key: string, value: any): Promise<void> {
  await store.set(key, value);
}

export async function getConfig(key: string): Promise<any> {
  return await store.get(key);
}

const ghostStore = await load("ghost.json", { autoSave: true });

export async function setGhost(key: string, value: any): Promise<void> {
  await ghostStore.set(key, value);
}

// URL da API de dados do Phasmophobia
const GHOST_API_URL = "https://67f6ffce42d6c71cca63d338.mockapi.io/ghosts";

export async function getGhost(
  forceUpdate: boolean = false
): Promise<GhostData> {
  try {
    // Se for solicitada uma atualização forçada, buscar dados da API
    if (forceUpdate) {
      console.log("Buscando dados atualizados dos fantasmas da API...");

      // Fazer a requisição para a API
      const response = await fetch(GHOST_API_URL);

      if (!response.ok) {
        throw new Error(`Falha ao obter dados da API: ${response.status}`);
      }

      // Extrair os dados da resposta
      const ghostsData = (await response.json()) as Ghost[];

      // Converter o array de fantasmas para um objeto indexado por ID
      const ghostsById: Record<string, Ghost> = {};
      for (const ghost of ghostsData) {
        ghostsById[ghost.id] = ghost;
      }

      // Atualizar o armazenamento com os novos dados
      const currentTimestamp = new Date().toISOString();
      await ghostStore.set("ghosts", ghostsById);
      await ghostStore.set("lastUpdate", currentTimestamp);

      // Retornar os dados atualizados
      return {
        ghosts: ghostsById,
        lastUpdate: currentTimestamp,
      };
    }

    // Obter os dados dos fantasmas do armazenamento local
    const ghosts =
      ((await ghostStore.get("ghosts")) as Record<string, Ghost>) || {};
    const lastUpdate =
      ((await ghostStore.get("lastUpdate")) as string | null) || null;

    // Retornar no formato esperado pelo contexto
    return {
      ghosts,
      lastUpdate,
    };
  } catch (error) {
    console.error("Erro ao obter dados dos fantasmas:", error);

    // Em caso de erro, retornar os dados armazenados localmente
    const ghosts =
      ((await ghostStore.get("ghosts")) as Record<string, Ghost>) || {};
    const lastUpdate =
      ((await ghostStore.get("lastUpdate")) as string | null) || null;

    return {
      ghosts,
      lastUpdate,
    };
  }
}
