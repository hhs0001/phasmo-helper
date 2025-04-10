import { useConfig } from "@/contexts/config-context";
import type { AppConfig } from "@/contexts/config-context";

/**
 * Hook personalizado para acessar e modificar as configurações do aplicativo
 * Abstrai o acesso ao Tauri Store e fornece métodos para manipular as configurações
 */
export function useAppConfig() {
  const {
    config,
    isLoading,
    updateConfig,
    updateKeybind,
    updateOverlay,
    resetConfig,
  } = useConfig();

  // Métodos específicos para manipular keybinds
  const setKeybind = async (id: string, key: string) => {
    return updateKeybind(id, { key });
  };

  const toggleKeybind = async (id: string, enabled: boolean) => {
    return updateKeybind(id, { enabled });
  };

  // Métodos específicos para manipular overlay
  const toggleOverlay = async (enabled: boolean) => {
    return updateOverlay({ enabled });
  };

  const setOverlayOpacity = async (opacity: number) => {
    return updateOverlay({ opacity });
  };

  const setOverlayPosition = async (
    position: AppConfig["overlay"]["position"]
  ) => {
    return updateOverlay({ position });
  };

  const toggleAlwaysOnTop = async (alwaysOnTop: boolean) => {
    return updateOverlay({ alwaysOnTop });
  };

  // Método para alterar o tema
  const setTheme = async (theme: AppConfig["application"]["theme"]) => {
    return updateConfig("application", {
      theme: theme,
      showInfo: config.application.showInfo,
    });
  };

  const setShowInfo = async (
    showInfo: AppConfig["application"]["showInfo"]
  ) => {
    return updateConfig("application", {
      showInfo: showInfo,
      theme: config.application.theme,
    });
  };

  return {
    // Estado
    config,
    isLoading,
    keybinds: config.keybinds,
    overlay: config.overlay,
    application: config.application,

    // Métodos gerais
    updateConfig,
    resetConfig,

    // Métodos específicos
    setKeybind,
    toggleKeybind,
    toggleOverlay,
    setOverlayOpacity,
    setOverlayPosition,
    toggleAlwaysOnTop,
    setTheme,
    setShowInfo,
  };
}
