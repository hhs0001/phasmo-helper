import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigation } from "@/contexts/navigation-context";
import { useAppConfig } from "./use-config";
import { useGhost } from "@/contexts/ghost-context";
import { Evidence } from "@/contexts/ghost-context";
import { register, unregisterAll } from "@tauri-apps/plugin-global-shortcut";

export function useKeybinds() {
  const { currentPage } = useNavigation();
  const { config } = useAppConfig();
  const { toggleEvidenceInclusion, resetFilters } = useGhost();
  const [isActive, setIsActive] = useState(false); // Inicializa como false para verificar a página atual primeiro
  const registeredRef = useRef(false);

  // Mapeamento de IDs de keybinds para evidências
  const keybindToEvidence: Record<string, Evidence> = {
    EMF5: "EMF",
    DOTSProjector: "DotsProjector",
    GhostOrb: "GhostOrb",
    GhostWriting: "GhostWriting",
    Fingerprints: "Fingerprints",
    SpiritBox: "SpiritBox",
    Freezing: "FreezingTemps",
  };

  // Função para desregistrar todos os atalhos
  const disableKeybinds = useCallback(async () => {
    try {
      await unregisterAll();
      registeredRef.current = false;
      console.log("Todos os atalhos foram desregistrados");
    } catch (error) {
      console.error("Erro ao remover atalhos:", error);
    }
  }, []);

  // Normaliza uma keybind para garantir compatibilidade
  const normalizeKeybind = (keybind: string): string => {
    return keybind
      .replace(/Shift\+!/g, "Shift+1")
      .replace(/Shift\+@/g, "Shift+2")
      .replace(/Shift\+#/g, "Shift+3")
      .replace(/Shift\+\$/g, "Shift+4")
      .replace(/Shift\+%/g, "Shift+5")
      .replace(/Shift\+\^/g, "Shift+6")
      .replace(/Shift\+&/g, "Shift+7")
      .replace(/Shift\+\*/g, "Shift+8")
      .replace(/Shift\+\(/g, "Shift+9")
      .replace(/Shift\+\)/g, "Shift+0")
      .replace(/Shift\+_/g, "Shift+-")
      .replace(/Shift\+\+/g, "Shift+=");
  };

  // Função para registrar todos os atalhos ativos
  const enableKeybinds = useCallback(async () => {
    // Se as keybinds não estão ativas ou já estão registradas, não faz nada
    if (!isActive || registeredRef.current) return;

    try {
      // Primeiro, desativa todas as keybinds existentes para evitar conflitos
      await disableKeybinds();

      // Filtrar apenas os atalhos que estão ativos
      const enabledKeybinds = Object.entries(config.keybinds)
        .filter(([_, keybind]) => keybind.enabled)
        .map(([id, keybind]) => ({
          id,
          key: normalizeKeybind(keybind.key),
        }));

      if (enabledKeybinds.length === 0) {
        console.log("Não há atalhos para registrar");
        return;
      }

      // Agrupar todas as teclas em um array
      const shortcutKeys = enabledKeybinds.map((item) => item.key);

      // Criar um mapa de atalhos para IDs para consulta rápida
      const shortcutToId = enabledKeybinds.reduce((map, item) => {
        map[item.key.toLowerCase()] = item.id;
        return map;
      }, {} as Record<string, string>);

      // Registrar todos os atalhos de uma vez
      await register(shortcutKeys, (event) => {
        // Apenas reagir ao evento Pressed para evitar duplicação
        if (event.state !== "Pressed") return;

        const shortcut = event.shortcut.toLowerCase();
        const id = shortcutToId[shortcut];

        if (id) {
          console.log(`Atalho ${shortcut} acionado para ação: ${id}`);

          // Executa a ação correspondente ao atalho
          if (id === "resetEvidence") {
            resetFilters();
          } else {
            const evidence = keybindToEvidence[id];
            if (evidence) {
              toggleEvidenceInclusion(evidence);
            }
          }
        }
      });

      registeredRef.current = true;
      console.log(`${shortcutKeys.length} atalhos registrados com sucesso`);
    } catch (error) {
      console.error("Erro ao registrar atalhos:", error);
    }
  }, [
    isActive,
    config.keybinds,
    disableKeybinds,
    resetFilters,
    toggleEvidenceInclusion,
    keybindToEvidence,
  ]);

  // Efeito para monitorar mudanças na página atual
  useEffect(() => {
    const isConfigPage = currentPage === "Config";

    // CORRETO: desativar na página de config, ativar em outras páginas
    if (isConfigPage) {
      setIsActive(false);
      disableKeybinds();
      console.log("Página de configuração: keybinds desativadas");
    } else {
      setIsActive(true);
      enableKeybinds();
      console.log("Fora da página de configuração: keybinds ativadas");
    }
  }, [currentPage, disableKeybinds, enableKeybinds]);

  // Observa mudanças nas configurações de keybinds e reativa quando necessário
  useEffect(() => {
    // Só registra novos atalhos se não estiver na página de configurações
    if (isActive && currentPage !== "Config") {
      // Se temos novas configurações e estamos ativos, reregistramos
      disableKeybinds().then(() => enableKeybinds());
    }
  }, [config.keybinds, isActive, currentPage, disableKeybinds, enableKeybinds]);

  // Ativa os atalhos na inicialização (se não estiver na página de config)
  useEffect(() => {
    if (currentPage !== "Config") {
      setIsActive(true);
      enableKeybinds();
    }
  }, [currentPage, enableKeybinds]);

  // Limpa os atalhos quando o componente é desmontado
  useEffect(() => {
    return () => {
      disableKeybinds();
    };
  }, [disableKeybinds]);

  return {
    enableKeybinds,
    disableKeybinds,
    isActive,
  };
}
