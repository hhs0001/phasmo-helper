import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { WindowControls } from "@/components/window-controls";

export function SiteHeader({ title }: { title: string }) {
  return (
    <header
      className="flex h-12 shrink-0 items-center border-b transition-[width,height] ease-linear"
      data-tauri-drag-region={true}
    >
      <div
        className="flex w-full items-center px-4 lg:px-6"
        data-tauri-drag-region={true}
      >
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1
          className="text-base font-medium flex-1"
          data-tauri-drag-region={true}
        >
          {title}
        </h1>
        <WindowControls />
      </div>
    </header>
  );
}
