import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ResetIcon,
  PauseIcon,
  PlayIcon,
  SpeakerLoudIcon,
  SpeakerOffIcon,
  MinusIcon,
} from "@radix-ui/react-icons";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { eventBus } from "@/lib/events";
import {
  useTimerStore,
  TimerType,
  TIMER_DURATIONS,
  getTimerRemainingSeconds,
} from "@/stores/timer-store";
import { TimerSoundPlayer } from "@/components/timer-sound-player";

interface GameTimersProps {
  difficulty?:
    | "amateur"
    | "intermediate"
    | "professional"
    | "nightmare"
    | "insanity";
  mapSize?: "small" | "medium" | "large" | "cursed";
}

// Função para formatar o tempo em mm:ss
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}`;
};

// Função para obter o nome amigável do timer
const getTimerName = (type: TimerType): string => {
  switch (type) {
    case "hunt":
      return "Caçada";
    case "smudge":
      return "Incenso";
    case "cooldown":
      return "Cooldown";
    default:
      return "Timer";
  }
};

// Mapeamento de dificuldades para os valores suportados pelo TIMER_DURATIONS
const difficultyMapping = {
  amateur: "amateur",
  intermediate: "intermediate",
  professional: "professional",
  nightmare: "professional", // usar professional para nightmare
  insanity: "professional", // usar professional para insanity
} as const;

export default function GameTimers({
  difficulty = "amateur",
  mapSize = "small",
}: GameTimersProps) {
  // Estados locais
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(
    null
  );
  const [showSoundSettings, setShowSoundSettings] = useState(false);
  const [timeLeft, setTimeLeft] = useState<Record<TimerType, number>>({
    hunt: 0,
    smudge: 0,
    cooldown: 0,
  });
  // Controle para prevenir notificações duplicadas de término
  const completedTimersRef = useRef<Set<string>>(new Set());

  // Referência ao contêiner de áudio
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Obter estados e ações da store de timers
  const {
    timers,
    settings,
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    updateSettings,
    playTimerCompleteSound,
    syncWithAppConfig,
  } = useTimerStore();

  // Sincronizar sons personalizados ao montar o componente
  useEffect(() => {
    syncWithAppConfig();
  }, [syncWithAppConfig]);

  // Mapear a dificuldade para um valor compatível com TIMER_DURATIONS
  const mappedDifficulty = difficultyMapping[difficulty] || "amateur";

  const hasActiveTimers = Object.values(timers).some((timer) => timer !== null);

  // Limpar o set de timers completados quando não existirem timers ativos
  useEffect(() => {
    if (!hasActiveTimers) {
      completedTimersRef.current.clear();
    }
  }, [hasActiveTimers]);

  // Atualiza timeLeft e notifica conclusão de timers em loop contínuo
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        const newTimeLeft: Record<TimerType, number> = {
          hunt: getTimerRemainingSeconds(timers.hunt),
          smudge: getTimerRemainingSeconds(timers.smudge),
          cooldown: getTimerRemainingSeconds(timers.cooldown),
        };
        // Notifica timers que passaram a zero
        Object.entries(newTimeLeft).forEach(([type, seconds]) => {
          const timerType = type as TimerType;
          const prevSeconds = prev[timerType];
          const timer = timers[timerType];
          if (
            prevSeconds > 0 &&
            seconds === 0 &&
            timer &&
            !completedTimersRef.current.has(timer.id)
          ) {
            completedTimersRef.current.add(timer.id);
            playTimerCompleteSound(timerType);
            eventBus.emit(`timer:completed-${timerType}` as any, {
              timerId: timer.id,
            });
            toast.info(`Timer de ${getTimerName(timerType)} concluído!`);
          }
        });
        return newTimeLeft;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [timers, playTimerCompleteSound]);

  // Manipular o início de um timer
  const handleStartTimer = (type: TimerType) => {
    const existingTimer = timers[type];

    // Se o timer já estiver ativo, alterne entre pausar e retomar
    if (existingTimer) {
      if (existingTimer.isPaused) {
        resumeTimer(type);
        toast.info(`Timer de ${getTimerName(type)} retomado`);
      } else {
        pauseTimer(type);
        toast.info(`Timer de ${getTimerName(type)} pausado`);
      }
      return;
    }

    // Definir a duração inicial com base no tipo, dificuldade e tamanho do mapa
    let initialValue = 0;

    if (type === "hunt") {
      initialValue = TIMER_DURATIONS.hunt[mappedDifficulty][mapSize];
    } else if (type === "smudge") {
      initialValue = TIMER_DURATIONS.smudge.normal;
    } else if (type === "cooldown") {
      initialValue = TIMER_DURATIONS.cooldown.normal;
    }

    // Iniciar o timer
    startTimer(type, initialValue);
    toast.info(
      `Timer de ${getTimerName(type)} iniciado: ${formatTime(initialValue)}`
    );
  };

  // Manipular mudança de tipo para timer de smudge
  const handleSmudgeTypeChange = (type: "normal" | "spirit" | "demon") => {
    if (!timers.smudge) return;

    const newDuration = TIMER_DURATIONS.smudge[type];

    // Reset e reiniciar o timer com a nova duração
    resetTimer("smudge");
    startTimer("smudge", newDuration);

    toast.info(
      `Timer de Incenso ajustado para ${
        type === "normal" ? "Normal" : type === "spirit" ? "Spirit" : "Demon"
      }: ${formatTime(newDuration)}`
    );
  };

  // Manipular mudança de tipo para timer de cooldown
  const handleCooldownTypeChange = (type: "normal" | "demon") => {
    if (!timers.cooldown) return;

    const newDuration = TIMER_DURATIONS.cooldown[type];

    // Reset e reiniciar o timer com a nova duração
    resetTimer("cooldown");
    startTimer("cooldown", newDuration);

    toast.info(
      `Timer de Cooldown ajustado para ${
        type === "normal" ? "Normal" : "Demon"
      }: ${formatTime(newDuration)}`
    );
  };

  // Manipuladores para pressionar e soltar botões (para reset com pressionamento longo)
  const handleButtonDown = (type: TimerType) => {
    if (timers[type] === null) return;

    const timer = setTimeout(() => {
      resetTimer(type);
      toast.info(`Timer de ${getTimerName(type)} resetado`);
      setLongPressTimer(null);
    }, 800);

    setLongPressTimer(timer);
  };

  const handleButtonUp = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  // Alternar minimização do painel de timers
  const toggleMinimize = () => {
    updateSettings({ minimized: !settings.minimized });
  };

  // Alternar a reprodução de som
  const toggleSound = () => {
    updateSettings({ soundEnabled: !settings.soundEnabled });
  };

  // Atualizar o volume do som
  const handleVolumeChange = (value: number[]) => {
    updateSettings({ soundVolume: value[0] });

    // Tocar um som de teste quando ajustar o volume
    if (audioRef.current && settings.soundEnabled) {
      audioRef.current.volume = value[0];
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    }
  };

  // Escutar eventos de atalhos de teclado
  useEffect(() => {
    // Função para lidar com eventos de timer vindo dos atalhos
    const handleHuntTimer = () => handleStartTimer("hunt");
    const handleSmudgeTimer = () => handleStartTimer("smudge");
    const handleCooldownTimer = () => handleStartTimer("cooldown");

    // Registrar listeners para os eventos
    const unsubscribeHunt = eventBus.subscribe(
      "timer:start-hunt",
      handleHuntTimer
    );
    const unsubscribeSmudge = eventBus.subscribe(
      "timer:start-smudge",
      handleSmudgeTimer
    );
    const unsubscribeCooldown = eventBus.subscribe(
      "timer:start-cooldown",
      handleCooldownTimer
    );
    const unsubscribeHuntTrack = eventBus.subscribe(
      "timer:start-hunt-track",
      handleHuntTimer
    );

    // Limpar listeners quando o componente for desmontado
    return () => {
      unsubscribeHunt();
      unsubscribeSmudge();
      unsubscribeCooldown();
      unsubscribeHuntTrack();

      // Limpar qualquer timeout pendente
      if (longPressTimer) {
        clearTimeout(longPressTimer);
      }
    };
  }, [mappedDifficulty, mapSize]);

  // Limpar intervalos ao desmontar o componente
  useEffect(() => {
    return () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
      }
    };
  }, []);

  // Calculando a duração para exibição no botão de caçada
  const huntDuration =
    mappedDifficulty && mapSize
      ? TIMER_DURATIONS.hunt[mappedDifficulty][mapSize]
      : 0;

  return (
    <>
      {/* Componente invisível que gerencia sons personalizados dos timers */}
      <TimerSoundPlayer />

      {/* Elemento de áudio oculto para testes de som (usado pelo ajuste de volume) */}
      <audio
        ref={audioRef}
        src={`/assets/sounds/${settings.defaultSoundFile}`}
        preload="auto"
        style={{ display: "none" }}
      />

      <Card
        className={
          settings.minimized
            ? "fixed bottom-4 right-4 w-auto h-auto shadow-lg transition-all duration-300 z-50 cursor-pointer p-1"
            : hasActiveTimers
            ? "fixed bottom-4 right-4 w-72 shadow-lg transition-all duration-300 z-50"
            : "fixed bottom-4 right-4 w-64 shadow-lg transition-all duration-300 z-50"
        }
      >
        {settings.minimized ? (
          <div
            className="p-2 flex items-center justify-center cursor-pointer"
            onClick={toggleMinimize}
          >
            <div className="flex flex-col gap-1">
              {Object.entries(timers).map(
                ([type, timer]) =>
                  timer && (
                    <Badge
                      key={type}
                      variant={timer.isPaused ? "outline" : "default"}
                      className="flex justify-between items-center gap-1"
                    >
                      <span>{getTimerName(type as TimerType)}</span>
                      <span>{formatTime(timeLeft[type as TimerType])}</span>
                      {timer.isPaused && <PauseIcon className="h-3 w-3" />}
                    </Badge>
                  )
              )}
              {!hasActiveTimers && <Badge variant="outline">Timers</Badge>}
            </div>
          </div>
        ) : (
          <>
            <CardHeader className="pb-2 flex flex-row items-center justify-between px-4 pt-2">
              <div>
                <CardTitle className="text-sm font-medium">
                  Phasmo Timers
                </CardTitle>
                <CardDescription className="text-xs">
                  Controle de tempos
                </CardDescription>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={toggleSound}
                  title={settings.soundEnabled ? "Desativar som" : "Ativar som"}
                >
                  {settings.soundEnabled ? (
                    <SpeakerLoudIcon className="h-3 w-3" />
                  ) : (
                    <SpeakerOffIcon className="h-3 w-3" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={toggleMinimize}
                  title="Minimizar"
                >
                  <MinusIcon className="h-3 w-3" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="pt-0 pb-3 px-4">
              {/* Configurações de som */}
              {showSoundSettings && (
                <div className="mb-3 bg-muted p-2 rounded-md">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium">
                      Som ao finalizar
                    </span>
                    <Switch
                      checked={settings.soundEnabled}
                      onCheckedChange={(checked) =>
                        updateSettings({ soundEnabled: checked })
                      }
                    />
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground mb-1 block">
                      Volume
                    </span>
                    <Slider
                      value={[settings.soundVolume]}
                      min={0}
                      max={1}
                      step={0.1}
                      onValueChange={handleVolumeChange}
                      disabled={!settings.soundEnabled}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {/* Timers ativos */}
                {Object.entries(timers).map(
                  ([type, timer]) =>
                    timer && (
                      <div key={type} className="p-2 bg-muted rounded-md">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-xs font-medium">
                              {getTimerName(type as TimerType)}
                            </div>
                            <div className="text-xl font-bold">
                              {formatTime(timeLeft[type as TimerType])}
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() =>
                                timer.isPaused
                                  ? resumeTimer(type as TimerType)
                                  : pauseTimer(type as TimerType)
                              }
                            >
                              {timer.isPaused ? (
                                <PlayIcon className="h-3 w-3" />
                              ) : (
                                <PauseIcon className="h-3 w-3" />
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => resetTimer(type as TimerType)}
                            >
                              <ResetIcon className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        {/* Controles do timer de incenso */}
                        {type === "smudge" && (
                          <div className="grid grid-cols-3 gap-1 mt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs h-6"
                              onClick={() => handleSmudgeTypeChange("normal")}
                            >
                              Normal
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs h-6"
                              onClick={() => handleSmudgeTypeChange("spirit")}
                            >
                              Spirit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs h-6"
                              onClick={() => handleSmudgeTypeChange("demon")}
                            >
                              Demon
                            </Button>
                          </div>
                        )}

                        {/* Controles do timer de cooldown */}
                        {type === "cooldown" && (
                          <div className="grid grid-cols-2 gap-1 mt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs h-6"
                              onClick={() => handleCooldownTypeChange("normal")}
                            >
                              Normal (25s)
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs h-6"
                              onClick={() => handleCooldownTypeChange("demon")}
                            >
                              Demon (20s)
                            </Button>
                          </div>
                        )}
                      </div>
                    )
                )}

                {/* Botões para iniciar timers */}
                <div className="grid grid-cols-1 gap-2">
                  <Button
                    variant={
                      timers.hunt
                        ? timers.hunt.isPaused
                          ? "outline"
                          : "default"
                        : "outline"
                    }
                    onMouseDown={() => handleButtonDown("hunt")}
                    onMouseUp={handleButtonUp}
                    onMouseLeave={handleButtonUp}
                    onClick={() => handleStartTimer("hunt")}
                    className="text-sm h-10"
                  >
                    Caçada
                    <br />
                    {huntDuration > 0 ? `(${huntDuration}s)` : ""}
                  </Button>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={
                        timers.smudge
                          ? timers.smudge.isPaused
                            ? "outline"
                            : "default"
                          : "outline"
                      }
                      onMouseDown={() => handleButtonDown("smudge")}
                      onMouseUp={handleButtonUp}
                      onMouseLeave={handleButtonUp}
                      onClick={() => handleStartTimer("smudge")}
                      className="text-xs h-10"
                    >
                      Incenso
                      <br />
                      (90s)
                    </Button>
                    <Button
                      variant={
                        timers.cooldown
                          ? timers.cooldown.isPaused
                            ? "outline"
                            : "default"
                          : "outline"
                      }
                      onMouseDown={() => handleButtonDown("cooldown")}
                      onMouseUp={handleButtonUp}
                      onMouseLeave={handleButtonUp}
                      onClick={() => handleStartTimer("cooldown")}
                      className="text-xs h-10"
                    >
                      Cooldown
                      <br />
                      (25s)
                    </Button>
                  </div>
                </div>

                {/* Botão para configurações de som */}
                <div className="flex justify-center mt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                    onClick={() => setShowSoundSettings(!showSoundSettings)}
                  >
                    {showSoundSettings
                      ? "Ocultar configurações"
                      : "Configurações de som"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </>
        )}
      </Card>
    </>
  );
}
