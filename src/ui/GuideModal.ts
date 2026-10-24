/**
 * სახელმძღვანელო ფანჯარა: დიდი ტექსტი და ერთადერთი ღილაკი "კარგი".
 * ღილაკი რამდენიმე წამში (ნაგულისხმევად 4) აქტიურდება; სანამ არ დააჭერენ, ფანჯარა არ ქრება
 * (Esc და ფონზე დაჭერა არ ხურავს).
 */

export interface GuideModalOptions {
  text: string
  icon?: string
  /** რამდენ წამში გააქტიურდეს ღილაკი */
  seconds?: number
}

export function showGuideModal(options: GuideModalOptions): Promise<void> {
  const seconds = options.seconds ?? 4

  return new Promise(resolve => {
    const overlay = document.createElement('div')
    overlay.className = 'guide-modal'
    overlay.style.cssText = `
      position: fixed;
      inset: 0;
      z-index: 50000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      background: rgba(10, 20, 36, 0.78);
      backdrop-filter: blur(6px);
      font-family: Arial, sans-serif;
    `

    const card = document.createElement('div')
    card.style.cssText = `
      width: min(980px, 96vw);
      box-sizing: border-box;
      padding: clamp(24px, 5vw, 56px);
      border: 3px solid rgba(255, 255, 255, 0.8);
      border-radius: 32px;
      background: linear-gradient(145deg, #fff8e7, #e6f4ff);
      color: #17406f;
      text-align: center;
      box-shadow: 0 30px 90px rgba(0, 0, 0, 0.5);
    `

    if (options.icon) {
      const icon = document.createElement('div')
      icon.textContent = options.icon
      icon.style.cssText = 'font-size: clamp(56px, 10vw, 96px); line-height: 1; margin-bottom: 12px;'
      card.appendChild(icon)
    }

    const text = document.createElement('div')
    text.textContent = options.text
    text.style.cssText = `
      margin: 0 auto clamp(24px, 4vw, 44px);
      font-size: clamp(38px, 7vw, 76px);
      font-weight: 900;
      line-height: 1.25;
      text-shadow: 0 3px 0 rgba(255, 255, 255, 0.8);
    `
    card.appendChild(text)

    const button = document.createElement('button')
    button.type = 'button'
    button.textContent = 'კარგი'
    button.disabled = true
    button.style.cssText = `
      position: relative;
      overflow: hidden;
      min-width: min(360px, 80vw);
      padding: 18px 48px;
      border: 0;
      border-radius: 20px;
      background: #aab6c4;
      color: #ffffff;
      font-family: inherit;
      font-size: clamp(28px, 4vw, 40px);
      font-weight: 900;
      cursor: not-allowed;
      box-shadow: 0 8px 0 rgba(0, 0, 0, 0.12);
    `

    // ავსებადი ზოლი ღილაკში: ეჩვენება, რამდენი დარჩა გააქტიურებამდე
    const fill = document.createElement('div')
    fill.style.cssText = `
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 0%;
      background: rgba(39, 131, 74, 0.55);
      pointer-events: none;
    `
    button.appendChild(fill)

    const label = document.createElement('span')
    label.textContent = 'კარგი'
    label.style.cssText = 'position: relative;'
    button.textContent = ''
    button.append(fill, label)

    const hint = document.createElement('div')
    hint.style.cssText = 'margin-top: 16px; min-height: 24px; color: #536579; font-size: 18px; font-weight: bold;'
    hint.textContent = `მოიცადე ${seconds}…`

    card.append(button, hint)
    overlay.appendChild(card)
    document.body.appendChild(overlay)

    // ფანჯრის გახსნისას თამაშის კლავიშები არ უნდა მუშაობდეს (მხოლოდ ღილაკის Enter/Space)
    const blockKeys = (event: KeyboardEvent) => {
      if (event.target === button && !button.disabled && (event.code === 'Enter' || event.code === 'Space')) return
      event.preventDefault()
      event.stopPropagation()
    }
    window.addEventListener('keydown', blockKeys, true)

    let finished = false
    const started = performance.now()
    const timer = window.setInterval(() => {
      const elapsed = (performance.now() - started) / 1000
      const progress = Math.min(1, elapsed / seconds)
      fill.style.width = `${progress * 100}%`

      if (progress < 1) {
        hint.textContent = `მოიცადე ${Math.max(1, Math.ceil(seconds - elapsed))}…`
        return
      }

      window.clearInterval(timer)
      button.disabled = false
      button.style.background = '#27a35a'
      button.style.cursor = 'pointer'
      button.style.boxShadow = '0 8px 0 #1b7a41, 0 14px 26px rgba(0, 0, 0, 0.25)'
      fill.style.width = '0%'
      hint.textContent = 'დააჭირე „კარგი“ ღილაკს'
      button.focus?.()
    }, 100)

    button.addEventListener('click', () => {
      if (button.disabled || finished) return
      finished = true
      window.clearInterval(timer)
      window.removeEventListener('keydown', blockKeys, true)
      overlay.remove()
      resolve()
    })
  })
}
