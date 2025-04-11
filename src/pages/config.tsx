import { ConfigForm } from "@/components/config/config-form";
import { useKeybinds } from "@/hooks/use-keybinds";
import { useEffect } from "react";

export default function ConfigPage() {
  const { disableKeybinds } = useKeybinds();

  // Garante que as keybinds sejam desativadas diretamente no backend quando a página de configuração é carregada
  useEffect(() => {
    // Desativa keybinds no backend
    disableKeybinds();

    // Função de limpeza - não precisamos fazer nada aqui
    // O hook useKeybinds já cuidará de reativar quando a página mudar
    return () => {};
  }, [disableKeybinds]);

  return (
    <main className="p-4">
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold">Configuração</h1>
        <p className="text-sm text-muted-foreground">
          Configure as preferências e atalhos do aplicativo.
        </p>
        <p className="text-sm text-amber-500">
          As teclas de atalho estão desativadas nesta página para facilitar a
          configuração.
        </p>
        <ConfigForm />
      </div>
    </main>
  );
}
