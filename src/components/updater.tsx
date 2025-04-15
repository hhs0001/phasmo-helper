import { useEffect, useState, useRef } from "react";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Ícones opcionais para UX
import { ReloadIcon, DownloadIcon, CheckIcon } from "@radix-ui/react-icons";

export default function UpdaterComponent() {
  const [update, setUpdate] = useState<any>(null);
  const [checking, setChecking] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [downloaded, setDownloaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visible, setVisible] = useState(true);
  const contentLength = useRef(0);
  const downloadedBytes = useRef(0);

  useEffect(() => {
    async function checkUpdate() {
      setChecking(true);
      try {
        const upd = await check();
        console.log("Update found:", upd);
        setUpdate(upd);
      } catch (e: any) {
        console.error("Error checking for update:", e);
        setError("Erro ao checar atualização");
      } finally {
        setChecking(false);
      }
    }
    checkUpdate();
  }, []);

  async function retryCheckUpdate() {
    setChecking(true);
    setError(null);
    setUpdate(null);
    try {
      const upd = await check();
      setUpdate(upd);
    } catch (e: any) {
      setError("Erro ao checar atualização");
    } finally {
      setChecking(false);
    }
  }

  async function handleDownload() {
    if (!update) return;
    setDownloading(true);
    setError(null);
    setProgress(0);
    downloadedBytes.current = 0;
    contentLength.current = 0;
    try {
      await update.downloadAndInstall((event: any) => {
        switch (event.event) {
          case "Started":
            contentLength.current = event.data.contentLength;
            setProgress(0);
            break;
          case "Progress":
            downloadedBytes.current += event.data.chunkLength;
            setProgress(
              contentLength.current
                ? downloadedBytes.current / contentLength.current
                : 0
            );
            break;
          case "Finished":
            setProgress(1);
            setDownloaded(true);
            setDownloading(false);
            break;
        }
      });
    } catch (e: any) {
      setError("Erro ao baixar atualização");
      setDownloading(false);
    }
  }

  async function handleRelaunch() {
    await relaunch();
  }

  // Não mostra nada se não há update
  if (!visible || checking || (!update && !error)) return null;
  if (error) {
    return (
      <Card className="animate-fade-in-up bg-destructive/10 border-destructive/40 shadow-lg mx-0 my-2 p-2 w-full max-w-full overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between p-2 pb-0">
          <CardTitle className="text-sm font-semibold truncate">Erro</CardTitle>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={() => setVisible(false)}
          >
            ×
          </Button>
        </CardHeader>
        <CardContent className="p-2 pt-1">
          <p className="text-destructive text-xs mb-2 truncate">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={retryCheckUpdate}
            disabled={checking}
            className="w-full"
          >
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    );
  }
  if (!update) return null;

  return (
    <Card className="animate-fade-in-up border-primary/60 shadow-lg mx-0 my-2 p-2 w-full max-w-full overflow-hidden bg-gradient-to-br from-primary/10 to-card/80 transition-all duration-500">
      <CardHeader className="flex flex-row items-center justify-between p-2 pb-0">
        <CardTitle className="text-sm font-semibold flex items-center gap-1 truncate">
          <ReloadIcon className="animate-spin text-primary h-4 w-4" /> Update
        </CardTitle>
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6"
          onClick={() => setVisible(false)}
        >
          ×
        </Button>
      </CardHeader>
      <CardContent className="p-2 pt-1">
        <div className="text-xs mb-2 line-clamp-2 text-muted-foreground truncate">
          {update.body || "Nova versão disponível."}
        </div>
        {downloading ? (
          <div className="w-full flex flex-col gap-1">
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-2 bg-primary transition-all duration-300"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground text-right">
              {Math.round(progress * 100)}%
            </span>
          </div>
        ) : downloaded ? (
          <div className="flex flex-col items-center gap-1 animate-fade-in">
            <Badge
              variant="secondary"
              className="flex items-center gap-1 text-xs"
            >
              <CheckIcon className="text-green-600 h-3 w-3" /> Baixada
            </Badge>
            <Button
              onClick={handleRelaunch}
              className="w-full mt-1 animate-bounce"
              variant="default"
              size="sm"
            >
              Reiniciar
            </Button>
          </div>
        ) : (
          <Button
            onClick={handleDownload}
            className="w-full animate-pulse"
            variant="default"
            size="sm"
            disabled={downloading}
          >
            <DownloadIcon className="h-4 w-4" /> Atualizar
          </Button>
        )}
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-1 text-[10px] text-muted-foreground p-2 pt-0">
        <span>O app será reiniciado após atualizar.</span>
      </CardFooter>
    </Card>
  );
}
