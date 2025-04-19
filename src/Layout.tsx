import { Toaster } from "@/components/ui/sonner";
import { TimerSoundPlayer } from "@/components/timer-sound-player";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <>
      {children}
      <Toaster position="top-center" />
      <TimerSoundPlayer />
    </>
  );
}
