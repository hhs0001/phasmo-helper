import { useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import { toast } from "sonner";

export function BackendErrorListener() {
  useEffect(() => {
    // Configurar o listener para erros do backend
    const setupListener = async () => {
      try {
        // Escutar eventos de erro do backend
        const unlistenError = await listen<string>("backend-error", (event) => {
          toast.error("Erro do sistema", {
            description: event.payload,
          });
        });

        // Limpar o listener quando o componente for desmontado
        return () => {
          unlistenError();
        };
      } catch (error) {
        console.error(
          "Falha ao configurar listener de erros do backend:",
          error
        );
        toast.error("Erro de inicialização", {
          description:
            "Não foi possível configurar o sistema de notificações de erros",
        });
      }
    };

    const unlisten = setupListener();

    return () => {
      // Limpar o listener quando o componente for desmontado
      unlisten
        .then((unlistenFn) => {
          if (unlistenFn) unlistenFn();
        })
        .catch(console.error);
    };
  }, []);

  // Este componente não renderiza nada, apenas configura os listeners
  return null;
}
