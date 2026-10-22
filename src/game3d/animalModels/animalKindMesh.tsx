import { type AnimalKind } from './types'
import { Enguarde } from './enguarde'
import { Expresso } from './expresso'
import { Rambi } from './rambi'
import { Winky } from './winky'
export function AnimalKindMesh({ kind }: { kind: AnimalKind }) {
  if (kind === 'rambi') {
    return <Rambi />
  }
  if (kind === 'enguarde') {
    return <Enguarde />
  }
  if (kind === 'winky') {
    return <Winky />
  }
  return <Expresso />
}
