/**
 * Typing Champion — ბეჭდვის რბოლა ლოკალურ ქსელში (LAN), 2–4 მოთამაშე.
 *
 * ერთი მოთამაშე ქმნის ოთახს და იღებს 4-ნიშნა კოდს, დანარჩენები კოდით უერთდებიან.
 * ყოველ ეტაპზე ტექსტი 5 სიტყვით იზრდება (15, 20, 25...) და მრბოლელი ფორმას იცვლის:
 * ფეხით → მანქანა → მოტოციკლი → რაკეტა → მფრინავი თეფში.
 *
 * კავშირი მიდის მასპინძლის კომპიუტერზე გაშვებულ რელეზე (server/typingChampionRelay.mjs),
 * რომელიც `npm run lan`-ით ირთვება. Vercel-ზე რელე არ არის — მაშინ თამაში ამას გვეუბნება.
 */

export interface TypingChampionOptions {
  onClose?: () => void
}

type Phase = 'lobby' | 'countdown' | 'race' | 'results' | 'final'

interface NetPlayer {
  id: number
  name: string
  lane: number
  chars: number
  finishMs: number | null
  place: number | null
  points: number
  left: boolean
}

interface RoomState {
  code: string
  hostId: number
  phase: Phase
  stage: number
  stageCount: number
  players: NetPlayer[]
}

type ServerMessage =
  | { t: 'hello'; lanUrls: string[] }
  | { t: 'joined'; code: string; id: number }
  | ({ t: 'room' } & RoomState)
  | { t: 'stage'; stage: number; stageCount: number; text: string; startsIn: number }
  | { t: 'progress'; id: number; chars: number }
  | { t: 'hurry'; seconds: number }
  | { t: 'error'; msg: string }

type VehicleKind = 'foot' | 'car' | 'moto' | 'rocket' | 'ufo'

const WS_PATH = '/typing-champion-ws'
const FIRST_STAGE_WORDS = 15
const WORDS_PER_STAGE_STEP = 5
const RESULTS_SECONDS = 6
const LANE_COLORS = ['#ff5a5f', '#3fa7ff', '#ffc93c', '#5ad17a']
const MEDALS = ['🥇', '🥈', '🥉', '🏅']

const VEHICLES: { kind: VehicleKind; name: string; icon: string }[] = [
  { kind: 'foot', name: 'ფეხით', icon: '🏃' },
  { kind: 'car', name: 'მანქანა', icon: '🚗' },
  { kind: 'moto', name: 'მოტოციკლი', icon: '🏍️' },
  { kind: 'rocket', name: 'რაკეტა', icon: '🚀' },
  { kind: 'ufo', name: 'მფრინავი თეფში', icon: '🛸' },
]

// მარტივი სიტყვები 2–4 კლასისთვის: სახლი, ბუნება, სკოლა და ცოტა კომპიუტერი
const WORD_BANK = [
  'მზე', 'ცა', 'ხე', 'ზღვა', 'მთა', 'ტყე', 'ქარი', 'წვიმა', 'თოვლი', 'მთვარე',
  'ღრუბელი', 'ყვავილი', 'მდინარე', 'ვარსკვლავი', 'ბაღი', 'ეზო', 'ხიდი', 'სოფელი', 'ქალაქი', 'სახლი',
  'დედა', 'მამა', 'ბებია', 'ბაბუა', 'ძმა', 'და', 'მეგობარი', 'მასწავლებელი', 'სკოლა', 'კლასი',
  'წიგნი', 'რვეული', 'კალამი', 'ფანქარი', 'ჩანთა', 'დაფა', 'ცარცი', 'გაკვეთილი', 'ბურთი', 'თამაში',
  'კატა', 'ძაღლი', 'ჩიტი', 'თევზი', 'ლომი', 'ზებრა', 'ჟირაფი', 'სპილო', 'კურდღელი', 'ციყვი',
  'ფუტკარი', 'პეპელა', 'ჭიანჭველა', 'ზღარბი', 'ვაშლი', 'მსხალი', 'ყურძენი', 'პური', 'წყალი', 'რძე',
  'ნამცხვარი', 'თაფლი', 'ყველი', 'წითელი', 'მწვანე', 'ლურჯი', 'ყვითელი', 'დიდი', 'პატარა', 'სწრაფი',
  'მხიარული', 'კარგი', 'ლამაზი', 'ახალი', 'თბილი', 'დილა', 'საღამო', 'ღამე', 'ზამთარი', 'ზაფხული',
  'კოდი', 'ბიტი', 'ჩიპი', 'მაუსი', 'ეკრანი', 'ფაილი', 'ქსელი', 'დისკი', 'რობოტი', 'ღილაკი',
  'სურათი', 'მუსიკა', 'პაროლი', 'პროგრამა', 'კომპიუტერი', 'კლავიატურა', 'ჯადოქარი', 'ჰაერი', 'ჯოხი', 'შოკოლადი',
]

// სტანდარტული ქართული განლაგება: ლათინური კლავიშიც მიიღება, თუ ბავშვს ქართული განლაგება არ აქვს
const LATIN_TO_KA: Record<string, string> = {
  a: 'ა', b: 'ბ', c: 'ც', d: 'დ', e: 'ე', f: 'ფ', g: 'გ', h: 'ჰ', i: 'ი', j: 'ჯ', k: 'კ', l: 'ლ', m: 'მ',
  n: 'ნ', o: 'ო', p: 'პ', q: 'ქ', r: 'რ', s: 'ს', t: 'ტ', u: 'უ', v: 'ვ', w: 'წ', x: 'ხ', y: 'ყ', z: 'ზ',
  W: 'ჭ', R: 'ღ', T: 'თ', S: 'შ', J: 'ჟ', Z: 'ძ', C: 'ჩ',
}
const KA_TO_KEY: Record<string, string> = {}
for (const [latin, ka] of Object.entries(LATIN_TO_KA)) {
  KA_TO_KEY[ka] = latin === latin.toUpperCase() ? `Shift + ${latin}` : latin.toUpperCase()
}

function keyToChar(key: string): string {
  return LATIN_TO_KA[key] ?? LATIN_TO_KA[key.toLowerCase()] ?? key
}

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (ch) => `&#${ch.charCodeAt(0)};`)
}

function stageWordCount(stage: number): number {
  return FIRST_STAGE_WORDS + WORDS_PER_STAGE_STEP * stage
}

/** ეტაპის ტექსტი: პირველ ეტაპებზე მოკლე სიტყვები, მერე უფრო გრძელიც */
function makeStageText(stage: number): string {
  const maxLen = 5 + stage * 2
  const pool = WORD_BANK.filter((w) => w.length <= maxLen)
  const words: string[] = []
  let bag: string[] = []
  while (words.length < stageWordCount(stage)) {
    if (bag.length === 0) bag = [...pool].sort(() => Math.random() - 0.5)
    const word = bag.pop()!
    if (word !== words[words.length - 1]) words.push(word)
  }
  return words.join(' ')
}

function vehicleFor(stage: number) {
  return VEHICLES[stage % VEHICLES.length]
}

/** მრბოლელის SVG (მარჯვნივ იყურება); მთავარი ფერი = currentColor */
function vehicleSvg(kind: VehicleKind): string {
  const wheel = (cx: number, cy: number, r: number) => `
    <g class="tc-wheel" style="transform-origin:${cx}px ${cy}px">
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="#222" stroke="#111" stroke-width="1.5"/>
      <circle cx="${cx}" cy="${cy}" r="${r * 0.45}" fill="#ccc"/>
      <path d="M${cx - r * 0.8} ${cy}H${cx + r * 0.8}M${cx} ${cy - r * 0.8}V${cy + r * 0.8}" stroke="#888" stroke-width="1.4"/>
    </g>`
  switch (kind) {
    case 'foot':
      return `<svg viewBox="0 0 80 50" aria-hidden="true">
        <g class="tc-leg tc-leg-b"><path d="M40 31 L47 46 L52 46" stroke="#2c3e66" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g>
        <g class="tc-arm tc-arm-b"><path d="M42 19 L35 27" stroke="#c98a5a" stroke-width="4" stroke-linecap="round"/></g>
        <path d="M44 15 L40 31" stroke="currentColor" stroke-width="9" stroke-linecap="round"/>
        <g class="tc-leg tc-leg-a"><path d="M40 31 L34 46 L39 46" stroke="#3b5288" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g>
        <g class="tc-arm tc-arm-a"><path d="M43 19 L51 25" stroke="#e0a172" stroke-width="4" stroke-linecap="round"/></g>
        <circle cx="46" cy="8" r="6.5" fill="#f2c08f" stroke="#7a4a26" stroke-width="1.5"/>
        <path d="M40 6 Q46 -1 52 5 L52 7 L40 7 Z" fill="currentColor"/>
        <path d="M14 22H28M10 30H26M16 38H30" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" opacity=".7" class="tc-speed"/>
      </svg>`
    case 'car':
      return `<svg viewBox="0 0 80 50" aria-hidden="true">
        <path d="M10 34 Q10 26 18 25 L28 24 L36 14 Q38 12 42 12 L56 12 Q60 12 62 16 L67 25 Q74 26 75 33 L75 37 L10 37 Z" fill="currentColor" stroke="rgba(0,0,0,.45)" stroke-width="1.6" stroke-linejoin="round"/>
        <path d="M38 16 L44 16 L44 24 L32 24 Z M47 16 L57 16 Q59 16 60 18 L63 24 L47 24 Z" fill="#cfefff" stroke="rgba(0,0,0,.3)" stroke-width="1"/>
        <rect x="70" y="28" width="5" height="4" rx="1" fill="#fff6a8"/>
        <rect x="10" y="29" width="4" height="3" rx="1" fill="#ff3b3b"/>
        ${wheel(24, 38, 7)}${wheel(61, 38, 7)}
        <path d="M0 26H8M2 33H8" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" opacity=".7" class="tc-speed"/>
      </svg>`
    case 'moto':
      return `<svg viewBox="0 0 80 50" aria-hidden="true">
        ${wheel(18, 38, 9)}${wheel(62, 38, 9)}
        <path d="M18 38 L32 26 L50 26 L62 38" stroke="#444" stroke-width="3" fill="none" stroke-linejoin="round"/>
        <path d="M28 26 Q30 19 40 19 L52 19 Q56 20 55 26 Z" fill="currentColor" stroke="rgba(0,0,0,.45)" stroke-width="1.4"/>
        <path d="M54 21 L60 12 L64 12" stroke="#333" stroke-width="3" fill="none" stroke-linecap="round"/>
        <path d="M38 19 L34 7 L44 8 L46 19 Z" fill="#2c3e66"/>
        <circle cx="40" cy="5" r="6" fill="currentColor" stroke="rgba(0,0,0,.45)" stroke-width="1.4"/>
        <path d="M41 3 H47 V7 H42 Z" fill="#cfefff"/>
        <path d="M44 10 L56 14" stroke="#2c3e66" stroke-width="4" stroke-linecap="round"/>
        <path d="M0 24H8M2 32H6" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" opacity=".7" class="tc-speed"/>
      </svg>`
    case 'rocket':
      return `<svg viewBox="0 0 80 50" aria-hidden="true">
        <g class="tc-flame">
          <path d="M18 19 Q2 25 18 31 Q10 25 18 19 Z" fill="#ffb238"/>
          <path d="M18 21 Q8 25 18 29 Z" fill="#fff1a8"/>
        </g>
        <path d="M22 14 L12 6 L30 16 Z M22 36 L12 44 L30 34 Z" fill="currentColor" stroke="rgba(0,0,0,.45)" stroke-width="1.4" stroke-linejoin="round"/>
        <path d="M18 17 L56 15 Q72 18 78 25 Q72 32 56 35 L18 33 Z" fill="#f4f7fb" stroke="#6d7c90" stroke-width="1.6" stroke-linejoin="round"/>
        <path d="M60 15.5 Q72 18 78 25 Q72 32 60 34.5 Q64 25 60 15.5 Z" fill="currentColor"/>
        <circle cx="46" cy="25" r="5.5" fill="#7fd3ff" stroke="#38597a" stroke-width="2"/>
        <path d="M22 22 L52 22" stroke="currentColor" stroke-width="2" opacity=".6"/>
      </svg>`
    case 'ufo':
      return `<svg viewBox="0 0 80 50" aria-hidden="true">
        <path d="M30 34 L22 50 L58 50 L50 34 Z" fill="#b6ffde" opacity=".35" class="tc-beam"/>
        <path d="M26 22 Q40 2 54 22 Z" fill="#bfe9ff" stroke="#4f7a9a" stroke-width="1.6"/>
        <circle cx="40" cy="15" r="4" fill="#7bd96b"/>
        <ellipse cx="40" cy="26" rx="30" ry="9" fill="currentColor" stroke="rgba(0,0,0,.45)" stroke-width="1.6"/>
        <ellipse cx="40" cy="23" rx="20" ry="3.5" fill="rgba(255,255,255,.35)"/>
        <g class="tc-lights" fill="#fff6a8">
          <circle cx="20" cy="27" r="2.2"/><circle cx="30" cy="30" r="2.2"/><circle cx="40" cy="31" r="2.2"/>
          <circle cx="50" cy="30" r="2.2"/><circle cx="60" cy="27" r="2.2"/>
        </g>
      </svg>`
  }
}

const STYLE = `
  .tc-root {
    position: fixed; inset: 0; z-index: 2000; overflow: auto;
    display: flex; flex-direction: column;
    background: linear-gradient(160deg, #1f2b5c, #3a2a73 55%, #19163d);
    color: #1f2d3d; font-family: Arial, sans-serif;
  }
  .tc-root * { box-sizing: border-box; }
  .tc-root [hidden] { display: none !important; }
  .tc-top {
    display: flex; align-items: center; gap: 14px; flex-wrap: wrap;
    padding: 12px 18px; color: #fff;
  }
  .tc-title { font-size: 22px; font-weight: 900; letter-spacing: .5px; text-shadow: 0 3px 0 rgba(0,0,0,.3); }
  .tc-title span { color: #ffd23f; }
  .tc-info { font-size: 15px; font-weight: 800; opacity: .9; }
  .tc-spacer { flex: 1; }
  .tc-btn {
    padding: 11px 18px; border: 0; border-radius: 12px; cursor: pointer;
    font: 900 16px Arial, sans-serif; color: #fff; background: #3a7bd5;
    box-shadow: 0 4px 0 rgba(0,0,0,.25); transition: transform .1s;
  }
  .tc-btn:hover { transform: translateY(-1px); }
  .tc-btn:active { transform: translateY(2px); box-shadow: 0 2px 0 rgba(0,0,0,.25); }
  .tc-btn:disabled { opacity: .5; cursor: default; transform: none; }
  .tc-btn.tc-green { background: #2fa760; }
  .tc-btn.tc-orange { background: #e5832a; }
  .tc-btn.tc-ghost { background: rgba(255,255,255,.92); color: #3a2a73; }
  .tc-center { flex: 1; display: flex; align-items: center; justify-content: center; padding: 16px; }
  .tc-card {
    width: min(560px, 100%); padding: 26px; border-radius: 22px;
    background: #fff; box-shadow: 0 18px 50px rgba(0,0,0,.35);
  }
  .tc-card h2 { margin: 0 0 6px; font-size: 26px; }
  .tc-card p { margin: 6px 0; color: #4b5d70; font-weight: 700; line-height: 1.4; }
  .tc-field { display: flex; flex-direction: column; gap: 6px; margin: 16px 0; font-weight: 800; }
  .tc-input {
    padding: 12px 14px; border: 2px solid #c9d5e3; border-radius: 12px;
    font: 800 18px Arial, sans-serif; outline: none;
  }
  .tc-input:focus { border-color: #3a7bd5; }
  .tc-row { display: flex; gap: 10px; align-items: stretch; flex-wrap: wrap; }
  .tc-row .tc-input { flex: 1; min-width: 120px; }
  .tc-code-input { letter-spacing: 8px; text-align: center; font-size: 24px; }
  .tc-or { text-align: center; margin: 14px 0; color: #8696a7; font-weight: 900; }
  .tc-error { min-height: 22px; color: #d23a3a !important; }
  .tc-code {
    margin: 10px 0 14px; padding: 12px; border-radius: 16px; text-align: center;
    background: #fff4cc; border: 3px dashed #e0a030;
    font-size: 54px; font-weight: 900; letter-spacing: 14px; color: #8a4d00;
  }
  .tc-players { list-style: none; margin: 10px 0; padding: 0; display: grid; gap: 8px; }
  .tc-players li {
    display: flex; align-items: center; gap: 10px; padding: 10px 12px;
    border-radius: 12px; background: #f2f5fa; font-weight: 900; font-size: 17px;
  }
  .tc-dot { width: 16px; height: 16px; border-radius: 50%; flex: none; }
  .tc-tag { margin-left: auto; font-size: 13px; color: #6a7a8c; }
  .tc-small { font-size: 13px !important; }
  .tc-select { display: flex; gap: 8px; flex-wrap: wrap; margin: 8px 0 14px; }
  .tc-select button {
    flex: 1; min-width: 90px; padding: 9px; border-radius: 10px; cursor: pointer;
    border: 2px solid #c9d5e3; background: #fff; font: 900 14px Arial, sans-serif; color: #33475b;
  }
  .tc-select button.tc-on { border-color: #3a7bd5; background: #e7f0ff; color: #1d4f9c; }

  /* --- რბოლა --- */
  .tc-race { flex: 1; display: flex; flex-direction: column; gap: 12px; padding: 0 18px 18px; position: relative; }
  .tc-track { border-radius: 18px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,.35); }
  .tc-lane {
    position: relative; height: 76px; display: flex; align-items: stretch;
    border-bottom: 3px dashed rgba(255,255,255,.55);
  }
  .tc-lane:last-child { border-bottom: 0; }
  .tc-label {
    width: 150px; flex: none; display: flex; align-items: center; gap: 8px; padding: 0 10px;
    background: rgba(0,0,0,.35); color: #fff; font-weight: 900; font-size: 15px; overflow: hidden;
  }
  .tc-rank {
    width: 26px; height: 26px; flex: none; border-radius: 50%; display: flex; align-items: center; justify-content: center;
    background: #fff; color: #222; font-size: 14px;
  }
  .tc-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .tc-me .tc-label { background: rgba(255,210,63,.55); color: #2b1b00; }
  .tc-lane-track { position: relative; flex: 1; }
  .tc-finish {
    position: absolute; top: 0; bottom: 0; right: 0; width: 16px;
    background: repeating-conic-gradient(#111 0 25%, #fff 0 50%) 0 0 / 8px 8px;
  }
  .tc-racer {
    position: absolute; top: 6px; width: 84px; height: 64px; left: 0;
    transition: left .25s linear; filter: drop-shadow(0 3px 2px rgba(0,0,0,.35));
  }
  .tc-racer svg { width: 84px; height: 52px; display: block; }
  .tc-racer-name {
    position: absolute; left: 0; right: 0; bottom: -2px; text-align: center;
    font-size: 11px; font-weight: 900; color: #fff; text-shadow: 0 1px 2px #000; white-space: nowrap;
  }
  .tc-badge {
    position: absolute; right: 110px; top: 50%; transform: translateY(-50%);
    padding: 4px 10px; border-radius: 999px; background: rgba(255,255,255,.92);
    font-weight: 900; font-size: 14px; color: #222;
  }
  .tc-empty .tc-label { opacity: .5; }
  .tc-gone { opacity: .45; }

  .tc-scene-foot .tc-lane { background: linear-gradient(#59b84a, #3f9a37); }
  .tc-scene-foot .tc-lane:nth-child(odd) { background: linear-gradient(#c8623b, #b24f2b); }
  .tc-scene-car .tc-lane { background: linear-gradient(#53575f, #43464d); border-bottom-color: #ffd23f; }
  .tc-scene-moto .tc-lane { background: linear-gradient(#d9a45f, #c98c46); border-bottom-color: #fff3d0; }
  .tc-scene-rocket .tc-lane, .tc-scene-ufo .tc-lane {
    background:
      radial-gradient(1.5px 1.5px at 20% 30%, #fff 50%, transparent 51%),
      radial-gradient(1.5px 1.5px at 60% 70%, #fff 50%, transparent 51%),
      radial-gradient(1px 1px at 80% 20%, #fff 50%, transparent 51%),
      radial-gradient(1px 1px at 40% 85%, #fff 50%, transparent 51%),
      linear-gradient(#10163a, #1d1450);
    background-size: 120px 76px, 160px 76px, 90px 76px, 140px 76px, auto;
    border-bottom-color: rgba(140,170,255,.4);
  }
  .tc-scene-ufo .tc-lane { background-color: #2a0f4a; }

  .tc-ticker {
    min-height: 34px; text-align: center; color: #fff; font-weight: 900; font-size: 18px;
    text-shadow: 0 2px 0 rgba(0,0,0,.35); transition: opacity .3s;
  }
  .tc-typing {
    padding: 16px 18px; border-radius: 18px; background: #fff;
    box-shadow: 0 10px 30px rgba(0,0,0,.35);
  }
  .tc-text {
    max-height: 132px; overflow: auto; font-size: 26px; line-height: 1.55;
    font-weight: 700; color: #9aa7b6; word-break: break-word;
  }
  .tc-text .tc-done { color: #23a35a; }
  .tc-text .tc-cur { color: #1f2d3d; background: #ffe98a; border-radius: 4px; box-shadow: 0 3px 0 #e0a030; }
  .tc-text .tc-cur.tc-space { padding: 0 6px; }
  .tc-text .tc-cur.tc-wrong { background: #ff9b9b; box-shadow: 0 3px 0 #d23a3a; }
  .tc-stats { display: flex; gap: 16px; flex-wrap: wrap; margin-top: 10px; font-weight: 800; color: #4b5d70; font-size: 14px; }
  .tc-stats b { color: #1f2d3d; }
  .tc-hint { margin-left: auto; color: #8a4d00; }

  .tc-overlay {
    position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
    background: rgba(10,10,30,.55); z-index: 5; padding: 16px;
  }
  .tc-count {
    font-size: 150px; font-weight: 900; color: #fff;
    text-shadow: 0 8px 0 rgba(0,0,0,.35); animation: tc-pop .9s ease-out infinite;
  }
  .tc-results { list-style: none; margin: 12px 0; padding: 0; display: grid; gap: 8px; }
  .tc-results li {
    display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 12px;
    background: #f2f5fa; font-weight: 900; font-size: 17px;
  }
  .tc-results .tc-medal { font-size: 26px; width: 34px; text-align: center; }
  .tc-results .tc-score { margin-left: auto; color: #2b6cb0; }
  .tc-next { margin-top: 10px; font-size: 18px !important; color: #1f2d3d !important; }

  .tc-wheel { animation: tc-spin .35s linear infinite; }
  .tc-leg-a, .tc-arm-b { transform-origin: 40px 31px; animation: tc-swing .32s ease-in-out infinite alternate; }
  .tc-leg-b, .tc-arm-a { transform-origin: 40px 31px; animation: tc-swing .32s ease-in-out infinite alternate-reverse; }
  .tc-arm-a, .tc-arm-b { transform-origin: 42px 19px; }
  .tc-flame { transform-origin: 18px 25px; animation: tc-flicker .12s linear infinite alternate; }
  .tc-lights { animation: tc-blink .5s steps(2) infinite; }
  .tc-racer { animation: tc-bob .5s ease-in-out infinite alternate; }
  .tc-idle .tc-wheel, .tc-idle .tc-leg, .tc-idle .tc-arm, .tc-idle .tc-racer, .tc-idle .tc-speed { animation-play-state: paused; }
  .tc-idle .tc-speed { opacity: 0; }
  @keyframes tc-spin { to { transform: rotate(360deg); } }
  @keyframes tc-swing { from { transform: rotate(-28deg); } to { transform: rotate(28deg); } }
  @keyframes tc-flicker { from { transform: scaleX(.75); } to { transform: scaleX(1.15); } }
  @keyframes tc-blink { 50% { opacity: .3; } }
  @keyframes tc-bob { from { margin-top: 0; } to { margin-top: -3px; } }
  @keyframes tc-pop { from { transform: scale(1.3); opacity: .4; } 30% { transform: scale(1); opacity: 1; } }
  @keyframes tc-shake { 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
  .tc-shake { animation: tc-shake .15s linear 2; }
  @media (max-width: 640px) {
    .tc-label { width: 92px; font-size: 12px; }
    .tc-text { font-size: 20px; }
  }
  @media (prefers-reduced-motion: reduce) {
    .tc-wheel, .tc-leg, .tc-arm, .tc-racer, .tc-flame, .tc-lights { animation: none !important; }
  }
`

export class TypingChampion {
  private readonly onClose: (() => void) | undefined
  private readonly root: HTMLDivElement
  private readonly style: HTMLStyleElement
  private readonly top: HTMLDivElement
  private readonly body: HTMLDivElement
  private closed = false

  private socket: WebSocket | null = null
  private myId = 0
  private myName = ''
  private room: RoomState | null = null
  private lanUrls: string[] = []
  private stageCount = 4
  private menuEnter: ((input: HTMLInputElement) => void) | null = null

  // --- მიმდინარე ეტაპი ---
  private text = ''
  private builtStage = -1
  private typed = 0
  private errors = 0
  private startAt = 0
  private raceStarted = false
  private hurryUntil = 0
  private prevOrder: number[] = []
  private tickerTimer = 0
  private timer = 0

  constructor(options: TypingChampionOptions = {}) {
    this.onClose = options.onClose

    this.style = document.createElement('style')
    this.style.textContent = STYLE
    document.head.appendChild(this.style)

    this.root = document.createElement('div')
    this.root.className = 'tc-root'
    this.top = document.createElement('div')
    this.top.className = 'tc-top'
    this.body = document.createElement('div')
    this.body.className = 'tc-center'
    this.root.append(this.top, this.body)
    document.body.appendChild(this.root)

    window.addEventListener('keydown', this.onKeyDown, true)
    this.timer = window.setInterval(() => this.tick(), 200)
    this.showMenu()
  }

  // ---------------------------------------------------------------- ეკრანები

  private setTop(info: string) {
    this.top.innerHTML = `
      <div class="tc-title">⌨️ Typing <span>Champion</span></div>
      <div class="tc-info">${info}</div>
      <div class="tc-spacer"></div>
      <button class="tc-btn tc-ghost" type="button">✕ გასვლა (Esc)</button>
    `
    this.top.querySelector('button')?.addEventListener('click', () => this.close())
  }

  private setBody(className: string, html: string) {
    this.body.className = className
    this.body.innerHTML = html
  }

  private showMenu(error = '') {
    this.builtStage = -1
    this.room = null
    this.setTop('ბეჭდვის რბოლა ლოკალურ ქსელში · 2–4 მოთამაშე')
    this.setBody(
      'tc-center',
      `<div class="tc-card">
        <h2>🏁 მზად ხარ რბოლისთვის?</h2>
        <p>ბეჭდე სწრაფად და სწორად — რაც მეტს დაბეჭდავ, მით უფრო წინ წავა შენი მრბოლელი!</p>
        <label class="tc-field">შენი სახელი
          <input class="tc-input" data-name maxlength="14" placeholder="მაგ: ნინო" autocomplete="off">
        </label>
        <button class="tc-btn tc-green" data-host type="button" style="width:100%">🏠 ოთახის შექმნა (მასპინძელი)</button>
        <div class="tc-or">— ან —</div>
        <div class="tc-row">
          <input class="tc-input tc-code-input" data-code inputmode="numeric" placeholder="0000" autocomplete="off">
          <button class="tc-btn" data-join type="button">🚪 შესვლა კოდით</button>
        </div>
        <p class="tc-error">${escapeHtml(error)}</p>
        <p class="tc-small">ყველა კომპიუტერი ერთ Wi-Fi ქსელში უნდა იყოს. მასპინძელ კომპიუტერზე თამაში <b>npm run lan</b>-ით უნდა იყოს გაშვებული.</p>
      </div>`
    )
    const nameInput = this.body.querySelector<HTMLInputElement>('[data-name]')!
    const codeInput = this.body.querySelector<HTMLInputElement>('[data-code]')!
    const errorEl = this.body.querySelector<HTMLParagraphElement>('.tc-error')!
    nameInput.value = this.myName
    nameInput.focus()
    codeInput.addEventListener('input', () => {
      codeInput.value = codeInput.value.replace(/\D/g, '').slice(0, 4)
    })

    const readName = () => {
      const name = nameInput.value.trim()
      if (!name) {
        errorEl.textContent = 'ჯერ შენი სახელი ჩაწერე ✍️'
        nameInput.focus()
        return null
      }
      this.myName = name
      return name
    }
    const host = () => {
      const name = readName()
      if (name) this.connect({ t: 'host', name }, errorEl)
    }
    const join = () => {
      const name = readName()
      if (!name) return
      if (codeInput.value.length !== 4) {
        errorEl.textContent = 'ოთახის კოდი 4 ციფრია 🔢'
        codeInput.focus()
        return
      }
      this.connect({ t: 'join', name, code: codeInput.value }, errorEl)
    }
    this.body.querySelector('[data-host]')!.addEventListener('click', host)
    this.body.querySelector('[data-join]')!.addEventListener('click', join)
    // Enter-ს onKeyDown იჭერს (capture-ში), რადგან ველამდე მოვლენა აღარ მიდის
    this.menuEnter = (input) => {
      if (input === codeInput || codeInput.value.length === 4) join()
      else host()
    }
  }

  private showLobby() {
    const room = this.room!
    this.builtStage = -1
    this.menuEnter = null
    const isHost = room.hostId === this.myId
    this.setTop(`ოთახი ${room.code}`)
    const players = [...room.players].sort((a, b) => a.lane - b.lane)
    const items = players
      .map(
        (p) => `<li><span class="tc-dot" style="background:${LANE_COLORS[p.lane]}"></span>${escapeHtml(p.name)}
          <span class="tc-tag">${p.id === room.hostId ? '👑 მასპინძელი' : ''}${p.id === this.myId ? ' (შენ)' : ''}</span></li>`
      )
      .join('')
    const urls = this.lanUrls.length
      ? this.lanUrls.map((u) => `<b>${escapeHtml(u)}</b>`).join(' ან ')
      : '<b>ამ კომპიუტერის IP მისამართი</b>'
    const stageButtons = [3, 4, 5]
      .map((n) => {
        const words = Array.from({ length: n }, (_, i) => stageWordCount(i)).join('→')
        return `<button type="button" data-stages="${n}" class="${n === this.stageCount ? 'tc-on' : ''}">${n} ეტაპი<br><span class="tc-small">${words}</span></button>`
      })
      .join('')

    this.setBody(
      'tc-center',
      `<div class="tc-card">
        <h2>🏟️ ოთახის კოდი</h2>
        <div class="tc-code">${room.code}</div>
        <p class="tc-small">მეგობრებმა გახსნან ${urls} → სამჭედლო → Typing Champion → შესვლა კოდით.</p>
        <p>მოთამაშეები (${players.length}/4):</p>
        <ul class="tc-players">${items}</ul>
        ${
          isHost
            ? `<p>რამდენი ეტაპი იყოს?</p>
               <div class="tc-select">${stageButtons}</div>
               <button class="tc-btn tc-green" data-start type="button" style="width:100%" ${players.length < 2 ? 'disabled' : ''}>🏁 რბოლის დაწყება</button>
               <p class="tc-small">${players.length < 2 ? 'დაელოდე, სულ მცირე ერთი მეგობარი შემოვიდეს.' : 'ყველა მზადაა? დააჭირე დაწყებას!'}</p>`
            : `<p>⏳ დაელოდე, მასპინძელი რბოლას დაიწყებს...</p>`
        }
      </div>`
    )
    this.body.querySelectorAll<HTMLButtonElement>('[data-stages]').forEach((btn) =>
      btn.addEventListener('click', () => {
        this.stageCount = Number(btn.dataset.stages)
        this.showLobby()
      })
    )
    this.body.querySelector('[data-start]')?.addEventListener('click', () => {
      const stages = Array.from({ length: this.stageCount }, (_, i) => makeStageText(i))
      this.send({ t: 'start', stages })
    })
  }

  private buildRace(stage: number, stageCount: number, startsIn: number) {
    const vehicle = vehicleFor(stage)
    this.builtStage = stage
    this.typed = 0
    this.errors = 0
    this.raceStarted = false
    this.hurryUntil = 0
    this.prevOrder = []
    this.startAt = performance.now() + startsIn
    for (const p of this.room?.players ?? []) {
      p.chars = 0
      p.place = null
      p.finishMs = null
    }

    const words = this.text.split(' ').length
    this.setTop(
      `ეტაპი ${stage + 1}/${stageCount} · ${vehicle.icon} ${vehicle.name} · ${words} სიტყვა · ოთახი ${this.room?.code ?? ''}`
    )
    const lanes = [0, 1, 2, 3]
      .map(
        (lane) => `<div class="tc-lane tc-idle" data-lane="${lane}">
          <div class="tc-label"><span class="tc-rank">–</span><span class="tc-name">ცარიელი ზოლი</span></div>
          <div class="tc-lane-track">
            <div class="tc-racer" hidden style="color:${LANE_COLORS[lane]}">${vehicleSvg(vehicle.kind)}<div class="tc-racer-name"></div></div>
            <div class="tc-badge" hidden></div>
            <div class="tc-finish"></div>
          </div>
        </div>`
      )
      .join('')
    const chars = [...this.text].map((ch) => `<span>${ch === ' ' ? ' ' : escapeHtml(ch)}</span>`).join('')

    this.setBody(
      'tc-race',
      `<div class="tc-track tc-scene-${vehicle.kind}">${lanes}</div>
       <div class="tc-ticker"></div>
       <div class="tc-typing">
         <div class="tc-text">${chars}</div>
         <div class="tc-stats">
           <span>პროგრესი: <b data-stat="progress">0%</b></span>
           <span>სიჩქარე: <b data-stat="wpm">0</b> სიტყვა/წთ</span>
           <span>შეცდომა: <b data-stat="errors">0</b></span>
           <span class="tc-hint" data-stat="hint"></span>
         </div>
       </div>
       <div class="tc-overlay" data-overlay><div class="tc-count">3</div></div>`
    )
    this.renderText()
    this.updateLanes()
  }

  private showResults(final: boolean) {
    const room = this.room!
    const overlay = this.body.querySelector<HTMLDivElement>('[data-overlay]')
    if (!overlay) return
    overlay.hidden = false
    const players = room.players.filter((p) => !p.left)

    let html: string
    if (final) {
      const ranked = [...players].sort((a, b) => b.points - a.points || a.lane - b.lane)
      let place = 0
      let lastPoints = -1
      const rows = ranked
        .map((p, i) => {
          if (p.points !== lastPoints) place = i
          lastPoints = p.points
          return `<li><span class="tc-medal">${MEDALS[place] ?? ''}</span><span class="tc-dot" style="background:${LANE_COLORS[p.lane]}"></span>
            ${escapeHtml(p.name)}${p.id === this.myId ? ' (შენ)' : ''}<span class="tc-score">${p.points} ქულა</span></li>`
        })
        .join('')
      const champion = ranked[0]
      const isHost = room.hostId === this.myId
      html = `<div class="tc-card">
        <h2>🏆 ჩემპიონი: ${escapeHtml(champion?.name ?? '')}!</h2>
        <p>ყველა ეტაპის ქულების ჯამი (1 ადგილი = 4 ქულა, 2 = 3, 3 = 2, 4 = 1):</p>
        <ul class="tc-results">${rows}</ul>
        <div class="tc-row">
          ${isHost ? '<button class="tc-btn tc-green" data-again type="button">🔁 ხელახლა თამაში</button>' : '<p>მასპინძელს შეუძლია ახალი რბოლის დაწყება.</p>'}
          <button class="tc-btn tc-orange" data-exit type="button">🚪 გასვლა</button>
        </div>
      </div>`
    } else {
      const ranked = [...players].sort(
        (a, b) => (a.place ?? 99) - (b.place ?? 99) || b.chars - a.chars || a.lane - b.lane
      )
      const total = [...this.text].length
      const rows = ranked
        .map((p) => {
          const result =
            p.place !== null
              ? `${((p.finishMs ?? 0) / 1000).toFixed(1)} წმ`
              : `ვერ მოასწრო (${Math.round((p.chars / total) * 100)}%)`
          return `<li><span class="tc-medal">${p.place ? MEDALS[p.place - 1] : '⏱️'}</span><span class="tc-dot" style="background:${LANE_COLORS[p.lane]}"></span>
            ${escapeHtml(p.name)} <span class="tc-small">${result}</span><span class="tc-score">${p.points} ქულა</span></li>`
        })
        .join('')
      const next = vehicleFor(room.stage + 1)
      html = `<div class="tc-card">
        <h2>✅ ეტაპი ${room.stage + 1} დასრულდა!</h2>
        <ul class="tc-results">${rows}</ul>
        <p class="tc-next">შემდეგი ეტაპი: ${next.icon} <b>${next.name}</b> · ${stageWordCount(room.stage + 1)} სიტყვა
          — <span data-next>${RESULTS_SECONDS}</span> წამში</p>
      </div>`
      const shownAt = performance.now()
      this.startAt = shownAt + RESULTS_SECONDS * 1000
    }
    overlay.innerHTML = html
    overlay.querySelector('[data-again]')?.addEventListener('click', () => this.send({ t: 'lobby' }))
    overlay.querySelector('[data-exit]')?.addEventListener('click', () => this.close())
  }

  // ---------------------------------------------------------------- რბოლის განახლება

  private ranking(): NetPlayer[] {
    const players = (this.room?.players ?? []).filter((p) => !p.left)
    return players.sort((a, b) => (a.place ?? 99) - (b.place ?? 99) || b.chars - a.chars || a.lane - b.lane)
  }

  private updateLanes() {
    const room = this.room
    if (!room || this.builtStage < 0) return
    const total = [...this.text].length || 1
    const order = this.ranking()
    const racing = room.phase === 'race'

    for (let lane = 0; lane < 4; lane++) {
      const el = this.body.querySelector<HTMLDivElement>(`[data-lane="${lane}"]`)
      if (!el) continue
      const player = room.players.find((p) => p.lane === lane)
      const racer = el.querySelector<HTMLDivElement>('.tc-racer')!
      const badge = el.querySelector<HTMLDivElement>('.tc-badge')!
      const rankEl = el.querySelector<HTMLSpanElement>('.tc-rank')!
      const nameEl = el.querySelector<HTMLSpanElement>('.tc-name')!

      el.classList.toggle('tc-empty', !player)
      el.classList.toggle('tc-me', player?.id === this.myId)
      el.classList.toggle('tc-gone', !!player?.left)
      if (!player) {
        racer.hidden = true
        badge.hidden = true
        continue
      }
      const chars = player.id === this.myId ? Math.max(this.typed, player.chars) : player.chars
      const progress = Math.min(1, chars / total)
      const rank = order.indexOf(player) + 1

      racer.hidden = false
      racer.style.left = `calc((100% - 100px) * ${progress})`
      racer.querySelector('.tc-racer-name')!.textContent = player.name
      nameEl.textContent = player.left ? `${player.name} (გავიდა)` : player.name + (player.id === this.myId ? ' (შენ)' : '')
      rankEl.textContent = player.left ? '–' : rank === 1 && chars > 0 ? '👑' : String(rank)
      el.classList.toggle('tc-idle', !racing || player.place !== null || player.left)

      if (player.place !== null) {
        badge.hidden = false
        badge.textContent = `${MEDALS[player.place - 1] ?? ''} ${((player.finishMs ?? 0) / 1000).toFixed(1)} წმ`
      } else {
        badge.hidden = true
      }
    }

    if (racing) this.detectOvertakes(order)
  }

  private detectOvertakes(order: NetPlayer[]) {
    const ids = order.map((p) => p.id)
    const prev = this.prevOrder
    this.prevOrder = ids
    // პირველ წამებში ყველა ერთად იწყებს — ეს "გასწრება" არ არის
    if (prev.length === 0 || performance.now() - this.startAt < 1500) return
    for (let i = 0; i < ids.length; i++) {
      const passer = order[i]
      const before = prev.indexOf(passer.id)
      if (before <= i || before < 0) continue
      // ვინ დარჩა უკან: ვინც ადრე passer-ის წინ იყო და ახლა უკანაა
      const passedId = prev.slice(i, before).find((id) => ids.indexOf(id) > i)
      const passed = order.find((p) => p.id === passedId)
      if (!passed) continue
      const text =
        i === 0
          ? `👑 ${passer.name} ლიდერი გახდა! (გაასწრო: ${passed.name})`
          : `⚡ ${passer.name} წინ გავიდა! (გაასწრო: ${passed.name})`
      this.setTicker(text)
      return
    }
  }

  private setTicker(text: string) {
    const ticker = this.body.querySelector<HTMLDivElement>('.tc-ticker')
    if (!ticker) return
    ticker.textContent = text
    ticker.style.opacity = '1'
    window.clearTimeout(this.tickerTimer)
    this.tickerTimer = window.setTimeout(() => {
      ticker.style.opacity = '0'
    }, 2200)
  }

  private renderText(wrong = false) {
    const box = this.body.querySelector<HTMLDivElement>('.tc-text')
    if (!box) return
    const spans = box.children
    for (let i = 0; i < spans.length; i++) {
      const span = spans[i] as HTMLSpanElement
      span.className = i < this.typed ? 'tc-done' : i === this.typed ? 'tc-cur' : ''
      if (i === this.typed) {
        if (this.text[i] === ' ') span.classList.add('tc-space')
        if (wrong) span.classList.add('tc-wrong')
        // მიმდინარე ასო ყოველთვის ჩანდეს გრძელ ტექსტშიც
        const top = span.offsetTop - box.offsetTop
        if (top > box.scrollTop + box.clientHeight - 40 || top < box.scrollTop) box.scrollTop = top - 40
      }
    }
    const total = this.text.length
    const set = (name: string, value: string) => {
      const el = this.body.querySelector(`[data-stat="${name}"]`)
      if (el) el.textContent = value
    }
    set('progress', `${Math.round((this.typed / total) * 100)}%`)
    set('errors', String(this.errors))
    const next = this.text[this.typed]
    set(
      'hint',
      next === undefined ? '🏁 ფინიში!' : next === ' ' ? 'შემდეგი: ჰარი (Space)' : `შემდეგი: ${next}  →  კლავიში ${KA_TO_KEY[next] ?? next}`
    )
  }

  private tick() {
    const room = this.room
    if (!room || this.builtStage < 0) return
    const now = performance.now()
    const overlay = this.body.querySelector<HTMLDivElement>('[data-overlay]')

    if (room.phase === 'countdown' || (room.phase === 'race' && !this.raceStarted)) {
      const left = Math.ceil((this.startAt - now) / 1000)
      if (left > 0) {
        const count = overlay?.querySelector('.tc-count')
        if (count && count.textContent !== String(left)) count.textContent = String(left)
      } else if (!this.raceStarted) {
        this.raceStarted = true
        if (overlay) overlay.hidden = true
        this.setTicker('🚦 წადი! ბეჭდე რაც შეიძლება სწრაფად!')
      }
    }

    if (room.phase === 'race' && this.raceStarted) {
      const minutes = (now - this.startAt) / 60000
      const doneWords = this.text.slice(0, this.typed).split(' ').length - 1 + (this.typed >= this.text.length ? 1 : 0)
      const me = room.players.find((p) => p.id === this.myId)
      if (minutes > 0.02 && me?.place === null) {
        const el = this.body.querySelector('[data-stat="wpm"]')
        if (el) el.textContent = String(Math.round(doneWords / minutes))
      }
      if (this.hurryUntil > 0 && me?.place === null) {
        const left = Math.max(0, Math.ceil((this.hurryUntil - now) / 1000))
        const ticker = this.body.querySelector<HTMLDivElement>('.tc-ticker')
        if (ticker && left <= 15) {
          ticker.textContent = `⏱️ ${left} წამი დარჩა — იჩქარე!`
          ticker.style.opacity = '1'
        }
      }
    }

    if (room.phase === 'results') {
      const el = overlay?.querySelector('[data-next]')
      if (el) el.textContent = String(Math.max(0, Math.ceil((this.startAt - now) / 1000)))
    }
  }

  // ---------------------------------------------------------------- კლავიატურა

  private onKeyDown = (event: KeyboardEvent) => {
    // სამყაროს კლავიშები (WASD, E...) თამაშის დროს არ უნდა მუშაობდეს
    event.stopPropagation()
    if (event.code === 'Escape') {
      event.preventDefault()
      this.close()
      return
    }
    if (event.target instanceof HTMLInputElement) {
      if (event.key === 'Enter' && this.menuEnter) {
        event.preventDefault()
        this.menuEnter(event.target)
      }
      return
    }
    const room = this.room
    if (!room || room.phase !== 'race' || !this.raceStarted || this.builtStage !== room.stage) return
    if (event.key === ' ' || event.key === 'Backspace') event.preventDefault()
    if (event.ctrlKey || event.altKey || event.metaKey) return
    if (event.key.length !== 1) return

    const me = room.players.find((p) => p.id === this.myId)
    if (!me || me.place !== null || this.typed >= this.text.length) return

    const target = this.text[this.typed]
    // ლათინურ კლავიშზე Shift წყვეტს, რომელი ასოა (T = თ, t = ტ); ჩართული CapsLock ხელს არ უშლის
    const key = /^[a-z]$/i.test(event.key)
      ? event.shiftKey
        ? event.key.toUpperCase()
        : event.key.toLowerCase()
      : event.key
    const typed = keyToChar(key)
    if (typed === target || event.key === target) {
      this.typed++
      // საკუთარ პროგრესს სერვერის პასუხს არ ველოდებით — ადგილიც მაშინვე უნდა განახლდეს
      me.chars = this.typed
      this.renderText()
      this.send({ t: 'progress', chars: this.typed })
      this.updateLanes()
    } else {
      this.errors++
      this.renderText(true)
      const box = this.body.querySelector<HTMLDivElement>('.tc-typing')
      box?.classList.remove('tc-shake')
      void box?.offsetWidth
      box?.classList.add('tc-shake')
    }
  }

  // ---------------------------------------------------------------- ქსელი

  private connect(first: object, errorEl: HTMLElement) {
    if (this.socket) return
    errorEl.textContent = '🔌 ვუკავშირდები...'
    const protocol = location.protocol === 'https:' ? 'wss' : 'ws'
    let opened = false
    let socket: WebSocket
    try {
      socket = new WebSocket(`${protocol}://${location.host}${WS_PATH}`)
    } catch {
      errorEl.textContent = 'კავშირი ვერ დამყარდა.'
      return
    }
    this.socket = socket
    socket.addEventListener('open', () => {
      opened = true
      socket.send(JSON.stringify(first))
    })
    socket.addEventListener('message', (e) => {
      try {
        this.onMessage(JSON.parse(String(e.data)) as ServerMessage)
      } catch (err) {
        console.warn('Typing Champion: ცუდი შეტყობინება', err)
      }
    })
    socket.addEventListener('close', () => {
      if (this.socket !== socket || this.closed) return
      this.socket = null
      const wasInRoom = this.room !== null
      this.room = null
      this.myId = 0
      if (!opened) {
        this.showMenu(
          'LAN სერვერი ვერ მოიძებნა. მასპინძელ კომპიუტერზე თამაში "npm run lan"-ით უნდა გაეშვას და ყველამ მისი მისამართი გახსნას.'
        )
      } else if (wasInRoom) {
        this.showMenu('კავშირი გაწყდა 😕 სცადე თავიდან.')
      }
    })
  }

  private send(msg: object) {
    if (this.socket?.readyState === WebSocket.OPEN) this.socket.send(JSON.stringify(msg))
  }

  private onMessage(msg: ServerMessage) {
    switch (msg.t) {
      case 'hello':
        this.lanUrls = msg.lanUrls
        break
      case 'joined':
        this.myId = msg.id
        break
      case 'error': {
        // შეცდომის შემდეგ კავშირს ვხურავთ, რომ თავიდან ცდა სუფთად დაიწყოს
        const socket = this.socket
        this.socket = null
        socket?.close()
        this.showMenu(msg.msg)
        break
      }
      case 'stage':
        this.text = msg.text
        this.buildRace(msg.stage, msg.stageCount, msg.startsIn)
        break
      case 'progress': {
        if (msg.id === this.myId) break
        const player = this.room?.players.find((p) => p.id === msg.id)
        if (player) {
          player.chars = msg.chars
          this.updateLanes()
        }
        break
      }
      case 'hurry':
        this.hurryUntil = performance.now() + msg.seconds * 1000
        break
      case 'room': {
        const prevPhase = this.room?.phase
        const state: RoomState = {
          code: msg.code,
          hostId: msg.hostId,
          phase: msg.phase,
          stage: msg.stage,
          stageCount: msg.stageCount,
          players: msg.players,
        }
        this.room = state
        const me = state.players.find((p) => p.id === this.myId)
        if (me && me.place === null && this.builtStage === state.stage) me.chars = Math.max(me.chars, this.typed)
        if (state.phase === 'lobby') {
          this.showLobby()
        } else if (state.phase === 'countdown' || state.phase === 'race') {
          this.updateLanes()
        } else if (state.phase !== prevPhase) {
          this.updateLanes()
          this.showResults(state.phase === 'final')
        } else if (state.phase === 'final') {
          // ფინალში ვინმე გავიდა — სია განვაახლოთ
          this.showResults(true)
        }
        break
      }
    }
  }

  close() {
    if (this.closed) return
    this.closed = true
    window.removeEventListener('keydown', this.onKeyDown, true)
    window.clearInterval(this.timer)
    window.clearTimeout(this.tickerTimer)
    const socket = this.socket
    this.socket = null
    socket?.close()
    this.root.remove()
    this.style.remove()
    this.onClose?.()
  }
}
