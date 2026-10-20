/**
 * მონეტისა და წიგნის ხატულები (SVG): ერთმანეთისგან ადვილად გასარჩევი —
 * მრგვალი ოქროს მონეტა ვარსკვლავით და გადაშლილი წიგნი ლურჯი ყდით, სტრიქონებით და სანიშნით.
 */

let counter = 0

function star(cx: number, cy: number, outer: number, inner: number): string {
  const points: string[] = []
  for (let i = 0; i < 10; i++) {
    const radius = i % 2 === 0 ? outer : inner
    const angle = (i / 10) * Math.PI * 2 - Math.PI / 2
    points.push(`${(cx + Math.cos(angle) * radius).toFixed(2)},${(cy + Math.sin(angle) * radius).toFixed(2)}`)
  }
  return points.join(' ')
}

export function coinIcon(size = 22): string {
  const id = `coin${counter++}`
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="${size}" height="${size}" aria-label="მონეტა" role="img">
    <defs>
      <radialGradient id="${id}" cx="35%" cy="30%" r="80%">
        <stop offset="0" stop-color="#fff7bd"/>
        <stop offset="0.45" stop-color="#ffd23f"/>
        <stop offset="1" stop-color="#e28f00"/>
      </radialGradient>
    </defs>
    <circle cx="16" cy="17.2" r="13.2" fill="#a85f00"/>
    <circle cx="16" cy="15.2" r="13.2" fill="url(#${id})" stroke="#a15a00" stroke-width="1.6"/>
    <circle cx="16" cy="15.2" r="9.4" fill="none" stroke="#fff1a8" stroke-width="1.5" opacity="0.95"/>
    <polygon points="${star(16, 15.4, 5.6, 2.5)}" fill="#fff6c2" stroke="#c07a00" stroke-width="0.9" stroke-linejoin="round"/>
    <path d="M7.4 9.4 A10 10 0 0 1 13.8 5.4" stroke="#ffffff" stroke-width="2" stroke-linecap="round" fill="none" opacity="0.8"/>
  </svg>`
}

export function bookIcon(size = 22): string {
  const id = `book${counter++}`
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="${size}" height="${size}" aria-label="წიგნი" role="img">
    <defs>
      <linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#63a9ff"/>
        <stop offset="1" stop-color="#1d52c4"/>
      </linearGradient>
    </defs>
    <path d="M1.6 9.6 Q8.8 7.6 16 10.2 Q23.2 7.6 30.4 9.6 V27.4 Q23.2 25.4 16 28.2 Q8.8 25.4 1.6 27.4 Z" fill="url(#${id})" stroke="#163c8f" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M3.4 6.2 Q9.6 4.4 16 8 V25.6 Q9.6 22.2 3.4 24 Z" fill="#fffaf0" stroke="#b39a68" stroke-width="1.1" stroke-linejoin="round"/>
    <path d="M28.6 6.2 Q22.4 4.4 16 8 V25.6 Q22.4 22.2 28.6 24 Z" fill="#fff4d6" stroke="#b39a68" stroke-width="1.1" stroke-linejoin="round"/>
    <path d="M6 10.4 Q9.6 9.4 13.4 11 M6 13.8 Q9.6 12.8 13.4 14.4 M6 17.2 Q9.6 16.2 13.4 17.8 M6 20.6 Q8.6 19.9 11 20.8" stroke="#8fb3e8" stroke-width="1.3" stroke-linecap="round" fill="none"/>
    <path d="M18.6 11 Q22.4 9.4 26 10.4 M18.6 14.4 Q22.4 12.8 26 13.8" stroke="#8fb3e8" stroke-width="1.3" stroke-linecap="round" fill="none"/>
    <polygon points="${star(22.4, 19.2, 3.6, 1.6)}" fill="#ffd23f" stroke="#a96f00" stroke-width="0.8" stroke-linejoin="round"/>
    <line x1="16" y1="8" x2="16" y2="25.6" stroke="#b39a68" stroke-width="1.2"/>
    <path d="M17.6 25 v5.6 l2 -1.7 l2 1.7 v-6.2 z" fill="#e63946" stroke="#891b25" stroke-width="0.9" stroke-linejoin="round"/>
  </svg>`
}

const wrap = (svg: string): string =>
  `<span style="display:inline-flex;vertical-align:-0.24em;line-height:0">${svg}</span>`

/**
 * ტექსტში 🪙 და 📘 ემოჯებს ცვლის ახალი ხატულებით (SVG).
 * მუშაობს უკვე აგებულ ელემენტზე: ყველა ტექსტურ კვანძს გადის.
 */
export function decorateCurrency(root: Node): void {
  if (typeof document === 'undefined' || typeof document.createTreeWalker !== 'function') return

  const walker = document.createTreeWalker(root, 4 /* NodeFilter.SHOW_TEXT */)
  const targets: Text[] = []
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node as Text
    if (text.data.includes('🪙') || text.data.includes('📘')) targets.push(text)
  }

  for (const text of targets) {
    const parts = text.data.split(/(🪙|📘)/)
    const fragment = document.createDocumentFragment()
    for (const part of parts) {
      if (part === '🪙' || part === '📘') {
        const holder = document.createElement('span')
        holder.innerHTML = wrap(part === '🪙' ? coinIcon(24) : bookIcon(24))
        fragment.appendChild(holder.firstChild as Node)
      } else if (part !== '') {
        fragment.appendChild(document.createTextNode(part))
      }
    }
    text.parentNode?.replaceChild(fragment, text)
  }
}

export { wrap as currencyWrap }
