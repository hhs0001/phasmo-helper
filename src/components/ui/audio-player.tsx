import { useState, useRef, useEffect } from "react";
import { Button } from "./button";
import { Slider } from "./slider";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";

interface AudioPlayerProps {
  src: string;
  className?: string;
  compact?: boolean;
}

export function AudioPlayer({
  src,
  className,
  compact = false,
}: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [isVolumeVisible, setIsVolumeVisible] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const volumeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const setAudioData = () => {
      setDuration(audio.duration);
    };

    const setAudioTime = () => {
      setCurrentTime(audio.currentTime);
    };

    // Eventos para carregar metadados e atualizar o tempo
    audio.addEventListener("loadedmetadata", setAudioData);
    audio.addEventListener("timeupdate", setAudioTime);
    audio.addEventListener("ended", () => setIsPlaying(false));

    return () => {
      audio.removeEventListener("loadedmetadata", setAudioData);
      audio.removeEventListener("timeupdate", setAudioTime);
      audio.removeEventListener("ended", () => setIsPlaying(false));
    };
  }, []);

  // Formata o tempo em mm:ss
  const formatTime = (time: number) => {
    if (isNaN(time)) return "00:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  // Controles de reprodução
  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeChange = (newTime: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = newTime[0];
    setCurrentTime(newTime[0]);
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (newVolume: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = newVolume[0];
    setVolume(newVolume[0]);

    if (newVolume[0] === 0) {
      audio.muted = true;
      setIsMuted(true);
    } else if (isMuted) {
      audio.muted = false;
      setIsMuted(false);
    }
  };

  const showVolumeControls = () => {
    setIsVolumeVisible(true);

    // Limpar qualquer timeout existente
    if (volumeTimeoutRef.current) {
      clearTimeout(volumeTimeoutRef.current);
    }

    // Configurar um novo timeout para esconder o controle de volume após 3 segundos
    volumeTimeoutRef.current = setTimeout(() => {
      setIsVolumeVisible(false);
    }, 3000);
  };

  // Componente compacto para espaços menores
  if (compact) {
    return (
      <div className={cn("flex flex-col w-full rounded-md", className)}>
        <audio ref={audioRef} src={src} preload="metadata" />

        <div className="flex items-center gap-1 relative">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 flex-shrink-0 rounded-full p-0"
            onClick={togglePlay}
            aria-label={isPlaying ? "Pausar" : "Reproduzir"}
          >
            {isPlaying ? <Pause size={12} /> : <Play size={12} />}
          </Button>

          <div className="flex-1">
            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={0.1}
              onValueChange={handleTimeChange}
              className="h-1"
              aria-label="Progresso da reprodução"
            />
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 flex-shrink-0 rounded-full p-0"
            onClick={toggleMute}
            aria-label={isMuted ? "Ativar som" : "Silenciar"}
          >
            {isMuted ? <VolumeX size={12} /> : <Volume2 size={12} />}
          </Button>
        </div>

        <div className="flex justify-between text-[10px] text-muted-foreground px-2">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    );
  }

  // Versão padrão do player de áudio (original)
  return (
    <div className={cn("flex flex-col space-y-1 w-full rounded-md", className)}>
      <audio ref={audioRef} src={src} preload="metadata" />

      <div className="flex items-center space-x-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 flex-shrink-0 rounded-full hover:bg-primary/10"
          onClick={togglePlay}
          aria-label={isPlaying ? "Pausar" : "Reproduzir"}
        >
          {isPlaying ? <Pause size={16} /> : <Play size={16} />}
        </Button>

        <div className="relative flex-1 space-y-1">
          <Slider
            value={[currentTime]}
            max={duration || 100}
            step={0.1}
            onValueChange={handleTimeChange}
            className="h-1.5"
            aria-label="Progresso da reprodução"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 flex-shrink-0 rounded-full hover:bg-primary/10"
            onClick={toggleMute}
            onMouseEnter={showVolumeControls}
            aria-label={isMuted ? "Ativar som" : "Silenciar"}
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </Button>

          {isVolumeVisible && (
            <div
              className="absolute bottom-full left-1/2 -translate-x-1/2 p-3 rounded-md bg-card border shadow-md z-10"
              onMouseEnter={() => {
                if (volumeTimeoutRef.current) {
                  clearTimeout(volumeTimeoutRef.current);
                }
              }}
              onMouseLeave={() => {
                volumeTimeoutRef.current = setTimeout(() => {
                  setIsVolumeVisible(false);
                }, 1000);
              }}
            >
              <div className="flex flex-col items-center justify-center h-24 w-6">
                <Slider
                  orientation="vertical"
                  value={[isMuted ? 0 : volume]}
                  max={1}
                  step={0.01}
                  onValueChange={handleVolumeChange}
                  className="h-full"
                  aria-label="Volume"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
