export type Sex = 'male' | 'female';
export type Side = 'left' | 'right';
export type View = 'both' | 'front' | 'rear';
export type StructureKind = 'muscle' | 'muscle_group' | 'joint' | 'fascia' | 'tendon';
export interface MuscleRegion {
  regionId: string; regionKey: string; muscleId: string; muscleName: string;
  muscleGroup: string; side: Side; view: Exclude<View, 'both'>; sex: Sex;
  subregion: string | null; kind: StructureKind; selectable: boolean;
  mappingPrecision: 'schematic_region'; selectionKey: string;
  center?: [number, number]; bounds?: [number, number, number, number];
}
export interface MuscleSelection {
  selectionKey: string; muscleId: string; muscleName: string; muscleGroup: string;
  side: Side | 'both';
}
export interface MusclePress extends MuscleRegion { selected: boolean; }
export interface MuscleMapOptions {
  multiple?: boolean; bilateral?: boolean; bridge?: boolean; view?: View;
  selectedKeys?: string[];
  onSelect?: (region: MusclePress) => void;
  onChange?: (selected: MuscleSelection[]) => void;
}
export interface MuscleMapController {
  svg: SVGSVGElement;
  getSelected(): MuscleSelection[];
  getSelectedKeys(): string[];
  setSelected(keys: string[]): void;
  /** Colour muscles by muscleId: a number 0..1 is blended low->high, a string is used as a CSS colour. */
  setColors(values: Record<string, number | string>, opts?: { low?: string; high?: string }): void;
  clearColors(): void;
  clear(): void; setView(view: View): void; destroy(): void;
}
export function createMuscleMap(svg: SVGSVGElement, options?: MuscleMapOptions): MuscleMapController;
export function readRegion(element: SVGElement): MuscleRegion;
export function heatColor(t: number, low?: string, high?: string): string;
