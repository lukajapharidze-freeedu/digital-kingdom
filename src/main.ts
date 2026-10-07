import './style.css'

import {
  showCharacterSelect,
} from './ui/CharacterSelect'

import {
  Game,
} from './game/Game'

async function main() {
  const selection =
    await showCharacterSelect()

  new Game(selection.gender)
}

main()