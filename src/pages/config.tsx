import { ConfigForm } from "@/components/config/config-form";

export default function ConfigPage() {
  return (
    <main className="p-4">
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold">Configuração</h1>
        <p className="text-sm text-muted-foreground">
          Configure as preferências e atalhos do aplicativo.
        </p>
        <ConfigForm />
      </div>
    </main>
  );
}
