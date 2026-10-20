import { ECONOMY } from './economy'

/**
 * მოთამაშის პროგრესი ინახება sessionStorage-ში:
 *  - გვერდის განახლებას (F5) უძლებს,
 *  - ბრაუზერის დახურვისას იშლება (Chrome-ის guest რეჟიმში ყოველი გაკვეთილი თავიდან იწყება).
 */
const KEY = 'digital-kingdom-session-v1'

/** გადატვირთვის შემდეგ ძველი პროგრესი მხოლოდ ამ დროით რჩება (3 საათი) */
const MAX_AGE_MS = 3 * 60 * 60 * 1000

/**
 * ახალი სესიის წესი:
 *  - გვერდის ახლიდან გახსნა (მისამართით, ახალი ჩანართი, ბმულზე გადასვლა) = ყოველთვის სუფთა დასაწყისი;
 *  - მხოლოდ F5 / გადატვირთვა ინარჩუნებს პროგრესს (რომ შემთხვევით არ დაიკარგოს).
 * ეს გადაწყვეტილება გვერდის ჩატვირთვაზე მხოლოდ ერთხელ მიიღება.
 */
let bootDecided = false

function isPageReload(): boolean {
  try {
    const nav = performance.getEntriesByType('navigation')[0] as
      | PerformanceNavigationTiming
      | undefined
    return nav?.type === 'reload'
  } catch {
    return false
  }
}

export interface SessionData {
  version: 1
  /** ბოლო შენახვის დრო (ms) */
  savedAt: number
  coins: number
  books: number
  unlockedGames: string[]
  openedTopics: string[]
  /** თემის id -> სწორად პასუხგაცემული კითხვების id-ები (ჯილდო ყოველ კითხვაზე ერთხელ) */
  solved: Record<string, string[]>
  /** სამჭედლოს მისალმების ტექსტი ამ სესიაში უკვე ნაჩვენებია */
  forgeIntroSeen: boolean
  /** "თემა:წრე" -> კითხვების შემთხვევითი მიმდევრობა (ყოველ მოსწავლეს თავისი, სესიის განმავლობაში უცვლელი) */
  quizOrder: Record<string, string[]>
  /** სტატისტიკა გაკვეთილის შემდეგ ეკონომიკის დასარეგულირებლად */
  stats: {
    typingCoins: number
    quizBooks: number
    coinsExchanged: number
    booksSpentOnGames: number
  }
}

function emptyData(): SessionData {
  return {
    version: 1,
    savedAt: Date.now(),
    coins: 0,
    books: 0,
    unlockedGames: [],
    openedTopics: [],
    solved: {},
    forgeIntroSeen: false,
    quizOrder: {},
    stats: { typingCoins: 0, quizBooks: 0, coinsExchanged: 0, booksSpentOnGames: 0 },
  }
}

export class GameState {
  private data: SessionData
  private readonly listeners = new Set<() => void>()

  constructor() {
    this.data = this.load()
  }

  private load(): SessionData {
    try {
      const raw = sessionStorage.getItem(KEY)

      if (!bootDecided) {
        bootDecided = true
        const parsedAge = raw ? Date.now() - ((JSON.parse(raw) as Partial<SessionData>).savedAt ?? 0) : 0
        if (!isPageReload() || parsedAge > MAX_AGE_MS) {
          // ახალი გახსნა ან ძალიან ძველი ჩანაწერი — თავიდან ვიწყებთ
          sessionStorage.removeItem(KEY)
          return emptyData()
        }
      }

      if (raw) {
        const parsed = JSON.parse(raw) as Partial<SessionData>
        if (parsed && parsed.version === 1) {
          const base = emptyData()
          return {
            ...base,
            ...parsed,
            stats: { ...base.stats, ...(parsed.stats ?? {}) },
          } as SessionData
        }
      }
    } catch {
      // დაზიანებული ჩანაწერი — თავიდან ვიწყებთ
    }
    return emptyData()
  }

  private save() {
    this.data.savedAt = Date.now()
    try {
      sessionStorage.setItem(KEY, JSON.stringify(this.data))
    } catch {
      // შენახვა ვერ მოხერხდა (მაგ. სივრცე ამოიწურა) — თამაში მაინც გრძელდება
    }
    for (const listener of this.listeners) listener()
  }

  onChange(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  get coins(): number {
    return this.data.coins
  }

  get books(): number {
    return this.data.books
  }

  get stats(): SessionData['stats'] {
    return this.data.stats
  }

  get forgeIntroSeen(): boolean {
    return this.data.forgeIntroSeen
  }

  markForgeIntroSeen() {
    if (this.data.forgeIntroSeen) return
    this.data.forgeIntroSeen = true
    this.save()
  }

  /** ყველაფრის განულება (ახალი გაკვეთილი/ახალი მოსწავლე) */
  reset() {
    this.data = emptyData()
    this.save()
  }

  hasProgress(): boolean {
    return (
      this.data.coins > 0 ||
      this.data.books > 0 ||
      this.data.unlockedGames.length > 0 ||
      this.data.openedTopics.length > 0
    )
  }

  // ---------- მონეტები და წიგნები ----------

  addTypingCoins(amount: number) {
    if (amount <= 0) return
    this.data.coins += amount
    this.data.stats.typingCoins += amount
    this.save()
  }

  addQuizBooks(amount: number) {
    if (amount <= 0) return
    this.data.books += amount
    this.data.stats.quizBooks += amount
    this.save()
  }

  /** ცვლის `count` წიგნს მონეტებში; true, თუ მონეტები ეყო */
  exchangeBooks(count: number): boolean {
    const cost = count * ECONOMY.COINS_PER_BOOK
    if (count <= 0 || this.data.coins < cost) return false
    this.data.coins -= cost
    this.data.books += count
    this.data.stats.coinsExchanged += cost
    this.save()
    return true
  }

  /** ცვლის ყველა შესაძლებელ მონეტას; აბრუნებს მიღებული წიგნების რაოდენობას */
  exchangeAll(): number {
    const count = Math.floor(this.data.coins / ECONOMY.COINS_PER_BOOK)
    if (count > 0) this.exchangeBooks(count)
    return count
  }

  // ---------- თამაშები ----------

  isGameUnlocked(id: string): boolean {
    return this.data.unlockedGames.includes(id)
  }

  /** ხსნის თამაშს წიგნებით; true, თუ წიგნები ეყო და თამაში გაიხსნა */
  unlockGame(id: string): boolean {
    if (this.isGameUnlocked(id)) return true
    if (this.data.books < ECONOMY.BOOKS_PER_GAME) return false
    this.data.books -= ECONOMY.BOOKS_PER_GAME
    this.data.stats.booksSpentOnGames += ECONOMY.BOOKS_PER_GAME
    this.data.unlockedGames.push(id)
    this.save()
    return true
  }

  // ---------- თემები და კითხვები ----------

  openedTopicIds(): string[] {
    return [...this.data.openedTopics]
  }

  isTopicOpened(id: string): boolean {
    return this.data.openedTopics.includes(id)
  }

  openTopic(id: string) {
    if (this.isTopicOpened(id)) return
    this.data.openedTopics.push(id)
    this.save()
  }

  /**
   * ქვიზის კითხვების შემთხვევითი მიმდევრობა. ერთხელ დგინდება და სესიაში არ იცვლება,
   * ამიტომ მეზობლებს კითხვები სხვადასხვა რიგით აქვთ და "პირველის პასუხი" ერთმანეთს არ გამოადგებათ.
   */
  quizOrderFor(topicId: string, round: number, ids: string[]): string[] {
    const key = `${topicId}:${round}`
    const saved = this.data.quizOrder[key]
    const valid =
      saved && saved.length === ids.length && ids.every(id => saved.includes(id))
    if (valid) return [...saved]

    const order = [...ids]
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[order[i], order[j]] = [order[j], order[i]]
    }
    this.data.quizOrder[key] = order
    this.save()
    return [...order]
  }

  isSolved(topicId: string, questionId: string): boolean {
    return (this.data.solved[topicId] ?? []).includes(questionId)
  }

  /** აღნიშნავს კითხვას გადაწყვეტილად. true მხოლოდ პირველად (ჯილდო მხოლოდ ერთხელ) */
  markSolved(topicId: string, questionId: string): boolean {
    if (this.isSolved(topicId, questionId)) return false
    const list = this.data.solved[topicId] ?? []
    list.push(questionId)
    this.data.solved[topicId] = list
    this.save()
    return true
  }
}
