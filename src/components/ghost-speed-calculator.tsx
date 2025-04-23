import { useState, useEffect, useCallback, useMemo, memo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  ResetIcon,
  PlayIcon,
  StopIcon,
  TimerIcon,
} from "@radix-ui/react-icons";
import { eventBus } from "@/lib/events";
import { SpeedCategory } from "@/types/ghost-schema";

type GhostSpeedCalculatorProps = {
  className?: string;
  onDetectSpeed?: (speedInMS: number) => void;
};

/**
 * Componente para calcular a velocidade do fantasma
 *
 * Fórmula: BPM = (velocidade em m/s * 60) / 0.85
 * - Velocidade normal: 1.7 m/s = 120 BPM (2 passos por segundo)
 * - Com LoS: Até 1.65x mais rápido (aumenta gradualmente em 13 segundos)
 */
function GhostSpeedCalculator({
  className = "",
  onDetectSpeed,
}: GhostSpeedCalculatorProps) {
  // Estado para marcação de tempo entre pressionamentos
  const [timestamps, setTimestamps] = useState<number[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [calculatedBPM, setCalculatedBPM] = useState<number | null>(null);
  const [calculatedSpeed, setCalculatedSpeed] = useState<number | null>(null);
  const [detectedSpeeds, setDetectedSpeeds] = useState<SpeedCategory[]>([]);

  // Estado para calcular média dos últimos N pressionamentos
  const MAX_SAMPLES = 5; // Número máximo de amostras para calcular a média

  // Referência para o último tempo em que a tecla foi pressionada
  const lastKeyPressTime = useRef<number>(0);
  // Tempo mínimo entre eventos de tecla consecutivos (em ms) para evitar duplicação
  const DEBOUNCE_TIME = 150; // 150ms para evitar eventos duplicados

  // Memoizar funções de conversão
  const calculateBPM = useCallback((speedInMS: number): number => {
    return (speedInMS * 60) / 0.85;
  }, []);

  const calculateSpeed = useCallback((bpm: number): number => {
    return (bpm * 0.85) / 60;
  }, []);

  // Determinar a categoria de velocidade com base na velocidade
  const determineSpeedCategory = useCallback(
    (speedInMS: number): SpeedCategory | "unknown" => {
      // Velocidades muito baixas geralmente indicam fantasmas como Deogen
      if (speedInMS < 1.4) {
        return "slow"; // treat very low as slow
      }

      // Considerando uma pequena margem de erro
      if (speedInMS >= 1.4 && speedInMS < 1.55) return "slow";
      if (speedInMS >= 1.55 && speedInMS < 1.65) return "normal";
      if (speedInMS >= 1.65 && speedInMS <= 1.8) return "normal";
      if (speedInMS > 1.8 && speedInMS <= 2.1) return "fast";
      if (speedInMS > 2.1) return "fast";
      return "unknown";
    },
    []
  );

  // Função para adicionar um novo timestamp e calcular o BPM
  const addTimestamp = useCallback(() => {
    const now = Date.now();

    setTimestamps((prev) => {
      const newTimestamps = [...prev, now].slice(-MAX_SAMPLES);

      // Precisamos de pelo menos 2 timestamps para calcular o intervalo
      if (newTimestamps.length >= 2) {
        // Calcular todos os intervalos entre os timestamps consecutivos
        const intervals: number[] = [];
        for (let i = 1; i < newTimestamps.length; i++) {
          intervals.push(newTimestamps[i] - newTimestamps[i - 1]);
        }

        // Calcular a média dos intervalos (em milissegundos)
        const avgInterval =
          intervals.reduce((sum, interval) => sum + interval, 0) /
          intervals.length;

        // Converter para BPM
        const bpm = 60000 / avgInterval;

        // Calcular velocidade em m/s
        const speed = calculateSpeed(bpm);

        // Atualizar estados
        setCalculatedBPM(bpm);
        setCalculatedSpeed(speed);

        // Determinar categoria de velocidade
        const primary = determineSpeedCategory(speed);
        // definir lista de categorias adjacentes
        const mapAdj: Record<SpeedCategory, SpeedCategory[]> = {
          slow: ["slow", "normal"],
          normal: ["slow", "normal", "fast"],
          fast: ["normal", "fast"],
        };
        const list = primary && primary !== "unknown" ? mapAdj[primary] : [];
        setDetectedSpeeds(list);

        // Notificar o callback com velocidade em m/s
        if (onDetectSpeed) {
          onDetectSpeed(speed);
        }
      }

      return newTimestamps;
    });
  }, [calculateSpeed, determineSpeedCategory, onDetectSpeed]);

  // Handler para o evento de atalho de teclado com proteção contra disparos duplicados
  const handleGhostSpeedAction = useCallback(() => {
    const now = Date.now();

    // Verificar se o tempo desde o último pressionamento é maior que o DEBOUNCE_TIME
    if (now - lastKeyPressTime.current < DEBOUNCE_TIME) {
      // Ignorar este evento, pois provavelmente é um evento duplicado
      return;
    }

    // Atualizar o tempo do último pressionamento
    lastKeyPressTime.current = now;

    // Executar um som de feedback para o usuário acompanhar o ritmo
    const playTick = () => {
      const audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      gainNode.gain.value = 0.5;

      oscillator.start();
      gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.001,
        audioContext.currentTime + 0.1
      );

      oscillator.stop(audioContext.currentTime + 0.1);
    };

    playTick();

    // Se não estiver gravando, inicie a gravação
    if (!isRecording) {
      setIsRecording(true);
      // Resetar timestamps
      setTimestamps([Date.now()]);
      toast.info(
        "Gravação iniciada. Pressione a tecla novamente para cada passo do fantasma."
      );
    } else {
      // Adicionar novo timestamp e calcular
      addTimestamp();
    }
  }, [isRecording, addTimestamp]);

  // Iniciar ou parar a gravação
  const toggleRecording = useCallback(() => {
    if (isRecording) {
      setIsRecording(false);
      toast.info("Gravação interrompida");
    } else {
      setIsRecording(true);
      setTimestamps([Date.now()]);
      toast.info("Pressione a tecla para cada passo do fantasma");
    }
  }, [isRecording]);

  // Resetar todos os dados
  const handleReset = useCallback(() => {
    setIsRecording(false);
    setTimestamps([]);
    setCalculatedBPM(null);
    setCalculatedSpeed(null);
    setDetectedSpeeds([]);
    lastKeyPressTime.current = 0;
  }, []);

  // Configurar listener para o evento de atalho de teclado
  useEffect(() => {
    const unsubscribe = eventBus.subscribe(
      "ghostSpeed:calculate" as any,
      handleGhostSpeedAction
    );

    return () => {
      unsubscribe();
    };
  }, [handleGhostSpeedAction]);

  // Mapeia descrições para nossas três categorias
  const speedCategoryDescriptions = useMemo(
    () => ({ slow: "Lento", normal: "Normal", fast: "Rápido" }),
    []
  );

  // Classes de cores para as categorias de velocidade
  const getSpeedBadgeClass = useCallback(
    (speed: SpeedCategory | "unknown"): string => {
      switch (speed) {
        case "slow":
          return "bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200";
        case "normal":
          return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
        case "fast":
          return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
        default:
          return "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200";
      }
    },
    []
  );

  // Velocidades de referência para cada categoria
  const speedReferenceValues = useMemo(
    () => ({
      slow: 1.4,
      normal: 1.7,
      fast: 2.0,
    }),
    []
  );

  return (
    <div className={className}>
      <h3 className="text-lg font-semibold mb-3">
        Detector de Velocidade do Fantasma
      </h3>

      <div className="bg-muted p-4 rounded-md mb-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">
              Velocidade Detectada:
            </p>
            <p className="text-2xl font-bold">
              {calculatedSpeed ? `${calculatedSpeed.toFixed(2)} m/s` : "—"}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">BPM:</p>
            <p className="text-2xl font-bold">
              {calculatedBPM ? `${Math.round(calculatedBPM)}` : "—"}
            </p>
          </div>
        </div>

        <div className="mt-3">
          <p className="text-sm text-muted-foreground">Categoria(s):</p>
          <div className="mt-1 flex space-x-2">
            {detectedSpeeds.map((cat) => (
              <Badge
                key={cat}
                variant="secondary"
                className={`text-sm px-3 py-1 ${getSpeedBadgeClass(cat)}`}
              >
                {speedCategoryDescriptions[cat]}
              </Badge>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-center gap-2 mb-2">
            <TimerIcon className="h-4 w-4" />
            <p className="text-sm font-medium">
              {isRecording ? (
                <span className="text-green-600 dark:text-green-400 animate-pulse">
                  Gravando...
                </span>
              ) : (
                "Pronto para gravar"
              )}
            </p>
          </div>

          <p className="text-xs text-muted-foreground mb-3">
            {timestamps.length > 0
              ? `${timestamps.length} batida${
                  timestamps.length !== 1 ? "s" : ""
                } registrada${timestamps.length !== 1 ? "s" : ""}`
              : "Nenhuma batida registrada"}
          </p>

          <div className="flex space-x-2">
            <Button
              variant={isRecording ? "destructive" : "default"}
              className="flex-1 flex items-center justify-center gap-2"
              onClick={toggleRecording}
            >
              {isRecording ? (
                <>
                  <StopIcon className="h-4 w-4" />
                  Parar Gravação
                </>
              ) : (
                <>
                  <PlayIcon className="h-4 w-4" />
                  Iniciar Gravação
                </>
              )}
            </Button>

            <Button
              variant="outline"
              onClick={handleReset}
              className="flex items-center gap-1"
            >
              <ResetIcon className="h-4 w-4" />
              Resetar
            </Button>
          </div>
        </div>
      </div>

      <div className="border rounded-md p-4">
        <h4 className="text-sm font-semibold mb-3">Guia de Velocidades:</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-1 mb-4">
          {Object.entries(speedReferenceValues).map(([speed, value]) => (
            <div
              key={speed}
              className={`px-1 py-2 text-center rounded-md text-xs border ${
                detectedSpeeds.includes(speed as SpeedCategory)
                  ? "border-2 border-primary"
                  : ""
              } ${getSpeedBadgeClass(speed as SpeedCategory)}`}
            >
              <div className="font-medium truncate">
                {speedCategoryDescriptions[speed as SpeedCategory]}
              </div>
              <div className="mt-1">{value.toFixed(1)} m/s</div>
              <div>{Math.round(calculateBPM(value))} BPM</div>
            </div>
          ))}
        </div>

        <div className="text-xs text-muted-foreground">
          <p className="mb-1">
            <Badge variant="outline">Dica</Badge> Para uma medição precisa,
            pressione a tecla no mesmo momento em que ouvir um passo do
            fantasma.
          </p>
          <p>
            A velocidade é calculada com base no tempo médio entre os últimos{" "}
            {MAX_SAMPLES} passos.
          </p>
        </div>
      </div>

      <div className="mt-4 text-sm text-muted-foreground">
        <p>
          <Badge variant="outline">Info</Badge> A velocidade normal do fantasma
          é de 1.7 m/s (120 BPM ou 2 passos por segundo).
        </p>
        <p className="mt-1">
          Com linha de visão (LoS), a velocidade aumenta gradualmente até 1.65x
          em 13 segundos.
        </p>
      </div>
    </div>
  );
}

// Memoizando o componente inteiro para evitar rerenders desnecessários
export default memo(GhostSpeedCalculator);
