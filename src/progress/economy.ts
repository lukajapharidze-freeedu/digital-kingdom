/**
 * ეკონომიკის ყველა რიცხვი ერთ ადგილას.
 * ხვალინდელი გაკვეთილის შემდეგ მხოლოდ აქ შეცვალე, რაც ძალიან მარტივი ან რთული აღმოჩნდება.
 */
export const ECONOMY = {
  /** რამდენი მონეტა იცვლება 1 წიგნში (მაღაზიაში) */
  COINS_PER_BOOK: 2,
  /** რამდენი წიგნი ღირს ერთი ფასიანი თამაშის გახსნა */
  BOOKS_PER_GAME: 2,
  /** რამდენ მონეტას იღებს ბავშვი Typing Grandmaster-ის ყოველ დასრულებულ ეტაპზე */
  TYPING_COINS_PER_STAGE: 1,
  /** რამდენ წიგნს იღებს აკადემიაში ერთ სწორ პასუხზე (ყოველ კითხვაზე მხოლოდ ერთხელ) */
  BOOKS_PER_CORRECT_ANSWER: 1,
}

export interface GameInfo {
  id: string
  name: string
  icon: string
  /** უფასოა თუ წიგნებით იხსნება */
  free: boolean
  /** თამაში უკვე დაწერილია და ირთვება */
  available: boolean
}

/** სამჭედლოს მენიუს თამაშები, ამავე მიმდევრობით */
export const GAMES: GameInfo[] = [
  { id: 'cpu-dash', name: 'CPU Dash', icon: '💻', free: false, available: true },
  { id: 'ping-pong-dong', name: 'Ping-Pong-Dong', icon: '🏓', free: false, available: false },
  { id: 'cliff-climber', name: 'Cliff Climber', icon: '🧗', free: false, available: false },
  { id: 'flappy-floppy', name: 'Flappy Floppy', icon: '💾', free: false, available: true },
  { id: 'jump-up-tower', name: 'Jump Up Tower', icon: '🗼', free: false, available: false },
  { id: 'typing-grandmaster', name: 'Typing Grandmaster', icon: '⌨️', free: true, available: true },
]