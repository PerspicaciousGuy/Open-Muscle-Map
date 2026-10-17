import React, { useId, useMemo, useState } from 'react';
import Svg, { Defs, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import maleJson from './male-map-data.json';
import femaleJson from './female-map-data.json';
import type { MusclePress, MuscleRegion, Sex, View } from './muscle-map';

type Shape = { id: string; view: 'front' | 'rear'; transform: string;
  paths: { d: string; transform?: string; fill: string }[]; region?: MuscleRegion };
type MapData = { viewBox: string; background: string; viewBoxes: Record<View, string>;
  gradients: {id: string; x1: string; y1: string; x2: string; y2: string;
    stops: {offset: string; color: string}[]}[]; shapes: Shape[] };
export type MuscleMapProps = {
  sex?: Sex; view?: View; width?: number;
  multiple?: boolean; bilateral?: boolean;
  /** Controlled keys, e.g. ['right:lateral_deltoid']; use both: with bilateral=true. */
  selectedKeys?: string[]; onChange?: (keys: string[]) => void;
  onMusclePress?: (region: MusclePress) => void;
  activeColor?: string;
  /** Background fill; the artwork is transparent by default. */
  backgroundColor?: string;
  /** Fill colour per muscleId (any RN colour string); selection still wins. Compute shades with your own ramp. */
  colors?: Record<string, string>;
};
/** Native paths with onPress; this component does not use SvgXml or a WebView. */
export default function MuscleMap({sex = 'male', view = 'both', width = 360,
  multiple = false, bilateral = false, selectedKeys, onChange, onMusclePress,
  activeColor = '#FF6B35', backgroundColor, colors}: MuscleMapProps) {
  const data = (sex === 'male' ? maleJson : femaleJson) as unknown as MapData;
  const [internal, setInternal] = useState<string[]>([]);
  const instance = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const keyFor = (region: MuscleRegion) => bilateral ? `both:${region.muscleId}` : region.selectionKey;
  const selected = new Set(selectedKeys ?? internal);
  const allowed = useMemo(() => new Set(data.shapes.filter(s => s.region?.selectable)
    .map(s => bilateral ? `both:${s.region!.muscleId}` : s.region!.selectionKey)), [data, bilateral]);
  const prefixFill = (fill: string) => fill.replace(/url\(#([^)]*)\)/g, (_, id) => `url(#${instance}-${id})`);
  const press = (region: MuscleRegion) => {
    const key = keyFor(region); const wasSelected = selected.has(key);
    const next = new Set(multiple ? Array.from(selected).filter(k => allowed.has(k)) : []);
    if (wasSelected) next.delete(key); else next.add(key);
    const keys = Array.from(next);
    if (selectedKeys === undefined) setInternal(keys);
    onMusclePress?.({...region, selectionKey: key, selected: !wasSelected});
    onChange?.(keys);
  };
  return (
    <Svg width={width} height={view === 'both' ? width : width * 2}
      viewBox={data.viewBoxes[view]} accessibilityLabel={`${sex} muscle map, ${view} view`}>
      <Defs>{data.gradients.map(g => <LinearGradient key={g.id} id={`${instance}-${g.id}`}
        x1={g.x1} y1={g.y1} x2={g.x2} y2={g.y2}>
        {g.stops.map((s, i) => <Stop key={i} offset={s.offset} stopColor={s.color}/>)}
      </LinearGradient>)}</Defs>
      <Rect width={1254} height={1254} fill={backgroundColor ?? data.background} pointerEvents="none"/>
      {data.shapes.filter(s => view === 'both' || s.view === view).map(shape => {
        const region = shape.region; const selectable = !!region?.selectable;
        const active = selectable && selected.has(keyFor(region!));
        return <G key={shape.id} transform={shape.transform}
          onPress={selectable ? () => press(region!) : undefined}
          accessible={selectable} accessibilityRole={selectable ? 'button' : undefined}
          accessibilityLabel={region ? `${region.side} ${region.muscleName}, ${region.view} view` : undefined}
          accessibilityState={selectable ? {selected: active} : undefined}
          pointerEvents={selectable ? 'auto' : 'none'}>
          {shape.paths.map((p, i) => <Path key={i} d={p.d} transform={p.transform}
            fill={active ? activeColor : (region && colors?.[region.muscleId]) || prefixFill(p.fill)}/>)}
        </G>;
      })}
    </Svg>
  );
}
