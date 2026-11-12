import type { Exercise, SimTask } from '../../content/topics'
import { el, rich, type ExerciseCtx, type Tone } from './dom'
import {
  blankExercise,
  matchExercise,
  orderExercise,
  pickExercise,
  revealExercise,
  sortExercise,
  yesnoExercise,
} from './generic'
import { desktopSim, terminalSim } from './desktop'
import { networkSim, packetsSim, routesSim } from './network'
import { mailSim } from './mail'
import { abacusSim } from './misc'
import { robotSim } from './robot'
import { binarySim, circuitSim, gatesSim, passwordSim, pixelsSim, searchSim } from './small'
import { filesSim } from './files'
import { wordSim } from './word'

type Sim = (host: HTMLElement, tasks: SimTask[], config: never, ctx: ExerciseCtx) => void

/** სიმულატორები სახელით: Exercise { kind: 'sim', sim: '<სახელი>' } */
const SIMS: Record<string, Sim> = {
  desktop: desktopSim,
  terminal: terminalSim,
  network: networkSim,
  routes: routesSim,
  packets: packetsSim,
  mail: mailSim,
  abacus: abacusSim,
  robot: robotSim,
  password: passwordSim,
  binary: binarySim,
  pixels: pixelsSim,
  gates: gatesSim,
  circuit: circuitSim,
  search: searchSim,
  files: filesSim,
  word: wordSim,
}

/**
 * სავარჯიშოს ჩასმა გვერდში. onDone ერთხელ გამოიძახება, როცა მოსწავლე სავარჯიშოს დაასრულებს.
 */
export function mountExercise(host: HTMLElement, exercise: Exercise, onDone: () => void) {
  const box = el('div', 'ex')
  const area = el('div')
  const say = el('div', 'ex-say')
  box.append(area, say)
  host.appendChild(box)

  let finished = false
  const ctx: ExerciseCtx = {
    say(text: string, tone: Tone = 'info') {
      if (!text) return
      say.className = `ex-say${tone === 'info' ? '' : ` ${tone}`}`
      rich(say, text)
    },
    done() {
      if (finished) return
      finished = true
      onDone()
    },
  }

  switch (exercise.kind) {
    case 'match':
      return matchExercise(area, exercise, ctx)
    case 'order':
      return orderExercise(area, exercise, ctx)
    case 'sort':
      return sortExercise(area, exercise, ctx)
    case 'pick':
      return pickExercise(area, exercise, ctx)
    case 'blank':
      return blankExercise(area, exercise, ctx)
    case 'reveal':
      return revealExercise(area, exercise, ctx)
    case 'yesno':
      return yesnoExercise(area, exercise, ctx)
    case 'sim': {
      const sim = SIMS[exercise.sim]
      if (!sim) {
        ctx.say(`სიმულატორი „${exercise.sim}“ ვერ მოიძებნა.`, 'warn')
        ctx.done()
        return
      }
      ctx.say('👉 შეასრულე დავალებები რიგით — მიმდინარე დავალება ყვითლადაა მონიშნული.')
      sim(area, exercise.tasks ?? [], (exercise.config ?? {}) as never, ctx)
    }
  }
}
