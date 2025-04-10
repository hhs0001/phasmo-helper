import { useEffect } from "react";
import { useGhostData } from "@/hooks/use-ghost";
import { useAppConfig } from "@/hooks/use-config";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ShowInfoProps {
  isOpen: boolean;
  onClose: () => void;
  ghostId?: string;
}

export default function ShowInfo({ isOpen, onClose, ghostId }: ShowInfoProps) {
  const { application } = useAppConfig();
  const {
    selectedGhost,
    selectGhost,
    evidenceTranslation,
    isGuaranteedEvidence,
    formatSpeedDescription,
    getPossibleEvidenceCombinations,
    gameMode,
  } = useGhostData();

  // Quando o componente é montado ou o ghostId muda, seleciona o fantasma
  useEffect(() => {
    if (ghostId) {
      selectGhost(ghostId);
    }
  }, [ghostId, selectGhost]);

  // Obtém todas as possíveis combinações de evidências para um fantasma
  const getEvidenceCombinationsDisplay = () => {
    if (!selectedGhost || (gameMode !== "Nightmare" && gameMode !== "Insanity"))
      return "";

    const combinations = getPossibleEvidenceCombinations(
      selectedGhost,
      gameMode
    );

    // Retorna uma representação das combinações para mostrar ao usuário
    return combinations
      .map((combo) => combo.map((ev) => evidenceTranslation[ev]).join(", "))
      .join(" | ");
  };

  // Conteúdo compartilhado para ambos os modos de exibição
  const renderGhostContent = () => {
    if (!selectedGhost) return null;

    return (
      <>
        <div className="mt-6 space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Evidências</h3>
            <div className="flex flex-wrap gap-2">
              {selectedGhost.evidences.map((evidence) => (
                <Badge
                  key={evidence}
                  variant={
                    isGuaranteedEvidence(selectedGhost, evidence)
                      ? "secondary"
                      : "outline"
                  }
                >
                  {evidenceTranslation[evidence]}
                  {isGuaranteedEvidence(selectedGhost, evidence) &&
                    " (Garantida)"}
                </Badge>
              ))}
            </div>

            {selectedGhost &&
              (gameMode === "Nightmare" || gameMode === "Insanity") && (
                <div className="text-sm mt-2">
                  <p className="font-medium">
                    Combinações possíveis no modo{" "}
                    {gameMode === "Nightmare" ? "Pesadelo" : "Insanidade"}:
                  </p>
                  <p>{getEvidenceCombinationsDisplay()}</p>
                </div>
              )}
          </div>

          <Separator />

          <div>
            <h3 className="text-lg font-semibold mb-2">Velocidade e Caçada</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Velocidade:</span>
                <span>{selectedGhost.speedDetails.description}</span>
              </div>
              <div className="flex justify-between">
                <span>Line of Sight (LoS):</span>
                <span>{selectedGhost.hasLOS ? "Sim" : "Não"}</span>
              </div>
              <div className="flex justify-between">
                <span>Limiar de caçada:</span>
                <span>{selectedGhost.huntThreshold}% de sanidade</span>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-lg font-semibold mb-2">Força</h3>
            <p>{selectedGhost.strengths}</p>
          </div>

          <Separator />

          <div>
            <h3 className="text-lg font-semibold mb-2">Fraqueza</h3>
            <p>{selectedGhost.weaknesses}</p>
          </div>

          <Separator />

          <div>
            <h3 className="text-lg font-semibold mb-2">Comportamentos</h3>
            <ScrollArea className="h-[200px]">
              <ul className="space-y-2">
                {selectedGhost.behaviors.map((behavior, index) => (
                  <li key={index} className="text-sm">
                    • {behavior.description}
                    {behavior.gameMode && (
                      <Badge className="ml-2" variant="outline">
                        {behavior.gameMode}
                      </Badge>
                    )}
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </div>

          {selectedGhost.media && selectedGhost.media.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="text-lg font-semibold mb-2">Galeria</h3>
                <div className="grid grid-cols-2 gap-2">
                  {selectedGhost.media.map((media, index) => (
                    <div
                      key={index}
                      className="relative aspect-video bg-muted rounded-md overflow-hidden"
                    >
                      {media.type === "image" && (
                        <img
                          src={media.url}
                          alt={media.description || "Imagem do fantasma"}
                          className="object-cover w-full h-full"
                        />
                      )}
                      {media.type === "gif" && (
                        <img
                          src={media.url}
                          alt={media.description || "GIF do fantasma"}
                          className="object-cover w-full h-full"
                        />
                      )}
                      {media.type === "video" && (
                        <video
                          src={media.url}
                          controls
                          className="object-cover w-full h-full"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </>
    );
  };

  if (application.showInfo === "panel") {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent className="w-full sm:max-w-md md:max-w-lg overflow-y-auto bg-secondary p-4">
          <SheetHeader>
            <div className="flex justify-between items-center">
              <SheetTitle>{selectedGhost?.name}</SheetTitle>
              <Badge variant="outline">
                {selectedGhost && formatSpeedDescription(selectedGhost)}
              </Badge>
            </div>
            <SheetDescription>{selectedGhost?.description}</SheetDescription>
          </SheetHeader>

          <div className="grid gap-4 py-4">{renderGhostContent()}</div>
          <SheetFooter className="pt-4 mt-4">
            <Button onClick={onClose} className="w-full">
              Fechar
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full sm:max-w-md md:max-w-lg overflow-y-auto bg-secondary">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle>{selectedGhost?.name}</DialogTitle>
            <Badge variant="outline">
              {selectedGhost && formatSpeedDescription(selectedGhost)}
            </Badge>
          </div>
          <DialogDescription>{selectedGhost?.description}</DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[400px]">
          {renderGhostContent()}
          <ScrollBar orientation="vertical" className="w-2 bg-muted" />
        </ScrollArea>
        <div className="pt-4 mt-4">
          <Button onClick={onClose} className="w-full">
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
