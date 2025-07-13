import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface FloatingActionButtonProps {
  onClick: () => void;
}

export default function FloatingActionButton({ onClick }: FloatingActionButtonProps) {
  return (
    <Button
      onClick={onClick}
      className="fixed bottom-24 right-4 w-14 h-14 bg-primary rounded-full shadow-lg hover:bg-primary/90 transition-colors z-40 p-0"
    >
      <Plus className="h-6 w-6 text-white" />
    </Button>
  );
}
