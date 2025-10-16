import * as THREE from 'three';

export interface BranchSegment {
  id: string;
  parentId: string | null;
  start: [number, number, number];
  end: [number, number, number];
  depth: number;
  children: BranchSegment[];
}

interface TurtleState {
  position: THREE.Vector3;
  heading: THREE.Vector3; // H
  left: THREE.Vector3;    // L
  up: THREE.Vector3;      // U
  depth: number;
}

export function generateLSystem({
  axiom,
  rules,
  iterations,
}: {
  axiom: string;
  rules: Record<string, string>;
  iterations: number;
}): string {
  let currentString = axiom;
  for (let i = 0; i < iterations; i++) {
    currentString = currentString
      .split('')
      .map((char) => rules[char] || char)
      .join('');
  }
  return currentString;
}

export function interpretLSystem(
  lsystemString: string,
  angleDegrees: number,
  stepSize: number
): BranchSegment | null {
  const stack: TurtleState[] = [];
  let current: TurtleState = {
    position: new THREE.Vector3(0, 0, 0),
    heading: new THREE.Vector3(0, 1, 0),
    left: new THREE.Vector3(1, 0, 0),
    up: new THREE.Vector3(0, 0, 1),
    depth: 0,
  };
  
  const root: BranchSegment = { id: 'root', start: [0,0,0], end: [0,0,0], depth: -1, children: [], parentId: null };
  let currentParentBranch: BranchSegment = root;
  const parentBranchStack: BranchSegment[] = [];
  const childCounts: Record<string, number> = {};

  const angleRad = THREE.MathUtils.degToRad(angleDegrees);

  const rotate = (axis: 'U' | 'L' | 'H', angle: number) => {
    const rotationAxis = {
        H: current.heading,
        L: current.left,
        U: current.up,
    }[axis];
    
    const q = new THREE.Quaternion().setFromAxisAngle(rotationAxis, angle);
    if (axis !== 'H') current.heading.applyQuaternion(q);
    if (axis !== 'L') current.left.applyQuaternion(q);
    if (axis !== 'U') current.up.applyQuaternion(q);
  };
  
  for (const char of lsystemString) {
    switch (char) {
      case 'F': {
        const newPosition = current.position.clone().add(current.heading.clone().multiplyScalar(stepSize));
        
        const parentId = currentParentBranch.id;
        const childIndex = childCounts[parentId] || 0;
        childCounts[parentId] = childIndex + 1;
        const newBranchId = `${parentId}-${childIndex}`;

        const newBranch: BranchSegment = {
            id: newBranchId,
            start: current.position.toArray(),
            end: newPosition.toArray(),
            depth: current.depth,
            children: [],
            parentId: parentId,
        };
        currentParentBranch.children.push(newBranch);
        currentParentBranch = newBranch;
        
        current.position.copy(newPosition);
        break;
      }
      case '+': rotate('U', angleRad); break; // Turn Left
      case '-': rotate('U', -angleRad); break; // Turn Right
      case '&': rotate('L', angleRad); break; // Pitch Down
      case '^': rotate('L', -angleRad); break; // Pitch Up
      case '\\': rotate('H', angleRad); break; // Roll Left
      case '/': rotate('H', -angleRad); break; // Roll Right
      case '|': rotate('U', Math.PI); break; // Turn around
      
      case '[':
        stack.push({ 
          position: current.position.clone(), 
          heading: current.heading.clone(),
          left: current.left.clone(),
          up: current.up.clone(),
          depth: current.depth,
        });
        parentBranchStack.push(currentParentBranch);
        current.depth++;
        break;
      case ']':
        const poppedState = stack.pop();
        if (poppedState) {
          current = poppedState;
        }
        const poppedParent = parentBranchStack.pop();
        if(poppedParent) {
            currentParentBranch = poppedParent;
        }
        break;
    }
  }

  return root;
}

export function findBranchSubtree(tree: BranchSegment, branchId: string): Set<string> {
  const subtreeIds = new Set<string>();
  
  function findAndTraverse(branch: BranchSegment | null): boolean {
    if (!branch) return false;

    if (branch.id === branchId) {
      collectIds(branch);
      return true;
    }

    for (const child of branch.children) {
      if (findAndTraverse(child)) {
        return true;
      }
    }
    return false;
  }

  function collectIds(branch: BranchSegment) {
    subtreeIds.add(branch.id);
    for (const child of branch.children) {
      collectIds(child);
    }
  }

  findAndTraverse(tree);
  return subtreeIds;
}
