// npx expo install react-native-svg
// Copy MuscleMap.tsx, muscle-map.d.ts and both *-map-data.json files into one folder.
import React, { useState } from 'react';
import MuscleMap from './muscle-map/MuscleMap';

export default function BodySelector() {
  const [selected, setSelected] = useState<string[]>([]);
  return (
    <MuscleMap
      sex="male"                 // or "female"
      view="both"                // "front" | "rear" | "both"
      width={360}
      multiple
      selectedKeys={selected}    // e.g. ['right:lateral_deltoid']
      onChange={setSelected}
      activeColor="#FF6B35"
      onMusclePress={region => {
        // Filter your exercise catalog by region.muscleId
        console.log(region.muscleId, region.side, region.view);
      }}
    />
  );
}
