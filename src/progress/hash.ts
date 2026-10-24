/**
 * თემის კოდის "რბილი" დაცვა: კოდს თამაშის ფაილში პირდაპირ არ ვინახავთ, მხოლოდ მის ჰეშს.
 * ეს საკლასო გარემოსთვის საკმარისია; არ არის კრიპტოგრაფიული დაცვა.
 *
 * ახალი კოდის ჰეშის მისაღებად გაუშვი:   node scripts/hash-code.mjs შენიკოდი
 */
function cyrb53(str: string): number {
  let h1 = 0xdeadbeef
  let h2 = 0x41c6ce57
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 2654435761)
    h2 = Math.imul(h2 ^ ch, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  return 4294967296 * (2097151 & h2) + (h1 >>> 0)
}

export function hashTopicCode(code: string): string {
  return cyrb53(`kingdom:${code.trim().toUpperCase()}`).toString(36)
}

/** პაროლის ჰეში — დიდ და პატარა ასოებს არჩევს */
export function hashSecret(secret: string): string {
  return cyrb53(`teacher:${secret}`).toString(36)
}

/**
 * მასწავლებლის კოდების დაშიფვრა/გაშიფვრა პაროლით (XOR). ერთი და იგივე ფუნქცია ორივე მიმართულებით მუშაობს:
 * კოდი → hex და hex → კოდი. ასე კოდები თამაშის ფაილში ღიად არ ჩანს, მხოლოდ პაროლის შეყვანის შემდეგ.
 */
export function xorWithSecret(secret: string, salt: string, input: string, decode: boolean): string {
  const key = (i: number) => cyrb53(`${secret}#${salt}#${i}`) & 0xff
  if (decode) {
    let out = ''
    for (let i = 0; i < input.length / 2; i++) {
      out += String.fromCharCode(parseInt(input.slice(i * 2, i * 2 + 2), 16) ^ key(i))
    }
    return out
  }
  return [...input].map((ch, i) => (ch.charCodeAt(0) ^ key(i)).toString(16).padStart(2, '0')).join('')
}
