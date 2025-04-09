import "./App.css";
import "./styles/titlebar.css";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useNavigation } from "@/contexts/navigation-context";
import { HowDoYouGotHere } from "@/components/how-do-you";

function App() {
  const { currentPage, pages } = useNavigation();

  // Encontrar o componente da página atual
  const currentPageKey = currentPage as keyof typeof pages;
  const CurrentPageComponent =
    pages[currentPageKey]?.component || (() => <HowDoYouGotHere />);

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader title={pages[currentPageKey]?.title || "Phasmo Helper"} />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <CurrentPageComponent />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default App;
