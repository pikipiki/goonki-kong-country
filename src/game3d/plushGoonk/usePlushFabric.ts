import { themeColors } from "@game3d/theme";
import { useEffect, useMemo } from "react";
import { MeshPhysicalMaterial } from "three";
import { sharedVelourTexture } from "@game3d/plushGoonk/velour";

const plush = themeColors.plush;

export function usePlushFabric(pink: boolean) {
  const fabric = useMemo(() => {
    const map = sharedVelourTexture();
    const material = new MeshPhysicalMaterial({
      color: pink ? plush.fabricPink : plush.fabricPurple,
      map,
      bumpMap: map,
      bumpScale: 0.011,
      roughness: 0.93,
      sheen: 1,
      sheenRoughness: 0.75,
      sheenColor: pink ? plush.sheenPink : plush.sheenPurple,
    });
    return { map, material };
  }, [pink]);
  useEffect(
    () => () => {
      fabric.material.dispose();
    },
    [fabric],
  );
  return fabric.material;
}
