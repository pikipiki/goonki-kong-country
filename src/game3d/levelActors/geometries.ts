import {
  BoxGeometry,
  ConeGeometry,
  CylinderGeometry,
  SphereGeometry,
  TorusGeometry,
} from 'three'
export const actorSphere = new SphereGeometry(1, 16, 12)
export const actorBox = new BoxGeometry(1, 1, 1)
export const actorCylinder = new CylinderGeometry(0.45, 0.45, 0.95, 16)
export const actorCannonTube = new CylinderGeometry(
  0.45,
  0.45,
  0.95,
  16,
  1,
  true,
)
export const actorCannonBore = new CylinderGeometry(0.385, 0.385, 0.025, 16)
export const actorCone = new ConeGeometry(1, 1, 12)
export const actorRing = new TorusGeometry(0.455, 0.035, 6, 24)
