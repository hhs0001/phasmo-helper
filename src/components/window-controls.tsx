import { IconMinus, IconSquare, IconX } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { getCurrentWindow } from "@tauri-apps/api/window";

interface WindowControlsProps {
  className?: string;
}

export function WindowControls({ className }: WindowControlsProps) {
  const handleMinimize = async () => {
    try {
      const appWindow = getCurrentWindow();
      await appWindow.minimize();
    } catch (error) {
      console.error("Erro ao minimizar janela:", error);
    }
  };

  const handleMaximize = async () => {
    try {
      const appWindow = getCurrentWindow();
      await appWindow.toggleMaximize();
    } catch (error) {
      console.error("Erro ao maximizar janela:", error);
    }
  };

  const handleClose = async () => {
    try {
      const appWindow = getCurrentWindow();
      await appWindow.close();
    } catch (error) {
      console.error("Erro ao fechar janela:", error);
    }
  };

  return (
    <div className={cn("flex items-center mr-[-0.5rem]", className)}>
      <button
        onClick={handleMinimize}
        className="site-header-button flex h-8 w-8 items-center justify-center text-foreground/60 hover:bg-muted hover:text-foreground transition-colors"
        aria-label="Minimizar"
      >
        <IconMinus size={16} />
      </button>
      <button
        onClick={handleMaximize}
        className="site-header-button flex h-8 w-8 items-center justify-center text-foreground/60 hover:bg-muted hover:text-foreground transition-colors"
        aria-label="Maximizar"
      >
        <IconSquare size={16} />
      </button>
      <button
        onClick={handleClose}
        className="site-header-button flex h-8 w-8 items-center justify-center text-foreground/60 hover:bg-destructive hover:text-destructive-foreground transition-colors"
        aria-label="Fechar"
      >
        <IconX size={16} />
      </button>
    </div>
  );
}
