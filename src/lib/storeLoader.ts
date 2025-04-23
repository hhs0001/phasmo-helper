import { load } from "@tauri-apps/plugin-store";
import { fetch } from "@tauri-apps/plugin-http";
import {
  GhostSchema,
  GhostDataSchema,
  type Ghost,
  type GhostData,
} from "@/types/ghost-schema";

// Declarar as variáveis das stores
let store: Awaited<ReturnType<typeof load>> | null = null;
let ghostStore: Awaited<ReturnType<typeof load>> | null = null;

// Função de inicialização das stores
async function initializeStores() {
  store = await load("store.json", { autoSave: true });
  ghostStore = await load("ghost.json", { autoSave: true });
  return { store, ghostStore };
}

// Inicializar as stores
const storesPromise = initializeStores();

// Função auxiliar para garantir que as stores estejam inicializadas
async function ensureStoresInitialized() {
  if (!store || !ghostStore) {
    const { store: initializedStore, ghostStore: initializedGhostStore } =
      await storesPromise;
    store = initializedStore;
    ghostStore = initializedGhostStore;
  }
}

export async function setConfig(key: string, value: any): Promise<void> {
  await ensureStoresInitialized();
  await store!.set(key, value);
}

export async function getConfig(key: string): Promise<any> {
  await ensureStoresInitialized();
  return await store!.get(key);
}

export async function setGhost(key: string, value: any): Promise<void> {
  await ensureStoresInitialized();
  await ghostStore!.set(key, value);
}

// URL da API de dados do Phasmophobia
const GHOST_API_URL =
  "https://raw.githubusercontent.com/hhs0001/phasmo-helper-data/refs/heads/main/ghosts/pt-br.json";

export async function getGhost(
  forceUpdate: boolean = false
): Promise<GhostData> {
  await ensureStoresInitialized();

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
      const ghostsData = await response.json();

      // Validar os dados recebidos com Zod
      let validatedGhosts: Ghost[] = [];

      try {
        // Tentamos validar o array de fantasmas
        validatedGhosts = ghostsData.map((ghost: any) =>
          GhostSchema.parse(ghost)
        );
      } catch (validationError) {
        console.error(
          "Erro na validação dos dados dos fantasmas:",
          validationError
        );
        throw new Error("Os dados da API não estão no formato esperado");
      }

      // Converter o array de fantasmas para um objeto indexado por ID
      const ghostsById: Record<string, Ghost> = {};
      for (const ghost of validatedGhosts) {
        ghostsById[ghost.id] = ghost;
      }

      // Atualizar o armazenamento com os novos dados
      const currentTimestamp = new Date().toISOString();
      await ghostStore!.set("ghosts", ghostsById);
      await ghostStore!.set("lastUpdate", currentTimestamp);

      // Criar e validar o objeto de dados completo
      const ghostData: GhostData = {
        ghosts: ghostsById,
        lastUpdate: currentTimestamp,
      };

      // Validar o objeto completo
      return GhostDataSchema.parse(ghostData);
    }

    // Obter os dados dos fantasmas do armazenamento local
    const ghosts =
      ((await ghostStore!.get("ghosts")) as Record<string, Ghost>) || {};
    const lastUpdate =
      ((await ghostStore!.get("lastUpdate")) as string | null) || null;

    // Criar o objeto de dados
    const ghostData: GhostData = {
      ghosts,
      lastUpdate,
    };

    // Validar e retornar os dados
    return GhostDataSchema.parse(ghostData);
  } catch (error) {
    console.error("Erro ao obter dados dos fantasmas:", error);

    // Em caso de erro, retornar os dados armazenados localmente
    const ghosts =
      ((await ghostStore!.get("ghosts")) as Record<string, Ghost>) || {};
    const lastUpdate =
      ((await ghostStore!.get("lastUpdate")) as string | null) || null;

    //testa o schema para ver se o local está atualizado:
    try {
      GhostDataSchema.parse({ ghosts, lastUpdate });
    } catch (validationError) {
      console.error(
        "Erro na validação dos dados dos fantasmas armazenados localmente:",
        validationError
      );
      throw new Error("Os dados locais não estão no formato esperado");
    }
    return {
      ghosts,
      lastUpdate,
    };
  }
}
