import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigationStore } from "@/stores/navigation-store";
import { useConfigStore } from "@/stores/config-store";
import { useGhost } from "@/hooks/use-ghost";
import { invoke } from "@tauri-apps/api/core";
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import { toast } from "sonner";
import { eventBus } from "@/lib/events";
import { Evidence } from "@/types/ghost-schema";

export function useKeybinds() {
  const { currentPage, setCurrentPage } = useNavigationStore();
  const config = useConfigStore((state) => state.config);
  const { toggleEvidenceInclusion, resetFilters } = useGhost();
  const [isActive, setIsActive] = useState(currentPage !== "Config");
  const listenerAttached = useRef(false);
  const lastConfigRef = useRef(config.keybinds);
  const keybindsProcessingRef = useRef(false);
  const initialRenderRef = useRef(true);

  // Mapeamento de IDs de keybinds (ações) para evidências
  const keybindActionToEvidence: Record<string, Evidence> = {
    EMF5: "EMF",
    DOTSProjector: "DotsProjector",
    GhostOrb: "GhostOrb",
    GhostWriting: "GhostWriting",
    Fingerprints: "Fingerprints",
    SpiritBox: "SpiritBox",
    Freezing: "FreezingTemps",
  };

  // Mapeamento de IDs de keybinds para ações de timer
  const keybindActionToTimerEvent: Record<string, string> = {
    huntTimer: "timer:start-hunt",
    smudgeTimer: "timer:start-smudge",
    colldownTimer: "timer:start-cooldown",
    huntTrack: "timer:start-hunt-track",
  };

  // Outras ações de keybinds
  const otherActions: Record<string, string> = {
    ghostSpeed: "ghostSpeed:calculate",
  };

  // Função para navegar para a página de fantasmas e selecionar a aba de velocidade
  const navigateToGhostSpeedTab = useCallback(() => {
    // Se não estivermos na página de fantasmas, vamos para ela
    if (currentPage !== "Ghosts") {
      setCurrentPage("Ghosts");
    }

    // Emitir um evento para selecionar a aba de velocidade
    // Este evento será capturado na página de fantasmas
    eventBus.emit("ghosts:selectSpeedTab");
  }, [currentPage, setCurrentPage]);

  const disableKeybinds = useCallback(async () => {
    if (keybindsProcessingRef.current) return;
    keybindsProcessingRef.current = true;

    try {
      await invoke("disable_keybinds");
      await invoke("remove_all_keybinds");
    } catch (error) {
      console.error("Erro ao desabilitar/remover keybinds no backend:", error);
      toast.error("Erro ao desabilitar atalhos", {
        description: "Não foi possível desabilitar os atalhos de teclado.",
      });
    } finally {
      keybindsProcessingRef.current = false;
    }
  }, []);

  const enableKeybinds = useCallback(async () => {
    if (!isActive || keybindsProcessingRef.current) return;
    keybindsProcessingRef.current = true;

    // Verificar se as configurações de keybinds realmente mudaram
    const configChanged = lastConfigRef.current !== config.keybinds;
    lastConfigRef.current = config.keybinds;

    // Se a configuração não mudou, não precisamos recarregar os atalhos
    if (!configChanged && !initialRenderRef.current) {
      keybindsProcessingRef.current = false;
      return;
    }

    initialRenderRef.current = false;

    try {
      // Garantir que todos os atalhos antigos sejam removidos antes de adicionar novos
      await invoke("disable_keybinds");
      await invoke("remove_all_keybinds");

      // Esperar um momento para garantir que o backend concluiu a remoção
      await new Promise((resolve) => setTimeout(resolve, 50));

      const keybindsData = Object.entries(config.keybinds)
        .filter(([_, keybind]) => keybind.enabled)
        .map(([id, keybind]) => {
          const keys = keybind.key.split("+");
          const formattedKeys = keys.map((key) => {
            // Normalizar nomes de teclas especiais
            if (key.toUpperCase() === "SPACE") return "Space";
            if (key.toUpperCase() === "CTRL") return "Ctrl";
            if (key.toUpperCase() === "ALT") return "Alt";
            if (key.toUpperCase() === "SHIFT") return "Shift";

            // Normalizar teclas de letras (A-Z)
            if (/^[A-Z]$/.test(key)) return key;
            if (/^[a-z]$/.test(key)) return key.toUpperCase();

            // Teclas de símbolos e números permanecem inalteradas
            return key;
          });

          const action = id;
          return [id, formattedKeys, action];
        });

      if (keybindsData.length === 0) {
        await invoke("enable_keybinds");
        return;
      }

      try {
        await invoke("add_keybinds_batch", { keybindsData });
        await invoke("enable_keybinds");
      } catch (batchError) {
        // Se falhar ao adicionar em lote, tente um por um
        console.warn(
          "Falha ao adicionar keybinds em lote, tentando individualmente:",
          batchError
        );

        // Removendo novamente para garantir
        await invoke("disable_keybinds");
        await invoke("remove_all_keybinds");

        // Adicionando um por um para identificar problemas específicos
        const addedIds = new Set();
        for (const [id, keys, action] of keybindsData) {
          // Pular IDs duplicados
          if (addedIds.has(id)) {
            console.warn(`Pulando keybind duplicado: ${id}`);
            continue;
          }

          try {
            await invoke("add_keybind", { id, keyStrings: keys, action });
            addedIds.add(id);
          } catch (individualError) {
            console.error(`Erro ao adicionar keybind ${id}:`, individualError);
            toast.error(`Erro ao adicionar atalho ${id}`, {
              description: `${individualError}`,
            });
          }
        }

        await invoke("enable_keybinds");
      }
    } catch (error) {
      console.error("Erro ao habilitar/adicionar keybinds no backend:", error);
      toast.error("Erro ao habilitar atalhos", {
        description: "Não foi possível configurar os atalhos de teclado.",
      });
    } finally {
      keybindsProcessingRef.current = false;
    }
  }, [isActive, config.keybinds]);

  // Configurar o listener de eventos uma única vez
  useEffect(() => {
    if (listenerAttached.current) return;

    let unlistenFn: UnlistenFn | undefined;

    const setupListener = async () => {
      try {
        unlistenFn = await listen<string>("keybind-triggered", (event) => {
          const action = event.payload;

          // Verificar se é uma ação de evidência
          if (action === "resetEvidence") {
            resetFilters();
            toast.info("Filtros de evidência resetados");
            return;
          }

          // Verificar se é uma ação de evidência
          const evidence = keybindActionToEvidence[action];
          if (evidence) {
            toggleEvidenceInclusion(evidence);
            return;
          }

          // Verificar se é uma ação de timer
          const timerEvent = keybindActionToTimerEvent[action];
          if (timerEvent) {
            eventBus.emit(timerEvent as any);
            return;
          }

          // Verificar se é a ação de calcular velocidade do fantasma
          if (action === "ghostSpeed") {
            // Navegar para a página de fantasmas e selecionar a aba de velocidade
            navigateToGhostSpeedTab();
            // Depois emitir o evento para calcular a velocidade
            console.log(`Emitindo evento: ${otherActions[action]}`);
            eventBus.emit(otherActions[action] as any);
            return;
          }

          // Verificar se é outra ação específica
          const otherEvent = otherActions[action];
          if (otherEvent) {
            console.log(`Emitindo evento: ${otherEvent}`);
            eventBus.emit(otherEvent as any);
            return;
          }

          // Se chegou aqui, a ação não é reconhecida
          console.warn(
            `Ação de keybind desconhecida recebida do backend: ${action}`
          );
          toast.warning("Atalho desconhecido", {
            description: `Ação de atalho "${action}" não reconhecida.`,
          });
        });
        listenerAttached.current = true;
      } catch (error) {
        console.error("Falha ao anexar listener 'keybind-triggered':", error);
        toast.error("Erro ao configurar atalhos", {
          description:
            "Não foi possível inicializar o sistema de atalhos de teclado.",
        });
      }
    };

    setupListener();

    return () => {
      if (unlistenFn) {
        unlistenFn();
        listenerAttached.current = false;
      }
    };
  }, [resetFilters, toggleEvidenceInclusion, navigateToGhostSpeedTab]);

  // Um único useEffect para gerenciar o estado ativo/inativo e atualizar os atalhos
  useEffect(() => {
    const isConfigPage = currentPage === "Config";
    const shouldBeActive = !isConfigPage;

    // Primeira renderização ou mudança de página
    if (shouldBeActive !== isActive) {
      setIsActive(shouldBeActive);

      if (!shouldBeActive) {
        disableKeybinds();
      } else if (shouldBeActive) {
        enableKeybinds();
      }
      return;
    }

    // Mudanças nas configurações quando ativo
    if (isActive) {
      enableKeybinds();
    }
  }, [currentPage, config.keybinds, disableKeybinds, enableKeybinds, isActive]);

  return {
    isActive,
    disableKeybinds,
  };
}
