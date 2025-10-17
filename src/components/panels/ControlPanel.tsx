import { useQuery } from '@tanstack/react-query';
import { InfoIcon, Scissors, RotateCcw, Download } from 'lucide-react';
import { useEffect, useCallback } from 'react';
import type { Species } from '@shared/schema';

// fix: Replaced alias paths with relative paths.
import { useSimulationStore } from '../../store/simulationStore';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Slider } from '../ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Separator } from '../ui/separator';
import { Badge } from '../ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { exportToPDF } from '../../lib/pdfExport';
import speciesData from '../../data/species.json';

export function ControlPanel() {
  const {
    selectedSpecies,
    setSelectedSpecies,
    iterations,
    angle,
    stepSize,
    thickness,
    setIterations,
    setAngle,
    setStepSize,
    setThickness,
    prunedBranches,
    clearPrunedBranches,
    resetSimulation,
  } = useSimulationStore();

  const { data: speciesList, isLoading } = useQuery<Species[]>({
    queryKey: ['species'],
    queryFn: async () => {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 300));
      return speciesData as Species[];
    },
  });

  const handleSpeciesChange = useCallback((speciesId: string) => {
    const species = speciesList?.find((s) => s.id === speciesId);
    if (species) {
      setSelectedSpecies(species);
      // Set default parameters from species
      setAngle(species.defaultAngle);
      setStepSize(species.defaultStep);
      clearPrunedBranches();
    }
  }, [speciesList, setSelectedSpecies, setAngle, setStepSize, clearPrunedBranches]);

  useEffect(() => {
    // Automatically select the first species when the list loads to prevent an empty scene
    if (speciesList && !selectedSpecies) {
      const defaultSpecies = speciesList[0];
      if (defaultSpecies) {
        handleSpeciesChange(defaultSpecies.id);
      }
    }
  }, [speciesList, selectedSpecies, handleSpeciesChange]);


  const handleExportPDF = async () => {
    await exportToPDF();
  };
  
  return (
    <div className="h-full overflow-y-auto bg-card border-l border-card-border" data-testid="panel-control">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-foreground mb-2">
            Trädbeskärningssimulator
          </h1>
          <p className="text-sm text-muted-foreground">
            Välj trädart, justera parametrar och klicka på grenar för att beskära
          </p>
        </div>

        <Separator />

        {/* Species Selection */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              Trädart
              <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <InfoIcon className="h-4 w-4 text-muted-foreground" data-testid="icon-species-info" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-sm">
                    Varje trädart har unika tillväxtmönster baserade på L-system algoritmer.
                    Välj en art för att se dess naturliga greningsstruktur.
                  </p>
                </TooltipContent>
              </Tooltip>
              </TooltipProvider>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              value={selectedSpecies?.id}
              onValueChange={handleSpeciesChange}
              disabled={isLoading}
            >
              <SelectTrigger data-testid="select-species" className="w-full">
                <SelectValue placeholder={isLoading ? 'Laddar...' : 'Välj trädart'} />
              </SelectTrigger>
              <SelectContent>
                {speciesList?.map((species) => (
                  <SelectItem key={species.id} value={species.id} data-testid={`option-species-${species.id}`}>
                    {species.commonName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedSpecies && (
              <p className="text-xs text-muted-foreground mt-2 font-mono">
                {selectedSpecies.scientificName}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Simulation Parameters */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Simuleringsparametrar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Iterations */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="iterations" className="flex items-center gap-2">
                  Iterationer
                  <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <InfoIcon className="h-3.5 w-3.5 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-sm">
                        Antal generationer trädet växer. Högre värde ger fler grenar och mer komplex struktur.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                  </TooltipProvider>
                </Label>
                <Badge variant="secondary" className="font-mono" data-testid="value-iterations">
                  {iterations}
                </Badge>
              </div>
              <Slider
                id="iterations"
                min={1}
                max={7}
                step={1}
                value={[iterations]}
                onValueChange={([value]) => setIterations(value)}
                data-testid="slider-iterations"
              />
            </div>

            {/* Angle */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="angle" className="flex items-center gap-2">
                  Grenvinkel
                  <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <InfoIcon className="h-3.5 w-3.5 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-sm">
                        Vinkel i grader för grenförgreningar. Påverkar trädets form och utbredning.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                  </TooltipProvider>
                </Label>
                <Badge variant="secondary" className="font-mono" data-testid="value-angle">
                  {angle.toFixed(1)}°
                </Badge>
              </div>
              <Slider
                id="angle"
                min={10}
                max={45}
                step={0.5}
                value={[angle]}
                onValueChange={([value]) => setAngle(value)}
                data-testid="slider-angle"
              />
            </div>

            {/* Step Size */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="stepSize" className="flex items-center gap-2">
                  Stegstorlek
                  <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <InfoIcon className="h-3.5 w-3.5 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-sm">
                        Längd på varje grensegment. Högre värde ger längre grenar och större träd.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                  </TooltipProvider>
                </Label>
                <Badge variant="secondary" className="font-mono" data-testid="value-stepsize">
                  {stepSize.toFixed(1)}
                </Badge>
              </div>
              <Slider
                id="stepSize"
                min={0.5}
                max={2}
                step={0.1}
                value={[stepSize]}
                onValueChange={([value]) => setStepSize(value)}
                data-testid="slider-stepsize"
              />
            </div>

            {/* Thickness */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="thickness" className="flex items-center gap-2">
                  Tjocklek
                  <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <InfoIcon className="h-3.5 w-3.5 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-sm">
                        Visuell tjocklek på grenarna. Påverkar inte simuleringen.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                  </TooltipProvider>
                </Label>
                <Badge variant="secondary" className="font-mono" data-testid="value-thickness">
                  {thickness.toFixed(1)}
                </Badge>
              </div>
              <Slider
                id="thickness"
                min={0.5}
                max={2.5}
                step={0.1}
                value={[thickness]}
                onValueChange={([value]) => setThickness(value)}
                data-testid="slider-thickness"
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Åtgärder</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={clearPrunedBranches}
              disabled={prunedBranches.size === 0}
              data-testid="button-clear-pruning"
            >
              <Scissors className="mr-2 h-4 w-4" />
              Rensa
            </Button>
            <Button
              variant="outline"
              onClick={resetSimulation}
              data-testid="button-reset-simulation"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Återställ
            </Button>
            <Button
              className="col-span-2"
              onClick={handleExportPDF}
              data-testid="button-export-pdf"
            >
              <Download className="mr-2 h-4 w-4" />
              Exportera PDF
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}