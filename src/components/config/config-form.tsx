import { Button } from "@/components/ui/button";
import { KeybindConfig } from "@/components/config/keybind-config";
import { OverlayConfig } from "@/components/config/overlay-config";
import { AppConfigPage } from "@/components/config/theme-config";
import { useAppConfig } from "@/hooks/use-config";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { TimerConfig } from "./timer-config";

export function ConfigForm() {
  const { resetConfig } = useAppConfig();

  const handleReset = async () => {
    if (
      confirm(
        "Tem certeza que deseja resetar todas as configurações para o padrão?"
      )
    ) {
      await resetConfig();
      toast.success("Configurações resetadas com sucesso!");
    }
  };

  return (
    <div className="space-y-8">
      <KeybindConfig />

      <Separator />

      <OverlayConfig />

      <Separator />

      <AppConfigPage />

      <TimerConfig />

      <div className="flex justify-end">
        <Button variant="destructive" onClick={handleReset}>
          Resetar Configurações
        </Button>
      </div>
    </div>
  );
}
