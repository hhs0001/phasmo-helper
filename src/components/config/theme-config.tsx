import { useAppConfig } from "@/hooks/use-config";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AppConfig } from "@/stores/config-store";
import { useTheme } from "../theme-provider";

type ThemeOption = {
  value: AppConfig["application"]["theme"];
  label: string;
};

type ModalOption = {
  value: AppConfig["application"]["showInfo"];
  label: string;
};

const themeOptions: ThemeOption[] = [
  { value: "light", label: "Claro" },
  { value: "dark", label: "Escuro" },
  { value: "system", label: "Sistema" },
];

const modalOptions: ModalOption[] = [
  { value: "modal", label: "Modal" },
  { value: "panel", label: "Painel Lateral" },
];

export function AppConfigPage() {
  const { application, isLoading, setTheme, setShowInfo } = useAppConfig();
  const { setTheme: setUiTheme } = useTheme();

  if (isLoading) {
    return <div className="py-4">Carregando configurações...</div>;
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-medium">Configuração da aplicação</h2>
        <p className="text-sm text-muted-foreground">
          Escolhas as configurações gerais da aplicação.
        </p>
      </div>

      <div className="space-y-4 rounded-md border p-4">
        <div className="space-y-2">
          <Label htmlFor="app-theme">Tema</Label>
          <Select
            value={application.theme}
            onValueChange={(value) => {
              setTheme(value as AppConfig["application"]["theme"]);
              setUiTheme(value as AppConfig["application"]["theme"]);
            }}
          >
            <SelectTrigger id="app-theme" className="w-full">
              <SelectValue placeholder="Selecione o tema" />
            </SelectTrigger>
            <SelectContent>
              {themeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4 rounded-md border p-4">
        <div className="space-y-2">
          <Label htmlFor="app-modal">PopUp Ghost Info</Label>
          <Select
            value={application.showInfo}
            onValueChange={(value) => {
              setShowInfo(value as AppConfig["application"]["showInfo"]);
            }}
          >
            <SelectTrigger id="app-modal" className="w-full">
              <SelectValue placeholder="Escolha como as informações adicionais dos fanasmas são mostradas" />
            </SelectTrigger>
            <SelectContent>
              {modalOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
