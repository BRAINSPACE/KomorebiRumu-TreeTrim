import { create } from 'zustand';
// fix: Use relative path for schema import
import { Species } from '../shared/schema';

interface SimulationState {
  selectedSpecies: Species | null;
  iterations: number;
  angle: number;
  stepSize: number;
  thickness: number;
  prunedBranches: Set<string>;
  isExporting: boolean;
  setSelectedSpecies: (species: Species | null) => void;
  setIterations: (iterations: number) => void;
  setAngle: (angle: number) => void;
  setStepSize: (stepSize: number) => void;
  setThickness: (thickness: number) => void;
  addPrunedBranch: (branchId: string) => void;
  clearPrunedBranches: () => void;
  resetSimulation: () => void;
  setIsExporting: (isExporting: boolean) => void;
}

const defaultState = {
  iterations: 4,
  angle: 22.5,
  stepSize: 1,
  thickness: 1,
};

export const useSimulationStore = create<SimulationState>((set, get) => ({
  selectedSpecies: null,
  ...defaultState,
  prunedBranches: new Set(),
  isExporting: false,
  setSelectedSpecies: (species) => set({ selectedSpecies: species }),
  setIterations: (iterations) => set({ iterations }),
  setAngle: (angle) => set({ angle }),
  setStepSize: (stepSize) => set({ stepSize }),
  setThickness: (thickness) => set({ thickness }),
  addPrunedBranch: (branchId) =>
    set((state) => ({
      prunedBranches: new Set(state.prunedBranches).add(branchId),
    })),
  clearPrunedBranches: () => set({ prunedBranches: new Set() }),
  resetSimulation: () => {
    const species = get().selectedSpecies;
    set({
      ...defaultState,
      angle: species?.defaultAngle ?? defaultState.angle,
      stepSize: species?.defaultStep ?? defaultState.stepSize,
      prunedBranches: new Set(),
    });
  },
  setIsExporting: (isExporting) => set({ isExporting }),
}));