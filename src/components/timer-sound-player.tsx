import { useEffect, useRef } from "react";
import { useTimerStore, TimerType } from "@/stores/timer-store";
import { readFile } from "@tauri-apps/plugin-fs";
import { convertFileSrc } from "@tauri-apps/api/core";

// Componente invisível que gerencia a reprodução de sons para os timers
export function TimerSoundPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // Cache de data URLs para custom sounds
  const dataUrlCache = useRef<Record<TimerType, string>>(
    {} as Record<TimerType, string>
  );
  const { settings, useCustomSounds } = useTimerStore();

  // Monitorar os eventos de finalização de timers
  useEffect(() => {
    // Função para converter dados binários em data URL
    const createDataUrl = async (
      filePath: string,
      mimeType: string
    ): Promise<string> => {
      try {
        // Ler o arquivo como array de bytes
        const fileData = await readFile(filePath);

        // Converter para Base64
        let binary = "";
        const bytes = new Uint8Array(fileData);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
          binary += String.fromCharCode(bytes[i]);
        }

        const base64 = window.btoa(binary);
        return `data:${mimeType};base64,${base64}`;
      } catch (error) {
        console.error("Erro ao criar data URL:", error);
        throw error;
      }
    };

    // Função que reproduz o som quando um timer é finalizado
    const playTimerSound = async (type: TimerType) => {
      if (!settings.soundEnabled) return;

      try {
        const customSoundPath = settings.timerSounds[type];

        if (useCustomSounds && customSoundPath) {
          // Reproduz som personalizado para paths locais usando data URL primeiro
          let src: string;
          // Determinar tipo MIME
          const extension =
            customSoundPath.split(".").pop()?.toLowerCase() || "";
          const mimeType = extension === "mp3" ? "audio/mpeg" : "audio/wav";
          // Identificar caminhos locais (Windows ou Unix)
          const isLocal =
            customSoundPath.includes(":\\") || customSoundPath.startsWith("/");
          if (isLocal) {
            src =
              dataUrlCache.current[type] ||
              (await createDataUrl(customSoundPath, mimeType));
            dataUrlCache.current[type] = src;
          } else {
            // tentar URL via Tauri (convertFileSrc), fallback para data URL
            try {
              src = convertFileSrc(customSoundPath);
            } catch {
              src =
                dataUrlCache.current[type] ||
                (await createDataUrl(customSoundPath, mimeType));
              dataUrlCache.current[type] = src;
            }
          }
          audioRef.current = audioRef.current || new Audio();
          audioRef.current.src = src;
          audioRef.current.volume = settings.soundVolume;
          await audioRef.current.play();
          return;
        }

        // Usar o som padrão
        console.log(`Usando som padrão para ${type}`);
        if (audioRef.current) {
          audioRef.current.src = `/assets/sounds/${settings.defaultSoundFile}`;
          audioRef.current.volume = settings.soundVolume;
          audioRef.current.play().catch((error) => {
            console.error("Erro ao reproduzir som do timer:", error);
          });
        }
      } catch (error) {
        console.error("Erro ao determinar qual som reproduzir:", error);
      }
    };

    // Expor uma função global para que a store possa acionar o som
    window.__playTimerCompleteSound = playTimerSound;

    return () => {
      // Limpar a função global ao desmontar
      delete window.__playTimerCompleteSound;
    };
  }, [
    settings.soundEnabled,
    settings.soundVolume,
    settings.defaultSoundFile,
    settings.timerSounds,
    useCustomSounds,
  ]);

  return (
    <audio
      ref={audioRef}
      src={`/assets/sounds/${settings.defaultSoundFile}`}
      preload="auto"
      style={{ display: "none" }}
    />
  );
}

// Declarar o tipo global para evitar erros TypeScript
declare global {
  interface Window {
    __playTimerCompleteSound?: (type: TimerType) => void;
  }
}
