import { QueryClientProvider } from "@tanstack/react-query";
// FIX: Corrected import path to use '@/' alias.
import { Toaster } from "@/components/ui/toaster";
// FIX: Corrected import path to use '@/' alias.
import { TooltipProvider } from "@/components/ui/tooltip";
// FIX: Corrected import path to use '@/' alias.
import { ControlPanel } from "@/components/panels/ControlPanel";
// FIX: Corrected import path to use '@/' alias.
import { ControlScene } from "@/components/scenes/ControlScene";
// FIX: Corrected import path to use '@/' alias.
import { SimulationScene } from "@/components/scenes/SimulationScene";
// FIX: Corrected import path to use '@/' alias.
import { LoadingOverlay } from "@/components/ui/LoadingOverlay";
// FIX: Corrected import path to use '@/' alias.
import { useSimulationStore } from "@/store/simulationStore";
// FIX: Corrected import path to use '@/' alias for consistency.
import { queryClient } from "@/lib/queryClient";

function App() {
  const isExporting = useSimulationStore((state) => state.isExporting);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="flex h-screen w-full overflow-hidden bg-background" data-testid="container-main">
          {/* Dual Scene Container */}
          <div className="flex-1 flex flex-col lg:flex-row gap-2 p-2">
            {/* Control Scene */}
            <div
              id="control-scene-container"
              className="flex-1 flex flex-col rounded-lg border border-card-border bg-card overflow-hidden"
              data-testid="container-control-scene"
            >
              <div className="h-10 flex items-center justify-center bg-card border-b border-card-border">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Kontroll (Obeskuren)
                </h2>
              </div>
              <div className="flex-1 min-h-0">
                <ControlScene />
              </div>
            </div>

            {/* Simulation Scene */}
            <div
              id="simulation-scene-container"
              className="flex-1 flex flex-col rounded-lg border border-card-border bg-card overflow-hidden"
              data-testid="container-simulation-scene"
            >
              <div className="h-10 flex items-center justify-center bg-card border-b border-card-border">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Simulering (Beskuren)
                </h2>
              </div>
              <div className="flex-1 min-h-0">
                <SimulationScene />
              </div>
            </div>
          </div>

          {/* Control Panel */}
          <div className="w-full lg:w-96 flex-shrink-0">
            <ControlPanel />
          </div>
        </div>

        {isExporting && <LoadingOverlay text="Genererar PDF..." />}
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;