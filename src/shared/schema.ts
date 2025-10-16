export interface Species {
  id: string;
  commonName: string;
  scientificName: string;
  axiom: string;
  rules: Record<string, string>;
  defaultAngle: number;
  defaultStep: number;
  createdAt?: string;
  updatedAt?: string;
}
