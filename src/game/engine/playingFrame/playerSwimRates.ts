import {
  ROM_SWIM_SINK,
  ROM_SWIM_IDLE_SINK,
  ROM_SWIM_RISE,
  ROM_SWIM_DIVE,
} from '../romPhysics'

export function swimVerticalRates(coralSwim: boolean) {
  if (coralSwim) {
    return {
      sink: ROM_SWIM_SINK,
      rise: ROM_SWIM_RISE,
      dive: ROM_SWIM_DIVE,
      idleSink: ROM_SWIM_IDLE_SINK,
    }
  }

  return { sink: 7, rise: 4.3, dive: 4, idleSink: 1.2 }
}
