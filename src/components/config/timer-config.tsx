import { useAppConfig } from "@/hooks/use-config";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AudioPlayer } from "@/components/ui/audio-player";
import { Separator } from "@/components/ui/separator";
import { open } from "@tauri-apps/plugin-dialog";
import { toast } from "sonner";
import { useEffect, useState, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  copyFile,
  exists,
  mkdir,
  readDir,
  readFile,
  remove,
} from "@tauri-apps/plugin-fs";
import { join, appDataDir, basename } from "@tauri-apps/api/path";
import { convertFileSrc } from "@tauri-apps/api/core";

// Tipos de timers disponíveis
const timerTypes = [
  { id: "huntSound", name: "Caçada" },
  { id: "smudgeSound", name: "Incenso" },
  { id: "cooldownSound", name: "Cooldown" },
];

// Componente de fallback para reprodução de áudio
function FallbackAudioPlayer({
  src,
  className,
}: {
  src: string;
  className?: string;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);

  const handlePlay = () => {
    if (audioRef.current) {
      audioRef.current.play().catch((err) => {
        console.error("Erro ao reproduzir áudio:", err);
      });
    }
  };

  return (
    <div className={className}>
      <audio ref={audioRef} src={src} style={{ display: "none" }}></audio>
      <Button
        variant="outline"
        size="sm"
        onClick={handlePlay}
        className="w-full"
      >
        Testar som
      </Button>
    </div>
  );
}

export function TimerConfig() {
  const { config, isLoading, updateTimers } = useAppConfig();
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [soundsDirPath, setSoundsDirPath] = useState<string | null>(null);
  const [audioSources, setAudioSources] = useState<Record<string, string>>({});

  // Inicialização da pasta de sons
  useEffect(() => {
    const initSoundDir = async () => {
      try {
        // Obtém o diretório de dados da aplicação
        const appData = await appDataDir();
        const soundsDir = await join(appData, "custom-sounds");
        setSoundsDirPath(soundsDir);

        console.log("Diretório de sons:", soundsDir);

        try {
          // Verificar se a pasta de sons existe
          const dirExists = await exists(soundsDir);

          // Criar a pasta se não existir
          if (!dirExists) {
            console.log("Criando diretório de sons...");
            await mkdir(soundsDir, { recursive: true });
            console.log("Diretório de sons criado com sucesso!");
          } else {
            console.log("Diretório de sons já existe.");

            // Listar o conteúdo do diretório para verificar se podemos acessá-lo
            try {
              const files = await readDir(soundsDir);
              console.log("Arquivos no diretório:", files);
            } catch (dirError) {
              console.error("Erro ao ler diretório:", dirError);
            }
          }
        } catch (fsError) {
          console.error("Erro de sistema de arquivos:", fsError);
          throw new Error(`Erro ao verificar/criar diretório: ${fsError}`);
        }

        // Inicializar AudioSources a partir dos arquivos configurados
        const sourceMap: Record<string, string> = {};
        for (const timer of timerTypes) {
          const path = config.timers[timer.id as keyof typeof config.timers];
          if (path) {
            try {
              sourceMap[timer.id] = await createDataUrl(path);
            } catch (e) {
              console.error(`Erro ao criar data URL para ${timer.id}:`, e);
            }
          }
        }
        setAudioSources(sourceMap);

        setIsInitializing(false);
      } catch (error) {
        console.error("Erro ao inicializar diretório de sons:", error);
        setError(`Não foi possível inicializar o diretório de sons: ${error}`);
        toast.error("Não foi possível inicializar o diretório de sons");
        setIsInitializing(false);
      }
    };

    initSoundDir();
  }, [config.timers]);

  if (isLoading || isInitializing) {
    return <div className="py-4">Carregando configurações...</div>;
  }

  if (error) {
    return <div className="py-4 text-destructive">Erro: {error}</div>;
  }

  // Função para criar uma data URL a partir de um arquivo
  async function createDataUrl(filePath: string): Promise<string> {
    try {
      // Ler o arquivo como array de bytes no formato Uint8Array
      const fileData = await readFile(filePath);

      // Determinar o tipo MIME com base na extensão
      const extension = filePath.split(".").pop()?.toLowerCase() || "";
      const mimeType = extension === "mp3" ? "audio/mpeg" : "audio/wav";

      // Converter para Base64
      // Precisamos primeiro converter o Uint8Array para uma string de caracteres
      let binary = "";
      const bytes = new Uint8Array(fileData);
      const len = bytes.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
      }

      // Agora convertemos a string binária para base64
      const base64 = window.btoa(binary);

      // Retornar como data URL
      return `data:${mimeType};base64,${base64}`;
    } catch (error) {
      console.error("Erro ao criar data URL:", error);
      throw error;
    }
  }

  // Função para copiar o arquivo selecionado para o diretório do app
  const copyAudioFile = async (sourceFilePath: string, timerType: string) => {
    try {
      if (!soundsDirPath) {
        throw new Error("Diretório de sons não inicializado");
      }

      // Extrair o nome do arquivo original
      const fileName = await basename(sourceFilePath);
      if (!fileName) {
        throw new Error("Nome de arquivo inválido");
      }

      console.log("Arquivo de origem:", sourceFilePath);
      console.log("Nome do arquivo:", fileName);

      // Criar nome de arquivo único baseado no tipo de timer e timestamp
      const timestamp = Date.now();
      const extension = fileName.split(".").pop();
      const destFileName = `${timerType}_${timestamp}.${extension}`;

      // Caminho completo para o arquivo de destino
      const destFilePath = await join(soundsDirPath, destFileName);

      // Log para depuração
      console.log("Copiando arquivo para:", destFilePath);

      // Tentar copiar o arquivo
      try {
        await copyFile(sourceFilePath, destFilePath);
        console.log("Arquivo copiado com sucesso!");

        // Criar data URL para o áudio
        const dataUrl = await createDataUrl(destFilePath);
        setAudioSources((prev) => ({
          ...prev,
          [timerType]: dataUrl,
        }));
      } catch (copyError) {
        console.error("Erro ao copiar arquivo:", copyError);
        throw new Error(`Falha ao copiar arquivo: ${copyError}`);
      }

      // Retornamos o caminho completo para configuração
      return destFilePath;
    } catch (error) {
      console.error("Erro ao processar arquivo:", error);
      throw error;
    }
  };

  // Função para abrir o diálogo de seleção de arquivo
  const handleSelectFile = async (timerId: string) => {
    try {
      // Abrindo diálogo para selecionar apenas arquivos MP3
      const selected = await open({
        multiple: false,
        filters: [
          {
            name: "Arquivos de Áudio",
            extensions: ["mp3", "wav"],
          },
        ],
      });

      // Se nenhum arquivo foi selecionado ou se é uma seleção múltipla (não deveria acontecer)
      if (selected === null || Array.isArray(selected)) {
        return;
      }

      toast.info("Copiando arquivo, aguarde...");

      // Copiar o arquivo para o diretório da aplicação
      const copiedFilePath = await copyAudioFile(selected, timerId);

      // Atualiza a configuração com o caminho do arquivo copiado
      await updateTimers({ [timerId]: copiedFilePath });

      toast.success(
        `Som de ${
          timerTypes.find((t) => t.id === timerId)?.name || timerId
        } configurado`
      );
    } catch (error) {
      console.error("Erro ao selecionar arquivo:", error);
      toast.error(`Erro ao configurar arquivo de som: ${error}`);
    }
  };

  // Função para obter a URL do arquivo para reprodução
  const getFileUrl = (timerId: string, filePath: string | null) => {
    if (!filePath) return "";

    // Se temos uma data URL para este timer, usamos ela
    if (audioSources[timerId]) {
      return audioSources[timerId];
    }

    // Caso contrário, tentamos o método tradicional
    try {
      return convertFileSrc(filePath);
    } catch (e) {
      console.error("Erro ao converter caminho de arquivo:", e);
      return "";
    }
  };

  // Função para remover um arquivo configurado
  const handleRemoveFile = async (timerId: string) => {
    try {
      // Obter o caminho atual do arquivo antes de remover da configuração
      const currentFilePath =
        config.timers[timerId as keyof typeof config.timers];

      // Removemos do estado de audioSources
      setAudioSources((prev) => {
        const newSources = { ...prev };
        delete newSources[timerId];
        return newSources;
      });

      // Atualiza a configuração para null
      await updateTimers({ [timerId]: null });

      // Se temos um arquivo válido, tentamos excluí-lo do disco
      if (currentFilePath && (await exists(currentFilePath))) {
        try {
          // Excluir o arquivo do disco
          await remove(currentFilePath);
          console.log(`Arquivo excluído com sucesso: ${currentFilePath}`);
        } catch (deleteError) {
          console.error(
            `Erro ao excluir arquivo: ${currentFilePath}`,
            deleteError
          );
          // Não propagamos o erro para o usuário, pois a remoção da configuração já ocorreu
        }
      }

      toast.success(
        `Som de ${
          timerTypes.find((t) => t.id === timerId)?.name || timerId
        } removido`
      );
    } catch (error) {
      console.error("Erro ao remover arquivo:", error);
      toast.error("Erro ao remover arquivo de som");
    }
  };

  // Função para obter o nome do arquivo a partir do caminho completo
  const getFileName = (filePath: string | null) => {
    if (!filePath) return "";
    const parts = filePath.split(/[/\\]/);
    return parts[parts.length - 1];
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-medium">Configurações dos sons</h2>
        <p className="text-sm text-muted-foreground">
          Ajuste os sons que serão tocados quando um dos timers expirar
        </p>
        <p className="text-sm text-red-400">
          Você pode selecionar arquivos MP3 ou WAV. Eles serão copiados para o
          diretório de dados da aplicação para garantir que estejam disponíveis,
          mesmo se o arquivo original for movido ou excluído.
        </p>
      </div>

      <div className="space-y-4 rounded-md border p-4">
        {timerTypes.map((timer) => {
          const currentFile =
            config.timers[timer.id as keyof typeof config.timers];
          const fileUrl = getFileUrl(timer.id, currentFile);
          const hasFile = !!currentFile;

          return (
            <div key={timer.id} className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor={timer.id}>{timer.name}</Label>
                {hasFile && (
                  <Badge variant="outline" className="px-2 py-0 text-xs">
                    {getFileName(currentFile)}
                  </Badge>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleSelectFile(timer.id)}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    {hasFile ? "Alterar som" : "Selecionar som"}
                  </Button>

                  {hasFile && (
                    <Button
                      onClick={() => handleRemoveFile(timer.id)}
                      variant="destructive"
                      size="sm"
                    >
                      Remover
                    </Button>
                  )}
                </div>

                {hasFile && (
                  <Card className="overflow-hidden">
                    <CardContent className="p-2">
                      {audioSources[timer.id] ? (
                        <AudioPlayer src={fileUrl} className="w-full" />
                      ) : (
                        <FallbackAudioPlayer src={fileUrl} className="w-full" />
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>

              {timer.id !== timerTypes[timerTypes.length - 1].id && (
                <Separator className="my-2" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
