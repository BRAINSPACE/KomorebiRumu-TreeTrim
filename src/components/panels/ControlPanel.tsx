
import { useQuery } from '@tanstack/react-query';
import { InfoIcon, Scissors, RotateCcw, Download, Sparkles, AlertCircle } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { GoogleGenAI } from '@google/genai';
import type { Species } from '@shared/schema';

// FIX: Corrected import paths to use defined path aliases for consistent module resolution.
import { useSimulationStore } from '@/store/simulationStore';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { exportToPDF } from '@/lib/pdfExport';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import speciesData from '@/data/species.json';

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

  const [aiAdvice, setAiAdvice] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string>('');

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
  
  const handleGetAdvice = async () => {
    if (!selectedSpecies) return;
    setIsAiLoading(true);
    setAiAdvice('');
    setAiError('');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
      
      const prompt = `You are an expert arborist providing advice for a tree pruning simulator.
The user is working with the following tree:
- Species: ${selectedSpecies.commonName} (${selectedSpecies.scientificName})
- Growth Iterations: ${iterations} (A higher number means a more mature, complex tree)
- Branching Angle: ${angle} degrees
- Step Size (Branch Length Factor): ${stepSize}

Based on these parameters, the tree has a specific structure. The L-system axiom is "${selectedSpecies.axiom}" and the rules are ${JSON.stringify(selectedSpecies.rules)}.

Please provide pruning advice for this tree to ensure healthy growth, strong structure, and good aesthetics. Your advice should be general but applicable to this species and its current growth stage. For example, mention things like removing crossing branches, improving light penetration, and establishing a strong central leader. Format your advice as a list of clear, actionable points. Keep it concise and easy to understand for a student of arboriculture.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      setAiAdvice(response.text);

    } catch (error) {
      console.error("Error getting AI advice:", error);
      setAiError("Kunde inte hämta råd från AI. Kontrollera din anslutning och API-nyckel.");
    } finally {
      setIsAiLoading(false);
    }
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

        {/* AI Pruning Advice */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              AI Beskärningsråd
              <Sparkles className="h-4 w-4 text-primary" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full"
              onClick={handleGetAdvice}
              disabled={isAiLoading || !selectedSpecies}
              data-testid="button-get-advice"
            >
              {isAiLoading ? 'Hämtar råd...' : 'Få råd från Gemini'}
            </Button>
            {aiError && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Fel</AlertTitle>
                <AlertDescription>{aiError}</AlertDescription>
              </Alert>
            )}
            {aiAdvice && !isAiLoading && (
              <div className="mt-4 p-4 bg-muted/50 rounded-lg text-sm prose prose-sm prose-invert max-w-none">
                <div dangerouslySetInnerHTML={{ __html: aiAdvice.replace(/\n/g, '<br />') }} />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
