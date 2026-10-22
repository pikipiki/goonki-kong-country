import type { Object3D } from 'three'
import {
  finRotationX,
  strideRotationZ,
  tailRotationY,
  wingMotion,
  type AnimalFrameContext,
} from './animalMotionState'
import {
  readAnimalPhase,
  readStrideAmplitude,
  readWingSide,
} from './animalGroupUserData'

function animateStride(node: Object3D, ctx: AnimalFrameContext) {
  const phase = readAnimalPhase(node)

  const amplitude = readStrideAmplitude(node)

  node.rotation.z = strideRotationZ(ctx, phase, amplitude)
}

function animateTail(node: Object3D, ctx: AnimalFrameContext) {
  node.rotation.y = tailRotationY(ctx)
}

function animateFin(node: Object3D, ctx: AnimalFrameContext) {
  const phase = readAnimalPhase(node)

  node.rotation.x = finRotationX(ctx, phase)
}

function animateWing(node: Object3D, ctx: AnimalFrameContext) {
  const side = readWingSide(node)

  const motion = wingMotion(side, ctx.glide, ctx.tick)

  node.rotation.x = motion.rotationX
  node.rotation.z = motion.rotationZ
  node.scale.setScalar(motion.scale)
}

function animateAttack(node: Object3D, ctx: AnimalFrameContext) {
  if (ctx.attack) {
    node.rotation.z = -0.3
  } else {
    node.rotation.z = -ctx.charge * 0.25
  }
}

export function animateAnimalGroups(
  groups: Object3D[],
  ctx: AnimalFrameContext,
) {
  for (const node of groups) {
    if (node.name === 'animal-stride') {
      animateStride(node, ctx)
    } else if (node.name === 'animal-tail') {
      animateTail(node, ctx)
    } else if (node.name === 'animal-fin') {
      animateFin(node, ctx)
    } else if (node.name === 'animal-wing') {
      animateWing(node, ctx)
    } else if (node.name === 'animal-attack') {
      animateAttack(node, ctx)
    }
  }
}
