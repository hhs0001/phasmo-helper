import { useState, useEffect, useRef } from "react";
import { useAppConfig } from "@/hooks/use-config";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { KeybindConfig } from "@/stores/config-store";
import { invoke } from "@tauri-apps/api/core";
import { toast } from "sonner";
import { setConfig } from "@/lib/storeLoader";

type KeybindRowProps = {
  id: string;
  keybind: KeybindConfig;
};

export function KeybindRow({ id, keybind }: KeybindRowProps) {
  const { setKeybind, toggleKeybind } = useAppConfig();
  const [isRecording, setIsRecording] = useState(false);
  const [currentKey, setCurrentKey] = useState(keybind.key);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Rastreie modificadores
  const [modifiers, setModifiers] = useState({
    ctrl: false,
    alt: false,
    shift: false,
    meta: false,
  });

  // Reseta os modificadores quando parar de gravar
  useEffect(() => {
    if (!isRecording) {
      setModifiers({ ctrl: false, alt: false, shift: false, meta: false });
    }
  }, [isRecording]);

  // Função para iniciar a gravação de uma nova tecla
  const startRecording = () => {
    setIsRecording(true);

    // Foco no botão para capturar eventos de teclado
    if (buttonRef.current) {
      buttonRef.current.focus();
    }
  };

  // Função para construir a string da combinação de teclas
  const buildKeyComboString = (
    e: KeyboardEvent | React.KeyboardEvent
  ): string => {
    const parts: string[] = [];

    if (e.ctrlKey) parts.push("Ctrl");
    if (e.altKey) parts.push("Alt");
    if (e.shiftKey) parts.push("Shift");
    if (e.metaKey) parts.push("Meta");

    // Obtém a tecla principal considerando o código da tecla para casos especiais
    let keyName = getKeyNameFromEvent(e);

    parts.push(keyName);
    return parts.join("+");
  };

  // Função para extrair o nome correto da tecla do evento
  const getKeyNameFromEvent = (
    e: KeyboardEvent | React.KeyboardEvent
  ): string => {
    // Para teclas que não são modificadoras nem imprimíveis
    if (e.code.startsWith("F") && /F\d+/.test(e.code)) {
      return e.code; // F1, F2, etc.
    }

    if (e.code === "Space") return "Space";
    if (e.code === "Enter") return "Enter";
    if (e.code === "Tab") return "Tab";
    if (e.code === "Escape") return "Escape";
    if (e.code === "Backspace") return "Backspace";
    if (e.code === "CapsLock") return "CapsLock";
    if (e.code === "Delete") return "Delete";

    // Para teclas numéricas, usa o código em vez do caractere
    if (e.shiftKey && e.key.length === 1 && /[!@#$%^&*()\-_=+]/.test(e.key)) {
      // Mapear símbolos de shift para seus códigos de número/caractere
      const shiftSymbolMap: Record<string, string> = {
        "!": "1",
        "@": "2",
        "#": "3",
        $: "4",
        "%": "5",
        "^": "6",
        "&": "7",
        "*": "8",
        "(": "9",
        ")": "0",
        _: "-",
        "+": "=",
      };

      return shiftSymbolMap[e.key] || e.key;
    }

    // Para letras e outros caracteres, usamos a tecla (em maiúsculo para letras)
    if (e.key.length === 1) {
      return e.key.toUpperCase();
    }

    // Para outras teclas, usamos o código
    return e.code;
  };

  // Atualiza o estado dos modificadores durante a gravação
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isRecording) return;

    e.preventDefault();

    // Atualiza o estado dos modificadores
    if (
      e.key === "Control" ||
      e.key === "Alt" ||
      e.key === "Shift" ||
      e.key === "Meta"
    ) {
      setModifiers({
        ctrl: e.ctrlKey,
        alt: e.altKey,
        shift: e.shiftKey,
        meta: e.metaKey,
      });
      return; // Não finaliza a gravação para teclas modificadoras
    }

    // Para teclas não modificadoras, finaliza a gravação
    const keyCombo = buildKeyComboString(e);

    setCurrentKey(keyCombo);
    setKeybind(id, keyCombo);
    setIsRecording(false);
  };

  // Função para cancelar a gravação quando o botão perde o foco
  const handleBlur = () => {
    if (isRecording) {
      setIsRecording(false);
    }
  };

  // Função para alternar a ativação do keybind
  const handleToggle = (checked: boolean) => {
    toggleKeybind(id, checked);
  };

  // Mostra a visualização das teclas durante a gravação
  const getButtonText = () => {
    if (!isRecording) return currentKey;

    const parts: string[] = [];
    if (modifiers.ctrl) parts.push("Ctrl");
    if (modifiers.alt) parts.push("Alt");
    if (modifiers.shift) parts.push("Shift");
    if (modifiers.meta) parts.push("Meta");

    if (parts.length > 0) {
      return `${parts.join("+")}+...`;
    }

    return "Pressione uma tecla...";
  };

  return (
    <div className="flex items-center justify-between space-x-4 py-2">
      <div className="flex-1">
        <Label htmlFor={`keybind-${id}`}>{keybind.description}</Label>
      </div>

      <div className="flex items-center space-x-2">
        <Button
          ref={buttonRef}
          variant="outline"
          size="sm"
          onClick={startRecording}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          className={
            isRecording
              ? "bg-primary text-primary-foreground min-w-[180px]"
              : "min-w-[180px]"
          }
        >
          {getButtonText()}
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
  const { keybinds, isLoading, config } = useAppConfig();
  const [hasChanges, setHasChanges] = useState(false);

  // Desabilita os keybinds na página de configuração (redundante, mas para garantir)
  useEffect(() => {
    // Chamada direta para backend para desabilitar keybinds
    invoke("disable_keybinds").catch((err) => {
      console.error("Erro ao desabilitar keybinds no componente:", err);
    });
  }, []);

  // Detecta mudanças nos keybinds
  useEffect(() => {
    setHasChanges(true);
  }, [keybinds]);

  // Função para salvar manualmente as keybinds
  const handleSaveKeybinds = async () => {
    try {
      await setConfig("appConfig", config);
      toast.success("Atalhos salvos com sucesso!", {
        description: "As configurações de teclas de atalho foram salvas.",
      });
      setHasChanges(false);
    } catch (error) {
      console.error("Erro ao salvar keybinds:", error);
      toast.error("Erro ao salvar atalhos", {
        description:
          "Não foi possível salvar as configurações de teclas de atalho.",
      });
    }
  };

  if (isLoading) {
    return <div className="py-4">Carregando configurações...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium flex gap-2 items-center">
          Teclas de Atalho
          <div className="flex justify-end">
            <Button
              variant="default"
              onClick={handleSaveKeybinds}
              disabled={!hasChanges}
            >
              Salvar Atalhos
            </Button>
          </div>
        </h2>
        <div className="flex gap-2 items-center">
          <span className="text-sm text-muted-foreground">
            Suporta combinações (ex: Ctrl+F1)
          </span>
          <div className="text-sm text-muted-foreground">Ativo</div>
        </div>
      </div>

      <div className="space-y-2 rounded-md border p-4">
        {Object.entries(keybinds).map(([id, keybind]) => (
          <KeybindRow key={id} id={id} keybind={keybind} />
        ))}
      </div>

      <div className="text-sm text-muted-foreground">
        <p>
          Nota: As teclas de atalho são desativadas na página de configuração.
        </p>
        <p className="mt-2 text-amber-500">
          Atenção: Teclas simples sem modificadores (como letras ou números
          sozinhos) podem interferir na digitação normal.
        </p>
        <p className="mt-2 text-blue-500">
          Importante: Clique em "Salvar Atalhos" após fazer alterações para
          garantir que sejam aplicadas.
        </p>
      </div>
    </div>
  );
}
