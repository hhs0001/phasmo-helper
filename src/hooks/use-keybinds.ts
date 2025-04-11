import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigation } from "@/contexts/navigation-context";
import { useAppConfig } from "./use-config";
import { useGhost } from "@/contexts/ghost-context";
import type { Evidence } from "@/contexts/ghost-context";
import { invoke } from "@tauri-apps/api/core";
import { listen, UnlistenFn } from "@tauri-apps/api/event";

export function useKeybinds() {
  const { currentPage } = useNavigation();
  const { config } = useAppConfig();
  const { toggleEvidenceInclusion, resetFilters } = useGhost();
  // isActive controla o estado local para determinar se devemos ativar keybinds
  const [isActive, setIsActive] = useState(currentPage !== "Config");
  const listenerAttached = useRef(false); // Para garantir que o listener seja anexado apenas uma vez

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

  // Função para desabilitar keybinds no backend
  const disableKeybinds = useCallback(async () => {
    try {
      // Desabilita a checagem no backend
      await invoke("disable_keybinds");
      // Remove os keybinds registrados no backend para evitar acionamentos acidentais
      await invoke("remove_all_keybinds");
      console.log("Keybinds desabilitadas e removidas no backend");
    } catch (error) {
      console.error("Erro ao desabilitar/remover keybinds no backend:", error);
    }
  }, []);

  // Função para habilitar keybinds no backend
  const enableKeybinds = useCallback(async () => {
    // Se não estiver ativo (ex: na página de config), não faz nada
    if (!isActive) return;

    try {
      // Garante que keybinds anteriores sejam removidos antes de adicionar novos
      await invoke("disable_keybinds");
      await invoke("remove_all_keybinds");

      // Formata os keybinds para o backend Rust
      const keybindsData = Object.entries(config.keybinds)
        .filter(([_, keybind]) => keybind.enabled)
        .map(([id, keybind]) => {
          // Divide a string (ex: "Shift+1") em partes
          const keys = keybind.key.split("+");

          // Formata cada chave para o formato esperado pela biblioteca rdev
          // Precisamos garantir que os nomes das teclas correspondam aos mapeados no backend
          const formattedKeys = keys.map((key) => {
            // Para teclas como "Shift", "Ctrl", "Alt" já mapeamos no backend
            return key;
          });

          // A ação enviada para o backend será o ID original do keybind
          const action = id;
          return [id, formattedKeys, action]; // Formato: [String, Vec<String>, String]
        });

      if (keybindsData.length === 0) {
        console.log("Não há keybinds ativos para registrar no backend");
        // Mesmo sem binds, habilitamos o manager para futuros adds
        await invoke("enable_keybinds");
        return;
      }

      console.log("Enviando keybinds para o backend:", keybindsData);

      // Adiciona os keybinds em lote no backend
      await invoke("add_keybinds_batch", { keybindsData });

      // Habilita a checagem de keybinds no backend
      await invoke("enable_keybinds");

      console.log(
        `${keybindsData.length} keybinds adicionados e habilitados no backend`
      );
    } catch (error) {
      console.error("Erro ao habilitar/adicionar keybinds no backend:", error);
    }
  }, [isActive, config.keybinds]);

  // Efeito para ouvir eventos do backend
  useEffect(() => {
    if (listenerAttached.current) return; // Evita anexar múltiplos listeners

    let unlistenFn: UnlistenFn | undefined;

    const setupListener = async () => {
      try {
        unlistenFn = await listen<string>("keybind-triggered", (event) => {
          console.log("Backend keybind triggered:", event.payload);
          const action = event.payload; // A 'action' é o ID do keybind

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
            }
          }
        });
        listenerAttached.current = true;
        console.log("Listener para 'keybind-triggered' anexado.");
      } catch (error) {
        console.error("Falha ao anexar listener 'keybind-triggered':", error);
      }
    };

    setupListener();

    // Função de limpeza para desanexar o listener
    return () => {
      if (unlistenFn) {
        unlistenFn();
        listenerAttached.current = false;
        console.log("Listener para 'keybind-triggered' desanexado.");
      }
    };
  }, [resetFilters, toggleEvidenceInclusion, keybindActionToEvidence]);

  // Efeito para habilitar/desabilitar baseado na página
  useEffect(() => {
    const isConfigPage = currentPage === "Config";
    setIsActive(!isConfigPage); // Atualiza o estado local isActive

    if (isConfigPage) {
      console.log("Entrando na página Config: Desabilitando keybinds...");
      disableKeybinds();
    } else {
      console.log("Saindo da página Config: Habilitando keybinds...");
      // enableKeybinds será chamado pelo useEffect abaixo
    }
  }, [currentPage, disableKeybinds]);

  // Efeito para re-registrar keybinds quando a config muda ou quando sai da pág de config
  useEffect(() => {
    // Só (re)habilita se estivermos ativos (fora da pág de config)
    if (isActive) {
      console.log(
        "Configuração de keybinds mudou ou isActive mudou para true: Re-habilitando keybinds..."
      );
      // A função enableKeybinds já limpa os binds antigos antes de adicionar os novos
      enableKeybinds();
    }
  }, [config.keybinds, isActive, enableKeybinds]);

  return {
    isActive,
    disableKeybinds,
  };
}
