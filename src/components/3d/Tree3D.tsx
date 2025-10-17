// Add import for @react-three/fiber to augment JSX namespace for R3F elements.
import '@react-three/fiber';
// fix: Import React and use React.hook to ensure proper JSX type resolution for R3F elements.
import * as React from 'react';
import * as THREE from 'three';
// fix: Replaced alias path with a relative path.
import { BranchSegment } from '../../lib/lsystem';

interface Tree3DProps {
  tree: BranchSegment | null;
  thickness: number;
  onBranchClick?: (branchId: string) => void;
  hoveredBranch?: string;
  hoveredParent?: string;
  onBranchHover?: (branchId: string | null) => void;
  prunedBranches?: Set<string>;
  justPrunedSubtree?: Set<string>;
}

export function Tree3D({
  tree,
  thickness,
  onBranchClick,
  hoveredBranch,
  hoveredParent,
  onBranchHover,
  prunedBranches = new Set(),
  justPrunedSubtree = new Set(),
}: Tree3DProps) {
  const branches = React.useMemo(() => {
    if (!tree) return [];
    const result: BranchSegment[] = [];
    
    function traverse(branch: BranchSegment) {
      if (!prunedBranches.has(branch.id)) {
        result.push(branch);
        branch.children.forEach(traverse);
      }
    }
    
    // Start traversal from the children of the root node, not the root itself.
    tree.children.forEach(traverse);
    return result;
  }, [tree, prunedBranches]);

  if (!tree || branches.length === 0) {
    return null;
  }

  return (
    <group>
      {/* Wrap Branch in a group to correctly handle the 'key' prop and resolve a TypeScript error. */}
      {branches.map((branch) => (
        <group key={branch.id}>
          <Branch
            branch={branch}
            thickness={thickness}
            onClick={onBranchClick}
            isHovered={hoveredBranch === branch.id}
            isParentHovered={hoveredParent === branch.id}
            isJustPruned={justPrunedSubtree.has(branch.id)}
            onBranchHover={onBranchHover}
          />
        </group>
      ))}
    </group>
  );
}

interface BranchProps {
  branch: BranchSegment;
  thickness: number;
  onClick?: (branchId: string) => void;
  isHovered: boolean;
  isParentHovered: boolean;
  isJustPruned: boolean;
  onBranchHover?: (branchId: string | null) => void;
}

function Branch({ branch, thickness, onClick, isHovered, isParentHovered, isJustPruned, onBranchHover }: BranchProps) {
  const { geometry, position, rotation } = React.useMemo(() => {
    const start = new THREE.Vector3(...branch.start);
    const end = new THREE.Vector3(...branch.end);
    const direction = end.clone().sub(start);
    const length = direction.length();
    
    // Calculate thickness based on depth (thicker at base)
    const branchThickness = thickness * Math.max(0.3, 1 - branch.depth * 0.15);
    
    const geometry = new THREE.CylinderGeometry(
      branchThickness * 0.05,
      branchThickness * 0.05,
      length,
      6
    );
    
    const position = start.clone().add(direction.clone().multiplyScalar(0.5));
    
    // Calculate rotation to align cylinder with branch direction
    const axis = new THREE.Vector3(0, 1, 0);
    const quaternion = new THREE.Quaternion();
    quaternion.setFromUnitVectors(axis, direction.clone().normalize());
    const euler = new THREE.Euler().setFromQuaternion(quaternion);
    
    return { geometry, position, rotation: euler };
  }, [branch, thickness]);

  // Brown color gradient based on depth
  const color = React.useMemo(() => {
    const hue = 30;
    const saturation = 40;
    const lightness = Math.max(20, 35 - branch.depth * 3);
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  }, [branch.depth]);

  const branchColor = React.useMemo(() => {
    if (isJustPruned) return '#ef4444'; // Red for pruned flash
    if (isHovered) return '#ff9800'; // Orange for direct hover
    if (isParentHovered) return '#f5c98c'; // Lighter orange for parent hover
    return color; // Default branch color
  }, [isJustPruned, isHovered, isParentHovered, color]);


  return (
    <mesh
      geometry={geometry}
      position={position}
      rotation={rotation}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(branch.id);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        onBranchHover?.(branch.id);
        document.body.style.cursor = onClick ? 'pointer' : 'default';
      }}
      onPointerOut={() => {
        onBranchHover?.(null);
        document.body.style.cursor = 'default';
      }}
    >
      <meshStandardMaterial
        color={branchColor}
        roughness={0.7}
        metalness={0.1}
      />
    </mesh>
  );
}