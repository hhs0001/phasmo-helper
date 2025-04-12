import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getVersion } from "@tauri-apps/api/app";
import { useState, useEffect } from "react";

export default function AboutPage() {
  const [appVersion, setAppVersion] = useState("0.0.0");
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    getVersion().then((version) => {
      setAppVersion(version);
    });
  }, []);

  return (
    <div className="container mx-auto px-4 py-6 space-y-8">
      <div className="flex flex-col items-center text-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Phasmo Helper</h1>
        <p className="text-muted-foreground mt-2">
          Seu guia essencial para Phasmophobia
        </p>

        <Badge variant="outline" className="mt-2">
          Versão {appVersion}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Sobre o Aplicativo</CardTitle>
            <CardDescription>
              Uma ferramenta essencial para caçadores de fantasmas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              O Phasmo Helper foi desenvolvido para auxiliar jogadores de
              Phasmophobia a terem uma experiência mais completa e eficiente
              durante as investigações paranormais. Com ferramentas intuitivas e
              informações detalhadas, ajudamos você a identificar fantasmas,
              planejar estratégias e sobreviver ao sobrenatural.
            </p>
            <p className="text-sm text-muted-foreground">
              Este aplicativo de código aberto foi criado com Tauri, React e
              TypeScript, proporcionando uma experiência rápida e nativa para
              Windows.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Principais Recursos</CardTitle>
            <CardDescription>
              Tudo o que você precisa para suas investigações
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[160px] pr-4">
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <span className="mr-2">🔍</span>
                  <span>Guia completo de fantasmas e suas evidências</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">⏱️</span>
                  <span>Temporizadores para eventos importantes do jogo</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">📊</span>
                  <span>Rastreamento de evidências e probabilidades</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">⌨️</span>
                  <span>Atalhos de teclado personalizáveis</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">🎨</span>
                  <span>Temas personalizáveis para interface</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">📱</span>
                  <span>Modo sobreposição para jogar em tela cheia</span>
                </li>
              </ul>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Como Usar</CardTitle>
          <CardDescription>
            Maximize sua experiência com o Phasmo Helper
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Para Iniciantes</h3>
              <p className="text-sm text-muted-foreground">
                Explore a página de Fantasmas para conhecer as características
                de cada entidade. Use os temporizadores para acompanhar períodos
                de caça e eventos do jogo. Configure as teclas de atalho para
                acessar funções rapidamente durante suas investigações.
              </p>
            </div>
            <div>
              <h3 className="font-medium mb-2">Para Jogadores Avançados</h3>
              <p className="text-sm text-muted-foreground">
                Utilize o modo sobreposição para manter o aplicativo visível
                enquanto joga. Personalize o tema da interface para melhor
                visibilidade em diferentes condições de iluminação. Acompanhe
                estatísticas detalhadas para identificar fantasmas com base em
                comportamentos específicos.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col md:flex-row gap-6">
        <Card className="flex-1">
          <CardHeader>
            <CardTitle>Desenvolvimento</CardTitle>
            <CardDescription>Contribua para o projeto</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              O Phasmo Helper é um projeto de código aberto e aceita
              contribuições da comunidade. Se você encontrar bugs, tiver
              sugestões ou quiser adicionar novos recursos, fique à vontade para
              contribuir no nosso repositório GitHub.
            </p>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button variant="outline">GitHub</Button>
          </CardFooter>
        </Card>

        <Card className="flex-1">
          <CardHeader>
            <CardTitle>Entre em Contato</CardTitle>
            <CardDescription>
              Tire suas dúvidas ou compartilhe feedback
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Temos uma comunidade ativa de jogadores de Phasmophobia. Junte-se
              a nós para compartilhar dicas, estratégias e experiências. Seu
              feedback é importante para continuarmos melhorando o aplicativo.
            </p>
          </CardContent>
          <CardFooter className="flex justify-end space-x-2">
            <Button variant="outline">Discord</Button>
            <Button variant="outline">Email</Button>
          </CardFooter>
        </Card>
      </div>

      <Separator className="my-4" />

      <footer className="text-center text-sm text-muted-foreground">
        <p>Phasmo Helper © {currentYear}</p>
        <p className="mt-1">
          Desenvolvido com 👻 para a comunidade de Phasmophobia
        </p>
        <p className="mt-2 text-xs">
          Este aplicativo não é afiliado oficialmente ao Phasmophobia ou Kinetic
          Games
        </p>
      </footer>
    </div>
  );
}
