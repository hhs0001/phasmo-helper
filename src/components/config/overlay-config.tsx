import { useAppConfig } from "@/hooks/use-config";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AppConfig } from "@/stores/config-store";

type PositionOption = {
  value: AppConfig["overlay"]["position"];
  label: string;
};

const positionOptions: PositionOption[] = [
  { value: "top-left", label: "Superior Esquerdo" },
  { value: "top-right", label: "Superior Direito" },
  { value: "bottom-left", label: "Inferior Esquerdo" },
  { value: "bottom-right", label: "Inferior Direito" },
];

export function OverlayConfig() {
  const {
    overlay,
    isLoading,
    toggleOverlay,
    setOverlayOpacity,
    setOverlayPosition,
    toggleAlwaysOnTop,
  } = useAppConfig();

  if (isLoading) {
    return <div className="py-4">Carregando configurações...</div>;
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-medium">Configurações do Overlay</h2>
        <p className="text-sm text-muted-foreground">
          Ajuste como o overlay aparece sobre o jogo Phasmophobia
        </p>
      </div>

      <div className="space-y-4 rounded-md border p-4">
        {/* Ativar/Desativar Overlay */}
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="overlay-toggle">Ativar Overlay</Label>
            <p className="text-sm text-muted-foreground">
              Exibe o overlay sobre o jogo
            </p>
          </div>
          <Switch
            id="overlay-toggle"
            checked={overlay.enabled}
            onCheckedChange={toggleOverlay}
          />
        </div>

        <Separator />

        {/* Sempre no Topo */}
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="always-on-top">Sempre no Topo</Label>
            <p className="text-sm text-muted-foreground">
              Mantém o overlay sempre visível sobre outras janelas
            </p>
          </div>
          <Switch
            id="always-on-top"
            checked={overlay.alwaysOnTop}
            onCheckedChange={toggleAlwaysOnTop}
          />
        </div>

        <Separator />

        {/* Posição do Overlay */}
        <div className="space-y-2">
          <Label htmlFor="overlay-position">Posição do Overlay</Label>
          <Select
            value={overlay.position}
            onValueChange={(value) =>
              setOverlayPosition(value as AppConfig["overlay"]["position"])
            }
          >
            <SelectTrigger id="overlay-position" className="w-full">
              <SelectValue placeholder="Selecione a posição" />
            </SelectTrigger>
            <SelectContent>
              {positionOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Opacidade do Overlay */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label htmlFor="overlay-opacity">Opacidade</Label>
            <span className="text-sm">
              {Math.round(overlay.opacity * 100)}%
            </span>
          </div>
          <input
            id="overlay-opacity"
            type="range"
            min="0.1"
            max="1"
            step="0.05"
            value={overlay.opacity}
            onChange={(e) => setOverlayOpacity(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}
