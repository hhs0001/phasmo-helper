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
  Cross2Icon,
} from "@radix-ui/react-icons";
import { toast } from "sonner";
import { eventBus } from "@/lib/events";

// Simplificando para apenas três tipos de timer
type TimerType = "hunt" | "smudge" | "cooldown";

type TimerDurations = {
  hunt: {
    amateur: { small: 15; medium: 30; large: 40; cursed: 20 };
    intermediate: { small: 20; medium: 40; large: 50; cursed: 20 };
    professional: { small: 30; medium: 50; large: 60; cursed: 20 };
  };
  smudge: {
    normal: 90;
    spirit: 180;
    demon: 60;
  };
  cooldown: {
    normal: 25;
    demon: 20;
  };
};

const TIMER_DURATIONS: TimerDurations = {
  hunt: {
    amateur: { small: 15, medium: 30, large: 40, cursed: 20 },
    intermediate: { small: 20, medium: 40, large: 50, cursed: 20 },
    professional: { small: 30, medium: 50, large: 60, cursed: 20 },
  },
  smudge: {
    normal: 90,
    spirit: 180,
    demon: 60,
  },
  cooldown: {
    normal: 25,
    demon: 20,
  },
};

interface GameTimersProps {
  difficulty: "amateur" | "intermediate" | "professional";
  mapSize: "small" | "medium" | "large" | "cursed";
}

export default function GameTimers({
  difficulty = "amateur",
  mapSize = "small",
}: GameTimersProps) {
  // Estados para cada timer
  const [activeTimer, setActiveTimer] = useState<TimerType | null>(null);
  const [timerValue, setTimerValue] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  // Referências para controle do timer
  const timerInterval = useRef<NodeJS.Timeout | null>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const longPressDuration = 800; // ms necessários para considerar um "pressionar longo"

  // Função para iniciar, pausar ou retomar um timer
  const toggleTimer = (type: TimerType) => {
    // Se tiver um timer ativo e for o mesmo tipo
    if (activeTimer === type) {
      // Toggle pause/resume
      setIsPaused(!isPaused);
      return;
    }

    // Se for um novo timer ou um tipo diferente
    clearInterval(timerInterval.current!);

    // Configurar o novo timer
    setActiveTimer(type);
    setIsPaused(false);

    // Definir o valor inicial com base no tipo, dificuldade e tamanho do mapa
    let initialValue = 0;

    if (type === "hunt") {
      initialValue = TIMER_DURATIONS.hunt[difficulty][mapSize];
    } else if (type === "smudge") {
      initialValue = TIMER_DURATIONS.smudge.normal; // Valor padrão
    } else if (type === "cooldown") {
      initialValue = TIMER_DURATIONS.cooldown.normal; // Valor padrão
    }

    setTimerValue(initialValue);

    // Iniciar a contagem regressiva
    startCountdown();

    // Notificação
    toast.info(
      `Timer de ${getTimerName(type)} iniciado: ${formatTime(initialValue)}`
    );
  };

  // Inicia a contagem regressiva
  const startCountdown = () => {
    if (timerInterval.current) clearInterval(timerInterval.current);

    timerInterval.current = setInterval(() => {
      setTimerValue((prev) => {
        if (prev <= 1) {
          clearInterval(timerInterval.current!);
          toast.success(`Timer de ${getTimerName(activeTimer!)} concluído!`);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

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
        return "Cooldown (Após Caçada)";
      default:
        return "Timer";
    }
  };

  // Função para mudar o tipo de espírito do timer de incenso
  const changeSmudgeType = (type: "normal" | "spirit" | "demon") => {
    if (activeTimer !== "smudge") return;

    const newValue = TIMER_DURATIONS.smudge[type];
    setTimerValue(newValue);
    toast.info(
      `Timer de Incenso ajustado para ${
        type === "normal" ? "Normal" : type === "spirit" ? "Spirit" : "Demon"
      }: ${formatTime(newValue)}`
    );
  };

  // Função para mudar o tipo de fantasma do timer de cooldown
  const changeCooldownType = (type: "normal" | "demon") => {
    if (activeTimer !== "cooldown") return;

    const newValue = TIMER_DURATIONS.cooldown[type];
    setTimerValue(newValue);
    toast.info(
      `Timer de Cooldown ajustado para ${
        type === "normal" ? "Normal" : "Demon"
      }: ${formatTime(newValue)}`
    );
  };

  // Manipuladores para pressionar e soltar botões (para reset com pressionamento longo)
  const handleButtonDown = (type: TimerType) => {
    longPressTimer.current = setTimeout(() => {
      // Reset do timer se já estiver ativo
      if (activeTimer === type) {
        clearInterval(timerInterval.current!);
        setActiveTimer(null);
        setTimerValue(0);
        toast.info(`Timer de ${getTimerName(type)} resetado`);
      }
    }, longPressDuration);
  };

  const handleButtonUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  // Limpar intervalos ao desmontar o componente
  useEffect(() => {
    return () => {
      if (timerInterval.current) clearInterval(timerInterval.current);
      if (longPressTimer.current) clearTimeout(longPressTimer.current);
    };
  }, []);

  // Pausar/retomar quando o estado de pausa mudar
  useEffect(() => {
    if (activeTimer === null) return;

    if (isPaused) {
      clearInterval(timerInterval.current!);
    } else {
      startCountdown();
    }
  }, [isPaused]);

  // Escutar eventos de atalhos de teclado
  useEffect(() => {
    // Função para lidar com eventos de timer vindo dos atalhos
    const handleHuntTimer = () => toggleTimer("hunt");
    const handleSmudgeTimer = () => toggleTimer("smudge");
    const handleCooldownTimer = () => toggleTimer("cooldown");

    // Ambos os atalhos acionam o mesmo timer de caçada
    const handleHuntTrackTimer = () => toggleTimer("hunt");

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
      handleHuntTrackTimer
    );

    // Limpar listeners quando o componente for desmontado
    return () => {
      unsubscribeHunt();
      unsubscribeSmudge();
      unsubscribeCooldown();
      unsubscribeHuntTrack();
    };
  }, [difficulty, mapSize]); // Dependências para garantir que os valores corretos sejam usados

  // Classe CSS para o card principal
  const cardClasses = isMinimized
    ? "fixed bottom-4 right-4 w-auto h-auto shadow-lg transition-all duration-300 z-50 cursor-pointer"
    : "fixed bottom-4 right-4 w-80 shadow-lg transition-all duration-300 z-50";

  return (
    <Card className={cardClasses}>
      {isMinimized ? (
        <div
          className="p-2 flex items-center justify-center cursor-pointer"
          onClick={() => setIsMinimized(false)}
        >
          <Badge variant="default">
            {activeTimer
              ? `${getTimerName(activeTimer)}: ${formatTime(timerValue)}`
              : "Timers"}
          </Badge>
        </div>
      ) : (
        <>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Phasmo Timers</CardTitle>
              <CardDescription>Controle de tempos do jogo</CardDescription>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setIsMinimized(true)}
              >
                <Cross2Icon className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0 pb-4">
            <div className="space-y-4">
              {/* Timer ativo */}
              {activeTimer && (
                <div className="p-3 bg-muted rounded-md flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">
                      {getTimerName(activeTimer)}
                    </div>
                    <div className="text-2xl font-bold">
                      {formatTime(timerValue)}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setIsPaused(!isPaused)}
                    >
                      {isPaused ? <PlayIcon /> : <PauseIcon />}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        clearInterval(timerInterval.current!);
                        setActiveTimer(null);
                        setTimerValue(0);
                      }}
                    >
                      <ResetIcon />
                    </Button>
                  </div>
                </div>
              )}

              {/* Controles do timer de incenso */}
              {activeTimer === "smudge" && (
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => changeSmudgeType("normal")}
                  >
                    Normal (90s)
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => changeSmudgeType("spirit")}
                  >
                    Spirit (180s)
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => changeSmudgeType("demon")}
                  >
                    Demon (60s)
                  </Button>
                </div>
              )}

              {/* Controles do timer de cooldown */}
              {activeTimer === "cooldown" && (
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => changeCooldownType("normal")}
                  >
                    Normal (25s)
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => changeCooldownType("demon")}
                  >
                    Demon (20s)
                  </Button>
                </div>
              )}

              {/* Botões para iniciar timers */}
              <div className="grid grid-cols-1 gap-2">
                <Button
                  variant={activeTimer === "hunt" ? "default" : "outline"}
                  onMouseDown={() => handleButtonDown("hunt")}
                  onMouseUp={handleButtonUp}
                  onMouseLeave={handleButtonUp}
                  onClick={() => toggleTimer("hunt")}
                  className="text-sm h-12"
                >
                  Caçada
                  <br />
                  {difficulty && mapSize
                    ? `(${TIMER_DURATIONS.hunt[difficulty][mapSize]}s)`
                    : ""}
                </Button>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={activeTimer === "smudge" ? "default" : "outline"}
                    onMouseDown={() => handleButtonDown("smudge")}
                    onMouseUp={handleButtonUp}
                    onMouseLeave={handleButtonUp}
                    onClick={() => toggleTimer("smudge")}
                    className="text-xs h-12"
                  >
                    Incenso
                    <br />
                    (90s)
                  </Button>
                  <Button
                    variant={activeTimer === "cooldown" ? "default" : "outline"}
                    onMouseDown={() => handleButtonDown("cooldown")}
                    onMouseUp={handleButtonUp}
                    onMouseLeave={handleButtonUp}
                    onClick={() => toggleTimer("cooldown")}
                    className="text-xs h-12"
                  >
                    Cooldown
                    <br />
                    (25s)
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </>
      )}
    </Card>
  );
}
