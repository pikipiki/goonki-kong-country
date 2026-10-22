import {
  BoxGeometry,
  ConeGeometry,
  CylinderGeometry,
  SphereGeometry,
  TorusGeometry,
} from 'three'
export const bossBox = new BoxGeometry(1, 1, 1)
export const bossSphere = new SphereGeometry(1, 16, 12)
export const bossCone = new ConeGeometry(1, 1, 10)
export const bossCylinder = new CylinderGeometry(1, 1, 1, 16)
export const bossRing = new TorusGeometry(1, 0.055, 8, 24)
