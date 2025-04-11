import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigation } from "@/contexts/navigation-context";
import { useAppConfig } from "./use-config";
import { useGhost } from "@/contexts/ghost-context";
import type { Evidence } from "@/contexts/ghost-context";
import { invoke } from "@tauri-apps/api/core";
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import { toast } from "sonner";

export function useKeybinds() {
  const { currentPage } = useNavigation();
  const { config } = useAppConfig();
  const { toggleEvidenceInclusion, resetFilters } = useGhost();
  const [isActive, setIsActive] = useState(currentPage !== "Config");
  const listenerAttached = useRef(false);
  const lastConfigRef = useRef(config.keybinds);
  const keybindsProcessingRef = useRef(false);

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
    if (!configChanged && !keybindsProcessingRef.current) {
      keybindsProcessingRef.current = false;
      return;
    }

    try {
      await invoke("disable_keybinds");
      await invoke("remove_all_keybinds");

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

      await invoke("add_keybinds_batch", { keybindsData });
      await invoke("enable_keybinds");
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

          if (action === "resetEvidence") {
            resetFilters();
          } else {
            const evidence = keybindActionToEvidence[action];
            if (evidence) {
              toggleEvidenceInclusion(evidence);
            } else {
              console.warn(
                `Ação de keybind desconhecida recebida do backend: ${action}`
              );
              toast.warning("Atalho desconhecido", {
                description: `Ação de atalho "${action}" não reconhecida.`,
              });
            }
          }
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
  }, [resetFilters, toggleEvidenceInclusion]);

  // Desativar/ativar atalhos com base na página atual
  useEffect(() => {
    const isConfigPage = currentPage === "Config";

    if (isConfigPage && isActive) {
      setIsActive(false);
      disableKeybinds();
    } else if (!isConfigPage && !isActive) {
      setIsActive(true);
    }
  }, [currentPage, disableKeybinds, isActive]);

  // Atualizar atalhos apenas quando necessário
  useEffect(() => {
    if (isActive) {
      enableKeybinds();
    }
  }, [enableKeybinds]);

  return {
    isActive,
    disableKeybinds,
  };
}
