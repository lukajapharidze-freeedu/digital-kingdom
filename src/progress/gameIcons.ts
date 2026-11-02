/**
 * სამჭედლოს თამაშების ხატულები (SVG) და ფერები.
 * ყოველ თამაშს თავისი სახე აქვს: პროცესორი, კლავიატურა, დისკეტა, ჩოგანი, მთა და კოშკი.
 */

export interface GameVisual {
  /** ხატულის ფონის გრადიენტი: [ღია, მუქი] */
  colors: [string, string]
  svg: string
}

const VISUALS: Record<string, GameVisual> = {
  // CPU Dash — პროცესორი ელვით და სიჩქარის ხაზებით
  'cpu-dash': {
    colors: ['#7fe9ff', '#2f7de1'],
    svg: `
      <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <defs>
          <linearGradient id="gi-cpu" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#f4fdff"/>
            <stop offset="1" stop-color="#8fd8ff"/>
          </linearGradient>
        </defs>
        <g stroke="#e8f8ff" stroke-width="3" stroke-linecap="round">
          <path d="M24 9v6M32 9v6M40 9v6M24 49v6M32 49v6M40 49v6"/>
          <path d="M19 20h-6M19 28h-6M19 36h-6M45 20h6M45 28h6M45 36h6" transform="translate(0 3)"/>
        </g>
        <rect x="17" y="15" width="30" height="34" rx="6" fill="url(#gi-cpu)" stroke="#1b5aa8" stroke-width="2.5"/>
        <path d="M35 19 L25 34 H31 L28 46 L40 29 H34 Z" fill="#ffd23f" stroke="#c98200" stroke-width="1.6" stroke-linejoin="round"/>
        <path d="M3 26h8M1 33h9M4 40h7" stroke="#ffffff" stroke-width="2.6" stroke-linecap="round" opacity=".9"/>
      </svg>`,
  },

  // Typing Grandmaster — კლავიატურა გვირგვინით
  'typing-grandmaster': {
    colors: ['#caa8ff', '#6a3fd1'],
    svg: `
      <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M18 21 L20 9 L27 15 L32 7 L37 15 L44 9 L46 21 Z" fill="#ffd23f" stroke="#c98200" stroke-width="1.8" stroke-linejoin="round"/>
        <circle cx="20" cy="9" r="2" fill="#fff3b0"/><circle cx="32" cy="7" r="2" fill="#fff3b0"/><circle cx="44" cy="9" r="2" fill="#fff3b0"/>
        <rect x="5" y="24" width="54" height="33" rx="7" fill="#2b3f78" stroke="#16224a" stroke-width="2.5"/>
        <g fill="#eef3ff">
          <rect x="10" y="29" width="7" height="7" rx="1.8"/><rect x="19" y="29" width="7" height="7" rx="1.8"/>
          <rect x="28" y="29" width="7" height="7" rx="1.8" fill="#ffd23f"/><rect x="37" y="29" width="7" height="7" rx="1.8"/>
          <rect x="46" y="29" width="8" height="7" rx="1.8"/>
          <rect x="10" y="38" width="9" height="7" rx="1.8"/><rect x="21" y="38" width="7" height="7" rx="1.8"/>
          <rect x="30" y="38" width="7" height="7" rx="1.8"/><rect x="39" y="38" width="7" height="7" rx="1.8"/>
          <rect x="48" y="38" width="6" height="7" rx="1.8"/>
          <rect x="16" y="47" width="32" height="6" rx="2"/>
        </g>
      </svg>`,
  },

  // Typing Champion — კიბე ცაში: კუბიკის გმირი სიტყვების საფეხურებზე ადის ფინიშის დროშისკენ
  'typing-champion': {
    colors: ['#c9ecff', '#7b86e8'],
    svg: `
      <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M2 58 V51 H11 V44 H22 V37 H33 V30 H44 V23 H62 V58 Z" fill="#8a5a35" stroke="#4a2f19" stroke-width="2" stroke-linejoin="round"/>
        <g fill="#c6955e">
          <rect x="3" y="51" width="8" height="2.6"/><rect x="11" y="44" width="11" height="2.6"/>
          <rect x="22" y="37" width="11" height="2.6"/><rect x="33" y="30" width="11" height="2.6"/>
          <rect x="44" y="23" width="17" height="2.6"/>
        </g>
        <g fill="#9a9a9a" stroke="#555555" stroke-width="0.8">
          <rect x="9" y="49" width="3" height="3"/><rect x="20" y="42" width="3" height="3"/>
          <rect x="31" y="35" width="3" height="3"/><rect x="42" y="28" width="3" height="3"/>
        </g>
        <rect x="36" y="8" width="18" height="12" rx="3" fill="#1e5abe" stroke="#9fe8ff" stroke-width="1.8"/>
        <text x="45" y="17.6" text-anchor="middle" font-family="Arial, sans-serif" font-size="10.5" font-weight="900" fill="#ffffff">ა</text>
        <path d="M56 23 V3" stroke="#4a2f19" stroke-width="2" stroke-linecap="round"/>
        <g>
          <rect x="57" y="3" width="6.5" height="6" fill="#ffffff" stroke="#1a1a1a" stroke-width="0.8"/>
          <rect x="57" y="3" width="2.2" height="2" fill="#1a1a1a"/><rect x="61.3" y="3" width="2.2" height="2" fill="#1a1a1a"/>
          <rect x="59.2" y="5" width="2.1" height="2" fill="#1a1a1a"/>
          <rect x="57" y="7" width="2.2" height="2" fill="#1a1a1a"/><rect x="61.3" y="7" width="2.2" height="2" fill="#1a1a1a"/>
        </g>
        <g stroke="#2a1a10" stroke-width="0.8" stroke-linejoin="round" transform="translate(25 37.5) scale(1.45) translate(-25 -37.5)">
          <path d="M20.5 22 L12.5 33 L19.5 31.5 Z" fill="#ffb31f"/>
          <rect x="21" y="29.5" width="3.2" height="8" fill="#24376e" transform="rotate(-24 22.6 29.5)"/>
          <rect x="24.4" y="29.5" width="3.2" height="8" fill="#2f4a8c" transform="rotate(26 26 29.5)"/>
          <rect x="20.5" y="21" width="7.5" height="9" fill="#d8302b"/>
          <path d="M24.8 22.5 L23.2 25.4 H25 L23.8 28.3 L26.4 24.7 H24.8 Z" fill="#ffd23f" stroke="none"/>
          <rect x="26" y="22" width="2.8" height="7" fill="#d8302b" transform="rotate(-50 27.4 22)"/>
          <rect x="20.5" y="13" width="7.5" height="8" fill="#f1c49b"/>
          <rect x="20.5" y="13" width="7.5" height="2.6" fill="#1f1a17"/>
          <rect x="20.5" y="13" width="2" height="5" fill="#1f1a17" stroke="none"/>
        </g>
        <rect x="25.6" y="16.6" width="1.3" height="1.5" fill="#1b2a6b" transform="translate(25 37.5) scale(1.45) translate(-25 -37.5)"/>
        <path d="M3 30h5M2 35h4" stroke="#ffffff" stroke-width="2" stroke-linecap="round" opacity=".9"/>
      </svg>`,
  },

  // Flappy Floppy — დისკეტა ფრთებით
  'flappy-floppy': {
    colors: ['#ffd98a', '#ef8a1f'],
    svg: `
      <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M14 34 C3 33 0 21 6 14 C8 23 14 27 19 28 Z" fill="#ffffff" stroke="#9fb4d4" stroke-width="2" stroke-linejoin="round"/>
        <path d="M50 34 C61 33 64 21 58 14 C56 23 50 27 45 28 Z" fill="#ffffff" stroke="#9fb4d4" stroke-width="2" stroke-linejoin="round"/>
        <path d="M15 14 H43 L50 21 V47 Q50 50 47 50 H17 Q14 50 14 47 Z" fill="#2c4f9e" stroke="#16295a" stroke-width="2.5" stroke-linejoin="round"/>
        <rect x="22" y="14" width="20" height="13" rx="1.5" fill="#d9e3f5" stroke="#16295a" stroke-width="1.5"/>
        <rect x="34" y="16.5" width="5" height="8" rx="1" fill="#33415c"/>
        <rect x="19" y="32" width="26" height="15" rx="2" fill="#ffffff"/>
        <rect x="19" y="32" width="26" height="4" fill="#ff7a3d"/>
        <path d="M23 40h14M23 44h9" stroke="#9aa8c4" stroke-width="1.8" stroke-linecap="round"/>
      </svg>`,
  },

  // Ping-Pong-Dong — ჩოგანი და ბურთი
  'ping-pong-dong': {
    colors: ['#ff9fae', '#d6334f'],
    svg: `
      <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M30 40 L18 56 Q15 59 12 56 Q9 53 12 50 L25 36 Z" fill="#c98a4a" stroke="#6b4521" stroke-width="2" stroke-linejoin="round"/>
        <circle cx="31" cy="25" r="18" fill="#e63946" stroke="#7a1621" stroke-width="2.5"/>
        <path d="M18 18 Q24 9 34 9" stroke="#ff9aa5" stroke-width="3" stroke-linecap="round" fill="none"/>
        <circle cx="50" cy="45" r="7" fill="#fff6c7" stroke="#d4a017" stroke-width="2"/>
        <path d="M45 56 h-5 M52 54 l-3 3" stroke="#ffffff" stroke-width="2.4" stroke-linecap="round" opacity=".9"/>
      </svg>`,
  },

  // Cliff Climber — მთა დროშით
  'cliff-climber': {
    colors: ['#a7ecc0', '#2f9d62'],
    svg: `
      <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M2 54 L22 20 L34 40 L40 31 L62 54 Z" fill="#6f8aa8" stroke="#2f4560" stroke-width="2.2" stroke-linejoin="round"/>
        <path d="M22 20 L16 31 L21 29 L25 33 L28 29 Z" fill="#ffffff" stroke="#c4d3e6" stroke-width="1.4" stroke-linejoin="round"/>
        <path d="M2 54 L22 20 L28 30 L18 54 Z" fill="#8fa8c4" opacity=".55"/>
        <path d="M22 20 V8" stroke="#5a3a1a" stroke-width="2.4" stroke-linecap="round"/>
        <path d="M22 8 L34 12 L22 16 Z" fill="#ff4d5a" stroke="#a31f2b" stroke-width="1.4" stroke-linejoin="round"/>
        <path d="M6 54 H58" stroke="#2f4560" stroke-width="2.4" stroke-linecap="round"/>
      </svg>`,
  },

  // Jump Up Tower — კოშკი ზემოთ მიმართული ისრით
  'jump-up-tower': {
    colors: ['#ffc08a', '#e0561f'],
    svg: `
      <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M20 58 V26 H16 V18 H22 V22 H27 V18 H37 V22 H42 V18 H48 V26 H44 V58 Z" fill="#c87941" stroke="#6b3a17" stroke-width="2.2" stroke-linejoin="round"/>
        <path d="M24 34 h16 M24 42 h16 M24 50 h16 M32 26 v8 M28 34 v8 M36 34 v8 M32 42 v8 M28 50 v8 M36 50 v8" stroke="#6b3a17" stroke-width="1.6" opacity=".6"/>
        <rect x="28" y="46" width="8" height="12" rx="4" fill="#3a2410"/>
        <path d="M32 3 L43 15 H36 V21 H28 V15 H21 Z" fill="#59d66a" stroke="#1f7a32" stroke-width="2" stroke-linejoin="round"/>
      </svg>`,
  },

  // 6 7 — ორი დახრილი ციფრი
  'six-seven': {
    colors: ['#ffe066', '#e0457b'],
    svg: `
      <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <g font-family="Arial, sans-serif" font-size="34" font-weight="900" stroke="#7a1240" stroke-width="2" paint-order="stroke">
          <text x="6" y="40" fill="#ffffff" transform="rotate(-12 16 30)">6</text>
          <text x="34" y="48" fill="#fff3b0" transform="rotate(12 44 38)">7</text>
        </g>
      </svg>`,
  },
}

const FALLBACK: GameVisual = {
  colors: ['#c5d4e6', '#6f87a6'],
  svg: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><circle cx="32" cy="32" r="18" fill="#ffffff" stroke="#4a6580" stroke-width="3"/><text x="32" y="40" text-anchor="middle" font-size="24" font-weight="900" fill="#4a6580">?</text></svg>`,
}

export function gameVisual(id: string): GameVisual {
  return VISUALS[id] ?? FALLBACK
}
