import { IconArrowLeft, IconQuestionMark } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { DEFAULT_PAGE, useNavigation } from "@/contexts/navigation-context";

export function HowDoYouGotHere() {
  const { setCurrentPage } = useNavigation();

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-12">
      <div className="flex flex-col items-center gap-4 text-center">
        <IconQuestionMark className="h-16 w-16 text-muted-foreground" />
        <h1 className="text-2xl font-bold">Como você chegou nesta página?</h1>
        <p className="text-sm text-muted-foreground">Esta página não existe.</p>
      </div>
      <Button
        variant="default"
        onClick={() => setCurrentPage(DEFAULT_PAGE)}
        className="flex items-center gap-2"
      >
        <IconArrowLeft size={16} />
        <span>Voltar para Home</span>
      </Button>
    </div>
  );
}
