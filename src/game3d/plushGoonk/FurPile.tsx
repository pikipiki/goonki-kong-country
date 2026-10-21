import { themeColors } from "@game3d/theme";
import { useEffect, useMemo } from "react";
import { BufferGeometry, Float32BufferAttribute } from "three";
import { bodyPoint } from "@game3d/plushGoonk/profile";

const plush = themeColors.plush;

export function FurPile({ pink }: { pink: boolean }) {
  const geometry = useMemo(() => {
    const positions: number[] = [];
    let seed = 37;
    const random = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    for (let strand = 0; strand < 9000; strand++) {
      const alongProfile = 0.04 + random() * 0.91,
        angle = random() * Math.PI * 2;
      const point = bodyPoint(alongProfile, angle, 0.001);
      const end = bodyPoint(
        alongProfile + 0.003 * random(),
        angle + 0.004,
        0.004 + random() * 0.003,
      );
      positions.push(...point.toArray(), ...end.toArray());
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
    return geometry;
  }, []);
  useEffect(
    () => () => {
      geometry.dispose();
    },
    [geometry],
  );
  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial
        color={pink ? plush.furPink : plush.furPurple}
        transparent
        opacity={0.23}
        depthWrite={false}
      />
    </lineSegments>
  );
}
