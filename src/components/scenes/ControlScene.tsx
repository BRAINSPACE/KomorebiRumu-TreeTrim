// Import '@react-three/fiber' to augment the JSX namespace for R3F elements.
import '@react-three/fiber';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import { useMemo, useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';

// FIX: Corrected import paths to use defined path aliases for consistent module resolution.
import { useSimulationStore } from '@/store/simulationStore';
import { generateLSystem, interpretLSystem } from '@/lib/lsystem';
import { Tree3D } from '@/components/3d/Tree3D';
import { isWebGLAvailable } from '@/lib/webglDetect';
import { Card, CardContent } from '@/components/ui/card';

export function ControlScene() {
  const {
    selectedSpecies,
    iterations,
    angle,
    stepSize,
    thickness,
  } = useSimulationStore();

  const [webglSupported, setWebglSupported] = useState<boolean | null>(null);

  useEffect(() => {
    setWebglSupported(isWebGLAvailable());
  }, []);

  const tree = useMemo(() => {
    if (!selectedSpecies) return null;
    
    const lsystemString = generateLSystem({
      axiom: selectedSpecies.axiom,
      rules: selectedSpecies.rules as Record<string, string>,
      iterations,
    });
    
    // Always render the full, unpruned tree
    return interpretLSystem(lsystemString, angle, stepSize);
  }, [selectedSpecies, iterations, angle, stepSize]);

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
        data-testid="canvas-control-scene"
        gl={{ preserveDrawingBuffer: true }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={0.8} />
        <pointLight position={[-10, -10, -5]} intensity={0.3} />
        
        {tree && <Tree3D tree={tree} thickness={thickness} />}
        
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
