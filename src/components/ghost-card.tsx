import { FC } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckIcon, TargetIcon } from "@radix-ui/react-icons";
import { Evidence, GameMode, Ghost } from "@/types/ghost-schema";

interface GhostCardProps {
  ghost: Ghost;
  gameMode: GameMode;
  isGameActive: boolean;
  isGuessed: boolean;
  isConfirmed: boolean;
  evidenceTranslation: Record<Evidence, string>;
  formatSpeedDescription: (ghost: Ghost) => string;
  formatSanityThreshold: (ghost: Ghost) => string;
  isGuaranteedEvidence: (ghost: Ghost, evidence: Evidence) => boolean;
  getEvidenceCombinationsDisplay: (ghost: Ghost) => string;
  onGhostClick: (ghost: Ghost) => void;
  onGuessGhost: (ghostId: string) => void;
  onConfirmGhost: (ghostId: string) => void;
}

const GhostCard: FC<GhostCardProps> = ({
  ghost,
  gameMode,
  isGameActive,
  isGuessed,
  isConfirmed,
  evidenceTranslation,
  formatSpeedDescription,
  formatSanityThreshold,
  isGuaranteedEvidence,
  getEvidenceCombinationsDisplay,
  onGhostClick,
  onGuessGhost,
  onConfirmGhost,
}) => {
  return (
    <Card
      className={`hover:shadow-md transition-shadow flex flex-col h-full ${
        isGuessed && isConfirmed
          ? "border-green-500 dark:border-green-400 border-2 bg-green-50 dark:bg-green-950/30"
          : isGuessed
          ? "border-amber-500 dark:border-amber-400 border-2 bg-amber-50 dark:bg-amber-950/30"
          : isConfirmed
          ? "border-green-500 dark:border-green-400 border-2 bg-green-50 dark:bg-green-950/30"
          : ""
      }`}
    >
      <CardHeader
        className="pb-2 cursor-pointer flex-shrink-0"
        onClick={() => onGhostClick(ghost)}
      >
        <div className="flex justify-between items-start">
          <CardTitle>{ghost.name}</CardTitle>
          <div className="text-sm text-muted-foreground">
            <Badge variant="outline">{formatSpeedDescription(ghost)}</Badge>
          </div>
        </div>
        <CardDescription className="line-clamp-2 h-10 overflow-hidden">
          {ghost.description.substring(0, 100)}...
        </CardDescription>
      </CardHeader>

      <CardContent
        className="cursor-pointer flex-grow"
        onClick={() => onGhostClick(ghost)}
      >
        <div className="flex flex-wrap gap-2 mb-2 min-h-[28px]">
          {ghost.evidences.map((evidence) => (
            <Badge
              key={evidence}
              variant={
                isGuaranteedEvidence(ghost, evidence) ? "secondary" : "outline"
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
          <div className="text-xs text-muted-foreground mt-2 min-h-[3.5rem] max-h-14 overflow-y-auto">
            <p>Combinações possíveis:</p>
            <p className="truncate">{getEvidenceCombinationsDisplay(ghost)}</p>
          </div>
        )}
      </CardContent>

      {/* Botões de jogo para o card, visíveis apenas quando há um jogo ativo */}
      {isGameActive && (
        <CardFooter className="flex flex-wrap justify-between gap-2 border-t pt-4 mt-auto min-h-[60px]">
          <div>
            {isGuessed ? (
              <Badge
                variant="outline"
                className="bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 flex items-center"
              >
                <CheckIcon className="h-3.5 w-3.5 mr-1" />
                Seu palpite
              </Badge>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onGuessGhost(ghost.id);
                }}
                className="flex items-center gap-1"
              >
                <TargetIcon className="h-3.5 w-3.5" />
                Meu palpite
              </Button>
            )}
          </div>

          <div>
            {isConfirmed ? (
              <Badge
                variant="outline"
                className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 flex items-center"
              >
                <CheckIcon className="h-3.5 w-3.5 mr-1" />
                Era este
              </Badge>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onConfirmGhost(ghost.id);
                }}
                className="flex items-center gap-1"
              >
                <CheckIcon className="h-3.5 w-3.5" />
                Era este
              </Button>
            )}
          </div>
        </CardFooter>
      )}
    </Card>
  );
};

export default GhostCard;
