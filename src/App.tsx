import { TooltipProvider } from "@/components/ui/tooltip";
import { UpdaterProvider } from "@/hooks/useUpdater";
import { MainWindow } from "@/pages/MainWindow";

function App() {
  return (
    <TooltipProvider delayDuration={400} skipDelayDuration={200}>
      <UpdaterProvider>
        <MainWindow />
      </UpdaterProvider>
    </TooltipProvider>
  );
}

export default App;
