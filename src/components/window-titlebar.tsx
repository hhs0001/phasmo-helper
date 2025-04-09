import { WindowControls } from "@/components/window-controls";
import { cn } from "@/lib/utils";

interface WindowTitlebarProps {
  title: string;
  className?: string;
}

export function WindowTitlebar({ title, className }: WindowTitlebarProps) {
  return (
    <div
      className={cn(
        "flex h-10 items-center justify-between border-b px-4 data-[tauri-drag-region=true]:cursor-grab",
        className
      )}
      data-tauri-drag-region={true}
    >
      <div className="flex items-center gap-2 text-sm font-medium">{title}</div>
      <WindowControls />
    </div>
  );
}
