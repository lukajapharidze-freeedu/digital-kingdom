import {
  createCharacter,
  type GameCharacter,
} from './Character'

export function createBoy(): GameCharacter {
  return createCharacter('boy')
}