import { useState } from "react";
import { useGhostData } from "@/hooks/use-ghost";
import { useAppConfig } from "@/hooks/use-config";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import ShowInfo from "@/components/show-info";
import GameTimers from "@/components/game-timers";
import { toast } from "sonner";
import {
  InfoCircledIcon,
  ReloadIcon,
  ResetIcon,
  CheckIcon,
  Cross2Icon,
  DashIcon,
} from "@radix-ui/react-icons";
import { Evidence, GameMode, Ghost, GhostSpeed } from "@/types/ghost-schema";
import { useGhostStore } from "@/stores/ghost-store";

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
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">
              Categoria de Velocidade
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {Object.keys(speedTranslations).map((speed) => (
                <div key={speed} className="flex items-center space-x-2">
                  <Checkbox
                    id={`speed-${speed}`}
                    checked={filterOptions.speed[speed as GhostSpeed]}
                    onCheckedChange={() =>
                      toggleSpeedFilter(speed as GhostSpeed)
                    }
                  />
                  <Label htmlFor={`speed-${speed}`} className="cursor-pointer">
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
            <h3 className="text-lg font-semibold mb-2">Line of Sight (LoS)</h3>
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
              Filtra fantasmas que aceleram quando têm linha de visão direta com
              o jogador.
            </p>
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
            <Card
              key={ghost.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleGhostClick(ghost)}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle>{ghost.name}</CardTitle>
                  <div className="text-sm text-muted-foreground">
                    <Badge variant="outline">
                      {formatSpeedDescription(ghost)}
                    </Badge>
                  </div>
                </div>
                <CardDescription className="line-clamp-2">
                  {ghost.description.substring(0, 100)}...
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-2">
                  {ghost.evidences.map((evidence) => (
                    <Badge
                      key={evidence}
                      variant={
                        isGuaranteedEvidence(ghost, evidence)
                          ? "secondary"
                          : "outline"
                      }
                    >
                      {evidenceTranslation[evidence]}
                      {isGuaranteedEvidence(ghost, evidence) && " (G)"}
                    </Badge>
                  ))}
                </div>

                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  <span>Caça: {formatSanityThreshold(ghost)}</span>
                  {ghost.hasLOS && <span>Tem LoS</span>}
                </div>

                {(gameMode === "Nightmare" || gameMode === "Insanity") && (
                  <div className="text-xs text-muted-foreground mt-2">
                    <p>Combinações possíveis:</p>
                    <p>{getEvidenceCombinationsDisplay(ghost)}</p>
                  </div>
                )}
              </CardContent>
            </Card>
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
        mapSize="medium"
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
