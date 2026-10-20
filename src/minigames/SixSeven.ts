/**
 * 6 7 — "ხუმრობა-თამაში": ეკრანზე უბრალოდ წერია 6 7 და ყველაფერი ქანაობს.
 * არც ქულაა, არც მიზანი — წიგნები უბრალოდ დაიხარჯა 😄
 */

export interface SixSevenOptions {
  onClose?: () => void
}

export class SixSeven {
  private readonly onClose: (() => void) | undefined
  private readonly root: HTMLDivElement
  private readonly style: HTMLStyleElement
  private closed = false

  constructor(options: SixSevenOptions = {}) {
    this.onClose = options.onClose

    this.style = document.createElement('style')
    this.style.textContent = `
      .sx-root {
        position: fixed; inset: 0; z-index: 2000; overflow: hidden;
        display: flex; align-items: center; justify-content: center;
        background: radial-gradient(circle at 50% 40%, #ffe066, #ff7a3d 55%, #c2185b);
        font-family: Arial, sans-serif;
      }
      .sx-stage {
        display: flex; flex-direction: column; align-items: center; gap: 18px;
        animation: sx-sway 1.6s ease-in-out infinite;
        transform-origin: 50% 120%;
      }
      .sx-numbers { display: flex; gap: clamp(24px, 6vw, 80px); }
      .sx-num {
        font-size: clamp(140px, 30vw, 340px); font-weight: 900; line-height: 1;
        color: #ffffff;
        text-shadow: 0 10px 0 #7a1240, 0 22px 40px rgba(0, 0, 0, 0.35);
        animation: sx-bob 0.8s ease-in-out infinite;
      }
      .sx-num.sx-seven { animation-delay: -0.4s; }
      .sx-caption {
        font-size: clamp(18px, 2.6vw, 26px); font-weight: 900; color: #fff6d8;
        text-shadow: 0 3px 0 rgba(0, 0, 0, 0.25);
      }
      .sx-exit {
        position: absolute; top: 16px; right: 16px; z-index: 5;
        padding: 10px 16px; border: 0; border-radius: 12px;
        background: rgba(255, 255, 255, 0.9); color: #7a1240;
        font-size: 15px; font-weight: 900; cursor: pointer;
      }
      @keyframes sx-sway {
        0%, 100% { transform: rotate(-9deg) translateX(-4vw); }
        50% { transform: rotate(9deg) translateX(4vw); }
      }
      @keyframes sx-bob {
        0%, 100% { transform: translateY(-6%); }
        50% { transform: translateY(6%); }
      }
      @media (prefers-reduced-motion: reduce) {
        .sx-stage { animation-duration: 4s; }
        .sx-num { animation-duration: 2s; }
      }
    `
    document.head.appendChild(this.style)

    this.root = document.createElement('div')
    this.root.className = 'sx-root'
    this.root.innerHTML = `
      <button class="sx-exit" type="button">✕ გასვლა (Esc)</button>
      <div class="sx-stage">
        <div class="sx-numbers">
          <span class="sx-num">6</span>
          <span class="sx-num sx-seven">7</span>
        </div>
        <div class="sx-caption">ეს არის მთელი თამაში 🤷</div>
      </div>
    `
    this.root.querySelector('.sx-exit')?.addEventListener('click', () => this.close())
    document.body.appendChild(this.root)

    window.addEventListener('keydown', this.onKeyDown, true)
  }

  private onKeyDown = (event: KeyboardEvent) => {
    // თამაშის კლავიშები (WASD, E, T...) ამ დროს არ უნდა მუშაობდეს
    event.stopPropagation()
    if (event.code === 'Escape') {
      event.preventDefault()
      this.close()
    }
  }

  close() {
    if (this.closed) return
    this.closed = true
    window.removeEventListener('keydown', this.onKeyDown, true)
    this.root.remove()
    this.style.remove()
    this.onClose?.()
  }
}
