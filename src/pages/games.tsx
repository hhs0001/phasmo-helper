import { useEffect, useState } from "react";
import { useGame } from "@/hooks/use-game";
import { useGhostData } from "@/hooks/use-ghost";
import { formatGameDate } from "@/lib/game-tracker";
import { useNavigationStore } from "@/stores/navigation-store";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PlayIcon,
  CheckIcon,
  Cross2Icon,
  ReloadIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon,
  TrashIcon,
} from "@radix-ui/react-icons";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { SkullIcon } from "lucide-react";
import { toast } from "sonner";

export default function GamesPage() {
  const [activeTab, setActiveTab] = useState("overview");
  // Obter a função de navegação do store
  const { setCurrentPage } = useNavigationStore();
  const {
    gameStats,
    gameHistory,
    isLoading,
    isGameActive,
    currentGame,
    loadHistory,
    startGame,
    deleteGame,
  } = useGame();
  const { ghostsMap } = useGhostData();

  // Carrega o histórico de jogos na inicialização da página, usando um array de dependências vazio
  // para garantir que isto só aconteça uma vez quando o componente montar
  useEffect(() => {
    // Evitamos chamar loadHistory se já tivermos dados carregados
    if (gameHistory.length === 0) {
      loadHistory();
    }
  }, []); // Removido loadHistory da dependência para evitar loops

  // Inicia um novo jogo e navega para a página de fantasmas
  const handleStartNewGame = async () => {
    await startGame();
    setCurrentPage("Ghosts");
  };

  // Função para navegar para a página de fantasmas
  const handleNavigateToGhosts = () => {
    setCurrentPage("Ghosts");
  };

  // Função para obter o nome do fantasma a partir do ID
  const getGhostName = (ghostId?: string) => {
    if (!ghostId) return "Desconhecido";
    return ghostsMap[ghostId]?.name || "Desconhecido";
  };

  // Função para atualizar o histórico de forma segura
  const handleRefreshHistory = () => {
    loadHistory();
  };

  // Função para deletar um registro de jogo
  const handleDeleteGame = async (gameId: string) => {
    try {
      await deleteGame(gameId);
      toast.success("Registro removido com sucesso");
      loadHistory(); // Recarregar o histórico após a exclusão
    } catch (error) {
      toast.error("Erro ao remover registro");
      console.error("Erro ao deletar jogo:", error);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Estatísticas do Caçador</h1>

      {/* Visão geral das estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Partidas</CardTitle>
            <CardDescription>Total de investigações</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {isLoading ? (
                <Skeleton className="w-12 h-8" />
              ) : (
                gameStats.totalGames
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Acertos</CardTitle>
            <CardDescription>
              Fantasmas identificados corretamente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {isLoading ? (
                <Skeleton className="w-12 h-8" />
              ) : (
                gameStats.correctGuesses
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Taxa de Acerto</CardTitle>
            <CardDescription>Porcentagem de palpites corretos</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {isLoading ? (
                <Skeleton className="w-12 h-8" />
              ) : (
                `${gameStats.winRate.toFixed(1)}%`
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Mortes</CardTitle>
            <CardDescription>Vezes que você não sobreviveu</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {isLoading ? <Skeleton className="w-12 h-8" /> : gameStats.deaths}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Partida atual ou botão para iniciar - Card mais compacto */}
      <Card className="mb-8">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Status da Investigação</CardTitle>
              <CardDescription>
                {isGameActive
                  ? "Investigação em andamento"
                  : "Nenhuma investigação ativa"}
              </CardDescription>
            </div>
            {isGameActive && (
              <Button
                variant="default"
                size="sm"
                onClick={handleNavigateToGhosts}
              >
                <ArrowRightIcon className="mr-2 h-4 w-4" />
                Continuar
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isGameActive && currentGame ? (
            <div className="flex flex-wrap items-center gap-4 py-2">
              <Badge
                variant="outline"
                className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
              >
                Investigação ativa
              </Badge>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <ClockIcon className="h-3.5 w-3.5" />
                Início: {formatGameDate(currentGame.startTime)}
              </p>
              {currentGame.guessedGhostId && (
                <Badge
                  variant="outline"
                  className="bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200"
                >
                  Palpite: {getGhostName(currentGame.guessedGhostId)}
                </Badge>
              )}
              {currentGame.died ? (
                <Badge
                  variant="outline"
                  className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 flex items-center gap-1"
                >
                  <SkullIcon className="h-3.5 w-3.5" />
                  Você morreu
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                >
                  Sobrevivendo
                </Badge>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center py-4">
              <Button variant="default" onClick={handleStartNewGame}>
                <PlayIcon className="mr-2 h-4 w-4" />
                Iniciar Nova Investigação
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Histórico de partidas em abas */}
      <div>
        <Tabs
          defaultValue={activeTab}
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              Histórico de Investigações
            </h2>
            <div className="flex items-center gap-2">
              <TabsList>
                <TabsTrigger value="overview">Resumo</TabsTrigger>
                <TabsTrigger value="history">Histórico Completo</TabsTrigger>
              </TabsList>

              <Button
                variant="outline"
                size="icon"
                onClick={handleRefreshHistory}
                title="Atualizar histórico"
              >
                <ReloadIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <TabsContent value="overview" className="space-y-4 mt-2">
            {isLoading ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-full" />
                  </div>
                </CardContent>
              </Card>
            ) : gameHistory.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <ExclamationTriangleIcon className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="mt-2 text-muted-foreground">
                    Nenhuma investigação anterior encontrada.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {gameHistory.slice(0, 6).map((game) => (
                  <Card key={game.id}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">
                            {getGhostName(game.actualGhostId)}
                          </CardTitle>
                          <CardDescription>
                            {formatGameDate(game.startTime)}
                          </CardDescription>
                        </div>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <TrashIcon className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="bg-primary-foreground">
                            <DialogHeader>
                              <DialogTitle>
                                Excluir registro de jogo
                              </DialogTitle>
                              <DialogDescription>
                                Tem certeza que deseja excluir este registro de
                                jogo? Esta ação não pode ser desfeita.
                              </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                              <DialogClose asChild>
                                <Button variant="outline">Cancelar</Button>
                              </DialogClose>
                              <Button
                                onClick={() => handleDeleteGame(game.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Excluir
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">
                          Status:
                        </span>
                        {game.wasCorrect === true && (
                          <Badge
                            variant="outline"
                            className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 flex items-center gap-1"
                          >
                            <CheckIcon className="h-3.5 w-3.5" />
                            Acertou
                          </Badge>
                        )}
                        {game.wasCorrect === false && (
                          <Badge
                            variant="outline"
                            className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 flex items-center gap-1"
                          >
                            <Cross2Icon className="h-3.5 w-3.5" />
                            Errou
                          </Badge>
                        )}
                        {game.wasCorrect === undefined && (
                          <Badge
                            variant="outline"
                            className="text-muted-foreground"
                          >
                            Indefinido
                          </Badge>
                        )}
                      </div>

                      {game.guessedGhostId &&
                        game.guessedGhostId !== game.actualGhostId && (
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">
                              Seu palpite:
                            </span>
                            <span>{getGhostName(game.guessedGhostId)}</span>
                          </div>
                        )}

                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">
                          Resultado:
                        </span>
                        {game.died ? (
                          <Badge
                            variant="outline"
                            className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 flex items-center gap-1"
                          >
                            <SkullIcon className="h-3.5 w-3.5" />
                            Morto
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                          >
                            Sobreviveu
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {!isLoading && gameHistory.length > 6 && (
              <div className="text-center mt-4">
                <Button
                  variant="outline"
                  onClick={() => setActiveTab("history")}
                >
                  Ver histórico completo
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardContent className="pt-6">
                {isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                ) : gameHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <ExclamationTriangleIcon className="mx-auto h-8 w-8 text-muted-foreground" />
                    <p className="mt-2 text-muted-foreground">
                      Nenhuma investigação anterior encontrada.
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="h-[500px] rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Fantasma</TableHead>
                          <TableHead>Seu palpite</TableHead>
                          <TableHead className="text-center">
                            Resultado
                          </TableHead>
                          <TableHead className="text-center">Status</TableHead>
                          <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {gameHistory.map((game) => (
                          <TableRow key={game.id}>
                            <TableCell className="font-medium">
                              {formatGameDate(game.startTime)}
                            </TableCell>
                            <TableCell>
                              {getGhostName(game.actualGhostId)}
                            </TableCell>
                            <TableCell>
                              {getGhostName(game.guessedGhostId)}
                            </TableCell>
                            <TableCell className="text-center">
                              {game.died ? (
                                <Badge
                                  variant="outline"
                                  className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"
                                >
                                  Morto
                                </Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                                >
                                  Sobreviveu
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              {game.wasCorrect === true && (
                                <Badge
                                  variant="outline"
                                  className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                                >
                                  Acertou
                                </Badge>
                              )}
                              {game.wasCorrect === false && (
                                <Badge
                                  variant="outline"
                                  className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"
                                >
                                  Errou
                                </Badge>
                              )}
                              {game.wasCorrect === undefined && (
                                <Badge
                                  variant="outline"
                                  className="text-muted-foreground"
                                >
                                  Indefinido
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                  >
                                    <TrashIcon className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>
                                      Excluir registro de jogo
                                    </DialogTitle>
                                    <DialogDescription>
                                      Tem certeza que deseja excluir este
                                      registro de jogo? Esta ação não pode ser
                                      desfeita.
                                    </DialogDescription>
                                  </DialogHeader>
                                  <DialogFooter>
                                    <DialogClose asChild>
                                      <Button variant="outline">
                                        Cancelar
                                      </Button>
                                    </DialogClose>
                                    <Button
                                      onClick={() => handleDeleteGame(game.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Excluir
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
