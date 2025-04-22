import { useState, useEffect } from "react";
import { useGhostData } from "@/hooks/use-ghost";
import { useAppConfig } from "@/hooks/use-config";
import { useGame } from "@/hooks/use-game";
import { eventBus } from "@/lib/events"; // Adicionando importação do eventBus
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import ShowInfo from "@/components/show-info";
import GameTimers from "@/components/game-timers";
import GhostSpeedCalculator from "@/components/ghost-speed-calculator";
import { toast } from "sonner";
import {
  InfoCircledIcon,
  ReloadIcon,
  ResetIcon,
  CheckIcon,
  Cross2Icon,
  DashIcon,
  PlayIcon,
  StopIcon,
} from "@radix-ui/react-icons";
import { Evidence, GameMode, Ghost, GhostSpeed } from "@/types/ghost-schema";
import { useGhostStore } from "@/stores/ghost-store";
import { SkullIcon } from "lucide-react";
import GhostCard from "@/components/ghost-card";

export default function GhostsPage() {
  const {
    possibleGhosts,
    allEvidences,
    evidenceTranslation,
    speedTranslations,
    formatSpeedDescription,
    formatSanityThreshold,
    isGuaranteedEvidence,
    getPossibleEvidenceCombinations,
    refreshFromAPI,
    isLoading,
    lastUpdate,
    resetFilters,
    filterOptions,
    toggleEvidenceInclusion,
    toggleSpeedFilter,
    toggleLOSFilter,
    updateSanityThreshold,
    getEvidenceInclusionState,
    ghostsMap,
  } = useGhostData();

  const { gameMode, setGameMode } = useGhostStore();
  const { config } = useAppConfig();
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [selectedGhostId, setSelectedGhostId] = useState<string | undefined>(
    undefined
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("evidences");

  // Adicionando o hook useGame
  const {
    isGameActive,
    startGame,
    endGame,
    resetGame,
    guessGhost,
    confirmActualGhost,
    setPlayerDied,
    isGhostGuessed,
    isGhostConfirmed,
    gameStats,
    isPlayerDead,
  } = useGame();

  // Estado para o tamanho do mapa
  const [mapSize, setMapSize] = useState<"small" | "medium" | "large">(
    "medium"
  );

  // Escutar o evento para selecionar a aba de velocidade
  useEffect(() => {
    const handleSelectSpeedTab = () => {
      setActiveTab("speed");
    };

    // Registrar o listener de evento
    const unsubscribe = eventBus.subscribe(
      "ghosts:selectSpeedTab",
      handleSelectSpeedTab
    );

    // Limpar o listener quando o componente for desmontado
    return () => {
      unsubscribe();
    };
  }, []);

  // Função para abrir o modal com detalhes do fantasma
  const handleGhostClick = (ghost: Ghost) => {
    setSelectedGhostId(ghost.id);
    setIsInfoOpen(true);
  };

  // Função para atualizar os dados da API
  const handleRefreshData = async () => {
    setIsRefreshing(true);
    try {
      const updated = await refreshFromAPI();
      if (updated) {
        toast.success("Dados atualizados com sucesso!");
      } else {
        toast.info("Os dados já estão atualizados.");
      }
    } catch (error) {
      toast.error("Erro ao atualizar dados. Verifique sua conexão.");
      console.error("Erro ao atualizar dados:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Formatar a data da última atualização
  const formatLastUpdate = () => {
    if (!lastUpdate) return "Nunca atualizado";
    return new Date(lastUpdate).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Mudamos o modo de jogo no contexto, que por sua vez altera a filtragem
  const handleGameModeChange = (value: string) => {
    setGameMode(value as GameMode);
  };

  // Obtém todas as possíveis combinações de evidências para um fantasma
  const getEvidenceCombinationsDisplay = (ghost: Ghost): string => {
    if (gameMode !== "Nightmare" && gameMode !== "Insanity") return "";

    const combinations = getPossibleEvidenceCombinations(ghost, gameMode);

    // Retorna uma representação das combinações para mostrar ao usuário
    return combinations
      .map((combo) => combo.map((ev) => evidenceTranslation[ev]).join(", "))
      .join(" | ");
  };

  // Reseta todos os filtros
  const handleResetFilters = () => {
    resetFilters();
  };

  // Função para encontrar a keybind associada a uma evidência
  const getEvidenceKeybind = (evidence: Evidence): string | null => {
    // Mapeamento inverso de evidências para IDs de keybind
    const evidenceToKeybindId: Record<Evidence, string> = {
      EMF: "EMF5",
      DotsProjector: "DOTSProjector",
      GhostOrb: "GhostOrb",
      GhostWriting: "GhostWriting",
      Fingerprints: "Fingerprints",
      SpiritBox: "SpiritBox",
      FreezingTemps: "Freezing",
    };

    const keybindId = evidenceToKeybindId[evidence];
    if (!keybindId || !config.keybinds[keybindId]?.enabled) return null;

    return config.keybinds[keybindId].key;
  };

  // Renderiza o ícone apropriado para o estado de inclusão da evidência
  const renderEvidenceStateIcon = (evidence: Evidence) => {
    const state = getEvidenceInclusionState(evidence);

    if (state === "include") {
      return <CheckIcon className="h-4 w-4 text-green-500" />;
    } else if (state === "exclude") {
      return <Cross2Icon className="h-4 w-4 text-red-500" />;
    } else {
      return <DashIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  // Renderiza a cor de fundo apropriada para o estado de inclusão da evidência
  const getEvidenceButtonClass = (evidence: Evidence) => {
    const state = getEvidenceInclusionState(evidence);

    if (state === "include") {
      return "bg-green-100 dark:bg-green-900 border-green-500";
    } else if (state === "exclude") {
      return "bg-red-100 dark:bg-red-900 border-red-500";
    } else {
      return "";
    }
  };

  // Define o max e min dos valores de sanidade
  const sanityRange = { min: 0, max: 100 };
  const currentSanityMin = filterOptions.huntThreshold.min ?? sanityRange.min;
  const currentSanityMax = filterOptions.huntThreshold.max ?? sanityRange.max;

  // Obtém o estado do filtro de LOS
  const getLOSFilterState = () => {
    if (filterOptions.hasLOS === "include") {
      return "Com LoS";
    } else if (filterOptions.hasLOS === "exclude") {
      return "Sem LoS";
    } else {
      return "Qualquer";
    }
  };

  // Mostra o número de fantasmas possíveis após os filtros
  const totalGhosts = Object.keys(ghostsMap).length;
  const filteredGhostsCount = possibleGhosts.length;

  return (
    <main className="p-4 container mx-auto">
      <h1 className="text-3xl font-bold mb-6">Fantasmas</h1>

      {/* Controles para jogo atual */}
      <div className="mb-6 p-4 bg-card rounded-md border">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold mb-2">Investigação Atual</h2>
            <div className="flex items-center gap-2">
              {isGameActive ? (
                <>
                  <Badge
                    variant="outline"
                    className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                  >
                    Investigação em andamento
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={endGame}
                    className="flex items-center gap-1"
                  >
                    <StopIcon className="h-3.5 w-3.5" />
                    Encerrar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetGame}
                    className="flex items-center gap-1"
                  >
                    <ResetIcon className="h-3.5 w-3.5" />
                    Reiniciar
                  </Button>
                </>
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  onClick={startGame}
                  className="flex items-center gap-1"
                >
                  <PlayIcon className="h-3.5 w-3.5" />
                  Iniciar Nova Investigação
                </Button>
              )}
            </div>
          </div>

          {isGameActive && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm">Você morreu?</span>
              <div className="flex gap-1">
                <Button
                  variant={isPlayerDead() ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPlayerDied(true)}
                  className="flex items-center gap-1"
                >
                  <SkullIcon className="h-3.5 w-3.5" />
                  Sim
                </Button>
                <Button
                  variant={isPlayerDead() === false ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPlayerDied(false)}
                  className="flex items-center gap-1"
                >
                  <CheckIcon className="h-3.5 w-3.5" />
                  Não
                </Button>
              </div>
            </div>
          )}

          <div className="flex flex-col">
            <h3 className="text-sm font-medium">Estatísticas:</h3>
            <div className="text-xs text-muted-foreground">
              <div className="flex gap-2">
                <span>Jogos: {gameStats.totalGames}</span>
                <span>Acertos: {gameStats.correctGuesses}</span>
                <span>Mortes: {gameStats.deaths}</span>
              </div>
              <div>Taxa de acerto: {gameStats.winRate.toFixed(1)}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Cabeçalho com modo de jogo e botões */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <h2 className="text-xl font-semibold">Modo de Jogo:</h2>
          <Select value={gameMode} onValueChange={handleGameModeChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Selecione o modo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Amateur">Amador</SelectItem>
              <SelectItem value="Intermediate">Intermediário</SelectItem>
              <SelectItem value="Professional">Profissional</SelectItem>
              <SelectItem value="Nightmare">Pesadelo</SelectItem>
              <SelectItem value="Insanity">Insanidade</SelectItem>
            </SelectContent>
          </Select>
          {/* Seletor de tamanho de mapa */}
          <h2 className="text-xl font-semibold ml-6">Tamanho do Mapa:</h2>
          <Select
            value={mapSize}
            onValueChange={(v) => setMapSize(v as "small" | "medium" | "large")}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Tamanho do mapa" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="small">Pequeno</SelectItem>
              <SelectItem value="medium">Médio</SelectItem>
              <SelectItem value="large">Grande</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshData}
            disabled={isRefreshing || isLoading}
          >
            {isRefreshing ? (
              <>
                <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
                Atualizando...
              </>
            ) : (
              <>
                <ReloadIcon className="mr-2 h-4 w-4" />
                Atualizar dados
              </>
            )}
          </Button>
          <span className="text-xs text-muted-foreground">
            Última atualização: {formatLastUpdate()}
          </span>
        </div>
      </div>

      {/* Informação sobre os filtros */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">Filtros</h2>
          <Badge variant="outline">
            {filteredGhostsCount} / {totalGhosts} fantasmas
          </Badge>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleResetFilters}
          className="flex items-center gap-1"
        >
          <ResetIcon className="h-4 w-4" />
          Limpar Filtros
        </Button>
      </div>

      {/* Abas de filtros */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="evidences">Evidências</TabsTrigger>
          <TabsTrigger value="speed">Velocidade e LoS</TabsTrigger>
          <TabsTrigger value="sanity">Sanidade</TabsTrigger>
        </TabsList>

        {/* Tab de evidências */}
        <TabsContent
          value="evidences"
          className="p-4 bg-card rounded-md border"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {allEvidences.map((evidence) => {
              const keybind = getEvidenceKeybind(evidence);
              return (
                <button
                  key={evidence}
                  onClick={() => toggleEvidenceInclusion(evidence)}
                  className={`p-3 flex items-center justify-between rounded-md border ${getEvidenceButtonClass(
                    evidence
                  )} hover:bg-muted transition-colors`}
                >
                  <div className="flex items-center gap-2">
                    <span>{evidenceTranslation[evidence]}</span>
                    {keybind && (
                      <Badge variant="secondary" className="text-xs">
                        {keybind}
                      </Badge>
                    )}
                  </div>
                  {renderEvidenceStateIcon(evidence)}
                </button>
              );
            })}
          </div>

          <div className="mt-4 text-sm text-muted-foreground">
            <p className="flex items-center gap-2">
              <InfoCircledIcon className="h-4 w-4" />
              Clique para alternar entre incluir, excluir ou neutro.
            </p>

            {/* Atalho para resetar os filtros */}
            {config.keybinds.resetEvidence?.enabled && (
              <p className="flex items-center gap-2 mt-2">
                <ResetIcon className="h-4 w-4" />
                Pressione{" "}
                <Badge variant="outline">
                  {config.keybinds.resetEvidence.key}
                </Badge>{" "}
                para resetar todos os filtros.
              </p>
            )}
          </div>
        </TabsContent>

        {/* Tab de velocidade */}
        <TabsContent value="speed" className="p-4 bg-card rounded-md border">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">
                  Categoria de Velocidade
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {Object.keys(speedTranslations).map((speed) => (
                    <div key={speed} className="flex items-center space-x-2">
                      <Checkbox
                        id={`speed-${speed}`}
                        checked={filterOptions.speed[speed as GhostSpeed]}
                        onCheckedChange={() =>
                          toggleSpeedFilter(speed as GhostSpeed)
                        }
                      />
                      <Label
                        htmlFor={`speed-${speed}`}
                        className="cursor-pointer"
                      >
                        {speedTranslations[speed as GhostSpeed]}
                      </Label>
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Selecione as categorias de velocidade a incluir.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">
                  Line of Sight (LoS)
                </h3>
                <div className="flex items-center justify-between">
                  <p className="text-muted-foreground">
                    Estado atual:{" "}
                    <Badge variant="outline">{getLOSFilterState()}</Badge>
                  </p>
                  <Button variant="outline" onClick={toggleLOSFilter} size="sm">
                    Alternar LoS
                  </Button>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Filtra fantasmas que aceleram quando têm linha de visão direta
                  com o jogador.
                </p>
              </div>
            </div>

            {/* Integrando a calculadora de velocidade na aba com filtragem automática */}
            <div className="border rounded-md p-4 bg-card/50">
              <GhostSpeedCalculator
                onDetectSpeed={(speed) => {
                  if (speed === "unknown") return;

                  // Resetar todas as categorias de velocidade primeiro
                  Object.keys(filterOptions.speed).forEach((s) => {
                    if (filterOptions.speed[s as GhostSpeed]) {
                      toggleSpeedFilter(s as GhostSpeed);
                    }
                  });

                  // Ativar apenas a categoria detectada
                  if (!filterOptions.speed[speed]) {
                    toggleSpeedFilter(speed);
                  }

                  // Muda para a aba de velocidade para mostrar o resultado
                  if (activeTab !== "speed") {
                    setActiveTab("speed");
                  }
                }}
              />
              {config.keybinds.ghostSpeed?.enabled && (
                <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                  <Badge variant="outline" className="mr-1">
                    Dica
                  </Badge>
                  Pressione{" "}
                  <Badge variant="secondary">
                    {config.keybinds.ghostSpeed.key}
                  </Badge>{" "}
                  para atualizar o metrônomo e filtrar os fantasmas
                  automaticamente
                </p>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Tab de sanidade */}
        <TabsContent value="sanity" className="p-4 bg-card rounded-md border">
          <div className="mb-4">
            <div className="flex justify-between mb-2">
              <h3 className="text-lg font-semibold">
                Limiar de Caçada (Sanidade)
              </h3>
              <span className="text-sm">
                {currentSanityMin}% - {currentSanityMax}%
              </span>
            </div>
            <Slider
              min={sanityRange.min}
              max={sanityRange.max}
              step={5}
              value={[currentSanityMin, currentSanityMax]}
              onValueChange={(values: number[]) => {
                updateSanityThreshold(values[0], values[1]);
              }}
              className="mb-4"
            />
            <p className="text-sm text-muted-foreground">
              Filtra fantasmas pelo percentual de sanidade em que começam a
              caçar.
            </p>

            <div className="mt-6">
              <h4 className="font-medium mb-2">Limiares comuns:</h4>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateSanityThreshold(40, 40)}
                >
                  40%
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateSanityThreshold(50, 50)}
                >
                  50%
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateSanityThreshold(60, 60)}
                >
                  60%
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateSanityThreshold(75, 75)}
                >
                  75%
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateSanityThreshold(85, 85)}
                >
                  85%
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateSanityThreshold(100, 100)}
                >
                  100%
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateSanityThreshold(null, null)}
                >
                  Resetar
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Informação sobre o modo de jogo */}
      {(gameMode === "Nightmare" || gameMode === "Insanity") && (
        <div className="mb-6 p-4 bg-muted rounded-lg">
          <h3 className="text-lg font-semibold mb-2">
            Informação do Modo{" "}
            {gameMode === "Nightmare" ? "Pesadelo" : "Insanidade"}
          </h3>
          <p>
            {gameMode === "Nightmare"
              ? "No modo Pesadelo, cada fantasma mostrará apenas 2 das 3 evidências possíveis. Evidências garantidas (como Orbe do Mímico) sempre aparecerão."
              : "No modo Insanidade, é visível apenas 1 evidência no total. Evidências garantidas (como Orbe do Mímico) sempre aparecerão."}
          </p>
        </div>
      )}

      {/* Lista de Fantasmas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {possibleGhosts.length > 0 ? (
          possibleGhosts.map((ghost) => (
            <GhostCard
              key={ghost.id}
              ghost={ghost}
              gameMode={gameMode}
              isGameActive={isGameActive}
              isGuessed={isGhostGuessed(ghost.id)}
              isConfirmed={isGhostConfirmed(ghost.id)}
              evidenceTranslation={evidenceTranslation}
              formatSpeedDescription={formatSpeedDescription}
              formatSanityThreshold={formatSanityThreshold}
              isGuaranteedEvidence={isGuaranteedEvidence}
              getEvidenceCombinationsDisplay={getEvidenceCombinationsDisplay}
              onGhostClick={handleGhostClick}
              onGuessGhost={guessGhost}
              onConfirmGhost={confirmActualGhost}
            />
          ))
        ) : (
          <div className="col-span-full text-center p-8">
            <p className="text-lg text-muted-foreground">
              Nenhum fantasma corresponde aos filtros selecionados.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={handleResetFilters}
            >
              <ResetIcon className="mr-2 h-4 w-4" />
              Limpar todos os filtros
            </Button>
          </div>
        )}
      </div>

      {/* Componente de Timers */}
      <GameTimers
        difficulty={
          gameMode.toLowerCase() as "amateur" | "intermediate" | "professional"
        }
        mapSize={mapSize}
      />

      {/* Componente ShowInfo para detalhes do fantasma */}
      <ShowInfo
        isOpen={isInfoOpen}
        onClose={() => setIsInfoOpen(false)}
        ghostId={selectedGhostId}
      />
    </main>
  );
}
