import {
  createCharacter,
  type GameCharacter,
} from './Character'

export function createGirl(): GameCharacter {
  return createCharacter('girl')
}