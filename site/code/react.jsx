import { useEffect, useRef } from 'react';
import MuscleMap from './muscle-map/muscle-map.js';
import maleSvg from './muscle-map/male-muscle-map.svg?raw'; // Vite; use your bundler's raw-text import

export default function BodyMap({ onSelect }) {
  const host = useRef(null);

  useEffect(() => {
    host.current.innerHTML = maleSvg;
    const map = MuscleMap.createMuscleMap(host.current.querySelector('svg'), {
      multiple: true,
      onSelect: region => onSelect?.(region)   // region.muscleId, region.side, region.selected
    });
    return () => map.destroy();                // required before the SVG is rebound
  }, []);

  return <div ref={host} />;
}
