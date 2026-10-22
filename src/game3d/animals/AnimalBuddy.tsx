import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'
import type { Animal } from '../../game/animals'
import type { Game } from '../../game/engine'
import { AnimalModel } from '../AnimalModels'
import { AnimalBuddyCrate } from './AnimalBuddyCrate'

function buddyModelScale(boxed: boolean, kind: Animal['kind']) {
  if (boxed) {
    return 0.42
  }

  if (kind === 'enguarde') {
    return 0.78
  }

  return 1
}

export function AnimalBuddy({ animal, game }: { animal: Animal; game: Game }) {
  const root = useRef<Group>(null)

  const crate = useRef<Group>(null)

  const model = useRef<Group>(null)

  useFrame(() => {
    if (!root.current || !crate.current || !model.current) {
      return
    }

    root.current.visible =
      Math.abs(animal.x - game.player.x) < 22 && animal.y > -7
    root.current.position.set(animal.x, animal.y, 0)
    const boxed = animal.state === 'crate'

    crate.current.visible = boxed
    model.current.scale.setScalar(buddyModelScale(boxed, animal.kind))
    model.current.position.set(0, boxed ? 0.36 : 0, boxed ? 0.62 : 0)
    if (animal.facing < 0) {
      model.current.rotation.y = Math.PI
    } else {
      model.current.rotation.y = 0
    }
  })
  const mountMotion = () => ({
    moving:
      animal.state === 'fleeing' ||
      (animal.state === 'ridden' && Math.abs(game.player.vx) > 0.2),
    attacking: animal.state === 'ridden' && game.player.mountAttack > 0,
    gliding:
      animal.kind === 'expresso' &&
      animal.state === 'ridden' &&
      !game.player.grounded &&
      game.player.vy >= -0.66,
    charging: animal.state === 'ridden' ? game.player.mountCharge : 0,
  })

  return (
    <group ref={root}>
      <group ref={crate}>
        <AnimalBuddyCrate />
      </group>
      <group ref={model}>
        <AnimalModel
          kind={animal.kind}
          moving={
            animal.state === 'fleeing' ||
            (animal.state === 'ridden' && Math.abs(game.player.vx) > 0.2)
          }
          attacking={animal.state === 'ridden' && game.player.mountAttack > 0}
          motion={mountMotion}
        />
      </group>
    </group>
  )
}
