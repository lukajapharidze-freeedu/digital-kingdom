import './style.css'

import {
  showGradeSelect,
} from './ui/GradeSelect'

import {
  Game,
} from './game/Game'

async function main() {
  const selection =
    await showGradeSelect()

  new Game(
    selection.grade
  )
}

main()