import * as React from "react";
import { PhasmoHelperLogo } from "@/components/phasmo-logo";

import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useNavigationStore, DEFAULT_PAGE } from "@/stores/navigation-store";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { navigation, pages, setCurrentPage } = useNavigationStore();

  const handleNavItemClick = (url: string) => {
    const pageEntries = Object.entries(pages);
    const foundPage = pageEntries.find(([_, page]) => page.url === url);

    if (foundPage) {
      setCurrentPage(foundPage[0]);
    } else {
      setCurrentPage(DEFAULT_PAGE);
    }
  };

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setCurrentPage("Ghosts");
                }}
              >
                <PhasmoHelperLogo className="!size-5 text-primary" />
                <span className="text-base font-semibold">Phasmo Helper</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain
          items={navigation.navMain}
          onNavItemClick={handleNavItemClick}
        />
        <NavSecondary
          items={navigation.navSecondary}
          className="mt-auto"
          onNavItemClick={handleNavItemClick}
        />
      </SidebarContent>
    </Sidebar>
  );
}
