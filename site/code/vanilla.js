<div id="body-map"></div>
<script src="./muscle-map/muscle-map.js"></script>
<script>
(async () => {
  // Serve the files over HTTP; fetch() does not work from file://
  const res = await fetch('./muscle-map/male-muscle-map.svg');
  if (!res.ok) throw new Error('Could not load the muscle map');
  document.querySelector('#body-map').innerHTML = await res.text();

  const map = MuscleMap.createMuscleMap(document.querySelector('#body-map svg'), {
    multiple: true,                 // tap toggles; keep several selected
    bilateral: false,               // true: left and right select together
    onSelect: region => console.log(region.muscleId, region.side, region.view),
    onChange: selected => console.log(selected)
  });

  map.setSelected(['right:lateral_deltoid']);
  // map.setView('front'); map.clear(); map.destroy();
})();
</script>
