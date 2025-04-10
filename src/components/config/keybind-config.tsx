import { useState } from "react";
import { useAppConfig } from "@/hooks/use-config";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { KeybindConfig } from "@/contexts/config-context";

type KeybindRowProps = {
  id: string;
  keybind: KeybindConfig;
};

export function KeybindRow({ id, keybind }: KeybindRowProps) {
  const { setKeybind, toggleKeybind } = useAppConfig();
  const [isRecording, setIsRecording] = useState(false);
  const [currentKey, setCurrentKey] = useState(keybind.key);

  // Função para iniciar a gravação de uma nova tecla
  const startRecording = () => {
    setIsRecording(true);
  };

  // Função para capturar a tecla pressionada
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isRecording) return;

    e.preventDefault();
    const key = e.key.toUpperCase();

    // Ignorar teclas modificadoras quando pressionadas sozinhas
    if (["CONTROL", "ALT", "SHIFT", "META"].includes(key)) {
      return;
    }

    setCurrentKey(key);
    setKeybind(id, key);
    setIsRecording(false);
  };

  // Função para alternar a ativação do keybind
  const handleToggle = (checked: boolean) => {
    toggleKeybind(id, checked);
  };

  return (
    <div className="flex items-center justify-between space-x-4 py-2">
      <div className="flex-1">
        <Label htmlFor={`keybind-${id}`}>{keybind.description}</Label>
      </div>

      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={startRecording}
          className={isRecording ? "bg-primary text-primary-foreground" : ""}
          onKeyDown={handleKeyDown}
          tabIndex={isRecording ? 0 : -1}
        >
          {isRecording ? "Pressione uma tecla..." : currentKey}
        </Button>

        <Switch
          id={`keybind-toggle-${id}`}
          checked={keybind.enabled}
          onCheckedChange={handleToggle}
        />
      </div>
    </div>
  );
}

export function KeybindConfig() {
  const { keybinds, isLoading } = useAppConfig();

  if (isLoading) {
    return <div className="py-4">Carregando configurações...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Teclas de Atalho</h2>
        <div className="text-sm text-muted-foreground">Ativo</div>
      </div>

      <div className="space-y-2 rounded-md border p-4">
        {Object.entries(keybinds).map(([id, keybind]) => (
          <KeybindRow key={id} id={id} keybind={keybind} />
        ))}
      </div>
    </div>
  );
}
