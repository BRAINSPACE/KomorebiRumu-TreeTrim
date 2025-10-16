// Import '@react-three/fiber' to augment the JSX namespace for R3F elements.
import '@react-three/fiber';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import { useMemo, useState, useEffect } from 'react';
// FIX: Corrected import path to use '@/' alias.
import { useSimulationStore } from '@/store/simulationStore';
// FIX: Corrected import path to use '@/' alias.
import { generateLSystem, interpretLSystem, findBranchSubtree, BranchSegment } from '@/lib/lsystem';
// FIX: Corrected import path to use '@/' alias.
import { Tree3D } from '@/components/3d/Tree3D';
// FIX: Corrected import path to use '@/' alias.
import { isWebGLAvailable } from '@/lib/webglDetect';
import { AlertCircle } from 'lucide-react';
// FIX: Corrected import path to use '@/' alias.
import { Card, CardContent } from '@/components/ui/card';

// Helper to find the parent of a branch
function findParent(node: BranchSegment, childId: string): BranchSegment | null {
    for (const child of node.children) {
        if (child.id === childId) {
            return node;
        }
        const found = findParent(child, childId);
        if (found) {
            return found;
        }
    }
    return null;
}

export function SimulationScene() {
  const {
    selectedSpecies,
    iterations,
    angle,
    stepSize,
    thickness,
    prunedBranches,
    addPrunedBranch,
  } = useSimulationStore();

  const [hoveredBranch, setHoveredBranch] = useState<string | null>(null);
  const [hoveredParent, setHoveredParent] = useState<string | null>(null);
  const [justPrunedSubtree, setJustPrunedSubtree] = useState<Set<string>>(new Set());
  const [webglSupported, setWebglSupported] = useState<boolean | null>(null);

  useEffect(() => {
    setWebglSupported(isWebGLAvailable());
  }, []);

  const fullTree = useMemo(() => {
    if (!selectedSpecies) return null;
    
    const lsystemString = generateLSystem({
      axiom: selectedSpecies.axiom,
      rules: selectedSpecies.rules as Record<string, string>,
      iterations,
    });
    
    return interpretLSystem(lsystemString, angle, stepSize);
  }, [selectedSpecies, iterations, angle, stepSize]);
  
  const tree = useMemo(() => {
    if (!fullTree) return null;

    function filterTree(branch: BranchSegment): BranchSegment | null {
      if (prunedBranches.has(branch.id)) {
        return null;
      }
      const filteredChildren = branch.children
        .map(filterTree)
        .filter((c): c is BranchSegment => c !== null);
      
      return { ...branch, children: filteredChildren };
    }

    return filterTree(fullTree);
  }, [fullTree, prunedBranches]);


  const handleBranchClick = (branchId: string) => {
    if (!fullTree) return;
    
    const subtree = findBranchSubtree(fullTree, branchId);
    
    // Temporarily highlight the subtree to show what was pruned
    setJustPrunedSubtree(subtree);
    setTimeout(() => setJustPrunedSubtree(new Set()), 1000); // Highlight for 1 second

    // Add all branches in the subtree to the pruned set
    subtree.forEach((id) => addPrunedBranch(id));
  };

  const handleBranchHover = (branchId: string | null) => {
    setHoveredBranch(branchId);
    if (branchId && fullTree) {
      const parent = findParent(fullTree, branchId);
      setHoveredParent(parent ? parent.id : null);
    } else {
      setHoveredParent(null);
    }
  };

  if (webglSupported === null) {
    return <div className="w-full h-full bg-background" />;
  }

  if (!webglSupported) {
    return (
      <div className="w-full h-full bg-background flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <AlertCircle className="h-12 w-12 text-destructive" data-testid="icon-webgl-error" />
              <div>
                <h3 className="font-semibold text-lg mb-2">
                  WebGL Not Available
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  This 3D visualization requires WebGL support. Please use a modern browser with WebGL enabled.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-background">
      <Canvas
        camera={{ position: [0, 8, 12], fov: 50 }}
        data-testid="canvas-simulation-scene"
        gl={{ preserveDrawingBuffer: true }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={0.8} castShadow />
        <pointLight position={[-10, -10, -5]} intensity={0.3} />
        
        {tree && (
          <Tree3D
            tree={tree}
            thickness={thickness}
            onBranchClick={handleBranchClick}
            hoveredBranch={hoveredBranch || undefined}
            hoveredParent={hoveredParent || undefined}
            onBranchHover={handleBranchHover}
            prunedBranches={prunedBranches}
            justPrunedSubtree={justPrunedSubtree}
          />
        )}
        
        <Grid
          args={[20, 20]}
          cellColor="#2a2a2a"
          sectionColor="#3a3a3a"
          fadeDistance={30}
          fadeStrength={1}
          position={[0, -0.01, 0]}
        />
        
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          maxPolarAngle={Math.PI / 2.1}
          minDistance={3}
          maxDistance={25}
        />
      </Canvas>
    </div>
  );
}