"use client";

import {
  IconCirclePlusFilled,
  IconGhost,
  type Icon,
} from "@tabler/icons-react";
import { useGame } from "@/hooks/use-game";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function NavMain({
  items,
  onNavItemClick,
  ...props
}: {
  items: {
    title: string;
    url: string;
    icon?: Icon;
  }[];
  onNavItemClick?: (url: string) => void;
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
  const { isGameActive, startGame } = useGame();

  // Função para iniciar um novo jogo e navegar para a página de fantasmas
  const handleQuickCreateGame = async (e: React.MouseEvent) => {
    e.preventDefault();
    await startGame();
    // Navega para a página de fantasmas usando o callback fornecido pelo componente pai
    onNavItemClick?.("/ghosts");
  };

  // Função para navegar para um jogo existente
  const handleNavigateToGame = (e: React.MouseEvent) => {
    e.preventDefault();
    onNavItemClick?.("/ghosts");
  };

  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <SidebarMenuButton
                    className={`${
                      isGameActive
                        ? "bg-amber-500 text-amber-50 hover:bg-amber-600 hover:text-amber-50"
                        : "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
                    } 
                      active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear`}
                    onClick={
                      isGameActive
                        ? handleNavigateToGame
                        : handleQuickCreateGame
                    }
                  >
                    {isGameActive ? (
                      <IconGhost size={18} />
                    ) : (
                      <IconCirclePlusFilled size={18} />
                    )}
                    <span>{isGameActive ? "Continuar Jogo" : "Novo Jogo"}</span>
                  </SidebarMenuButton>
                </TooltipTrigger>
                <TooltipContent side="right">
                  {isGameActive
                    ? "Continuar investigação em andamento"
                    : "Iniciar nova investigação"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                tooltip={item.title}
                onClick={(e) => {
                  e.preventDefault();
                  onNavItemClick?.(item.url);
                }}
              >
                {item.icon && <item.icon />}
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
