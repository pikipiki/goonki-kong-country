import type { BarrelSpec } from './levels';
/** Source-driven bounded motion, including moving cannons activated on entry. */
export function cannonWorldPosition(barrel:BarrelSpec,elapsed:number) {
  const motion=barrel.motion;
  if(!motion)return {x:barrel.x,y:barrel.y};
  const span=motion.maximum-motion.minimum;
  if(span<=0)return {x:barrel.x,y:barrel.y};
  const phase=(((-motion.minimum+elapsed*motion.speed)%(span*2))+span*2)%(span*2);
  const offset=phase<=span?motion.minimum+phase:motion.maximum-(phase-span);
  return {x:barrel.x+(motion.axis==='x'||motion.diagonal?offset:0),
    y:barrel.y+(motion.axis==='y'?offset:motion.diagonal?-offset:0)};
}
