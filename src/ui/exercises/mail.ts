import type { SimTask } from '../../content/topics'
import { btn, css, el, guardKeys, shake, taskRunner, EMOJI_FONT, type ExerciseCtx } from './dom'

/**
 * მინი ელფოსტა (Outlook-ის მსგავსი): New Message, To, Subject, ტექსტი, 📎, Send, Inbox, Sent Items.
 * დავალებები config-იდან თვითონ იწყობა; პირობები მდგომარეობით მოწმდება.
 */

interface MailConfig {
  /** ადრესატის მისამართი, რომელიც მოსწავლემ უნდა აკრიფოს */
  to?: string
  toName?: string
  /** საჭიროა თუ არა ფაილის მიმაგრება */
  attach?: boolean
  /** გაგზავნის შემდეგ პასუხი მოდის და Sent / Inbox უნდა გაიხსნას */
  reply?: boolean
}

interface Letter {
  from: string
  to: string
  subject: string
  body: string
  file?: string
  unread?: boolean
}

css(
  'mail',
  `
.ml { display: flex; height: var(--ex-h, 340px); border-radius: 14px; overflow: hidden; border: 3px solid #26364a; background: #fff; font-size: 13px; line-height: 1.4; color: #1d2733; font-family: Arial, ${EMOJI_FONT}; }
.ml * { box-sizing: border-box; }
.ml button { font: inherit; cursor: pointer; }
.ml-side { flex: 0 0 132px; display: flex; flex-direction: column; gap: 5px; padding: 8px; background: #0f5aa8; }
.ml-logo { color: #fff; font-weight: 900; font-size: 14px; margin-bottom: 2px; }
.ml-new { border: 0; border-radius: 9px; padding: 8px 6px; background: #ffd24a; color: #26364a; font-weight: 900; box-shadow: 0 3px 0 rgba(0,0,0,0.2); }
.ml-new:hover { background: #ffe07d; }
.ml-folder { display: flex; justify-content: space-between; gap: 4px; border: 0; border-radius: 8px; padding: 7px 8px; background: transparent; color: #fff; font-weight: 700; text-align: left; }
.ml-folder:hover { background: rgba(255,255,255,0.16); }
.ml-folder.on { background: rgba(255,255,255,0.28); }
.ml-num { min-width: 1.5em; padding: 0 5px; border-radius: 999px; background: #ffd24a; color: #26364a; font-weight: 900; text-align: center; }
.ml-main { flex: 1; min-width: 0; display: flex; flex-direction: column; padding: 8px 10px; overflow-y: auto; gap: 6px; }
.ml-h { font-weight: 900; font-size: 14px; color: #0f5aa8; }
.ml-item { display: grid; gap: 1px; width: 100%; padding: 7px 9px; border: 1px solid #d5dee8; border-left: 5px solid #c9d6e4; border-radius: 8px; background: #f8fbfe; text-align: left; color: inherit; }
.ml-item:hover { background: #e8f2fc; }
.ml-item.unread { border-left-color: #0f5aa8; font-weight: 800; }
.ml-sub { color: #5b6c7d; font-size: 12px; font-weight: 400; }
.ml-field { display: flex; align-items: center; gap: 6px; }
.ml-field label { flex: 0 0 66px; font-weight: 800; color: #536579; }
.ml-field input { flex: 1; min-width: 0; padding: 6px 8px; border: 2px solid #c9d6e4; border-radius: 8px; font: inherit; font-size: 14px; }
.ml-field input:focus, .ml-text:focus { outline: 0; border-color: #0f5aa8; }
.ml-field input.ok { border-color: #38a169; background: #f2fbf5; }
.ml-at { flex: 0 0 auto; border: 2px solid #c9d6e4; border-radius: 8px; background: #f3f7fb; font-weight: 900; padding: 4px 9px; }
.ml-text { flex: 1; min-height: 70px; resize: none; padding: 7px 8px; border: 2px solid #c9d6e4; border-radius: 8px; font: inherit; font-size: 14px; }
.ml-text.ok { border-color: #38a169; }
.ml-bar { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; position: relative; }
.ml-send { border: 0; border-radius: 9px; padding: 8px 18px; background: #0f5aa8; color: #fff; font-weight: 900; box-shadow: 0 3px 0 rgba(0,0,0,0.2); }
.ml-send:hover { background: #1a70c9; }
.ml-clip { border: 2px solid #c9d6e4; border-radius: 9px; padding: 6px 10px; background: #fff; font-weight: 800; }
.ml-clip:hover { border-color: #0f5aa8; }
.ml-filechip { padding: 3px 9px; border-radius: 999px; background: #e3f8ea; border: 1px solid #a9dcbc; font-weight: 800; }
.ml-pick { position: absolute; left: 80px; bottom: 38px; z-index: 5; display: grid; gap: 3px; padding: 6px; border-radius: 10px; background: #fff; box-shadow: 0 8px 26px rgba(0,0,0,0.35); border: 1px solid #c9d6e4; }
.ml-pick button { border: 0; border-radius: 7px; padding: 6px 9px; background: #f3f7fb; text-align: left; font-weight: 700; }
.ml-pick button:hover { background: #dbeafb; }
.ml-read { padding: 8px 10px; border-radius: 10px; background: #f8fbfe; border: 1px solid #d5dee8; white-space: pre-wrap; }
.ml-meta { color: #5b6c7d; font-size: 12px; }
.ml-empty { margin: auto; color: #6b7c8f; font-weight: 700; text-align: center; }
.ml-toast { align-self: center; padding: 4px 12px; border-radius: 999px; background: #e3f8ea; border: 1px solid #a9dcbc; font-weight: 800; color: #1f7a45; }
`,
)

const FILES = ['🖼️ ჩემი ნახატი.png', '📄 ლექსი.docx', '📊 პრეზენტაცია.pptx']

export function mailSim(host: HTMLElement, extraTasks: SimTask[], config: MailConfig, ctx: ExerciseCtx) {
  const toAddress = (config.to ?? 'nino@school.ge').toLowerCase()
  const toName = config.toName ?? 'ნინო'

  const tasks: SimTask[] = [
    { text: 'დააჭირე ღილაკს **New Message** (ახალი წერილი).', event: 'compose', note: 'გაიხსნა ახალი წერილის ფანჯარა.' },
    {
      text: `ველში **To** ჩაწერე ადრესატის მისამართი: **${toAddress}**`,
      event: 'to',
      note: '**To** = „ვის“. აქ იწერება ადრესატის ელფოსტის მისამართი, შუაში ნიშნით **@**.',
    },
    {
      text: 'ველში **Subject** ჩაწერე წერილის თემა (სათაური).',
      event: 'subject',
      note: '**Subject** = წერილის **თემა**. ადრესატი მას წერილის გახსნამდე ხედავს.',
    },
    { text: 'ქვემოთ დაწერე წერილის ტექსტი. დაიწყე მისალმებით!', event: 'body', note: 'წერილის ტექსტი მზადაა.' },
    ...(config.attach
      ? [
          {
            text: 'მიამაგრე ფაილი ღილაკით **📎**.',
            event: 'file',
            note: '**📎** ღილაკით წერილს კომპიუტერიდან არჩეულ **ფაილს** ვამაგრებთ.',
          },
        ]
      : []),
    { text: 'გაგზავნე წერილი ღილაკით **Send**.', event: 'sent', note: '📤 წერილი წამებში გაიგზავნა! **Send** = გაგზავნა.' },
    ...(config.reply
      ? [
          {
            text: 'გახსენი **Sent Items** — იპოვე შენი გაგზავნილი წერილი.',
            event: 'seen-sent',
            note: '**Sent Items** — აქ ინახება ჩვენ მიერ **გაგზავნილი** წერილები.',
          },
          {
            text: `გახსენი **Inbox** და წაიკითხე პასუხი (${toName}).`,
            event: 'read-reply',
            note: '**Inbox** — აქ ვხედავთ ჩვენთვის **გამოგზავნილ** წერილებს.',
          },
        ]
      : []),
    ...extraTasks,
  ]

  const wrap = el('div', 'ex-simwrap')
  const stage = el('div', 'ex-stage ml')
  wrap.appendChild(stage)
  host.appendChild(wrap)
  const runner = taskRunner(wrap, tasks, ctx)

  const inbox: Letter[] = [
    {
      from: 'მასწავლებელი <teacher@school.ge>',
      to: 'me@school.ge',
      subject: 'კეთილი იყოს შენი მობრძანება!',
      body: 'გამარჯობა!\nეს შენი სასკოლო ელფოსტაა. აქ მოვა ყველა წერილი, რომელსაც გამოგიგზავნიან.\n\nპატივისცემით,\nმასწავლებელი',
    },
  ]
  const sent: Letter[] = []
  const flags = new Set<string>()
  let view: 'inbox' | 'sent' | 'compose' = 'inbox'
  let draft = { to: '', subject: '', body: '', file: '' }

  const check = () => {
    if (draft.to.trim().toLowerCase() === toAddress) flags.add('to')
    else flags.delete('to')
    if (draft.subject.trim().length >= 2) flags.add('subject')
    else flags.delete('subject')
    if (draft.body.trim().length >= 5) flags.add('body')
    else flags.delete('body')
    if (draft.file) flags.add('file')
    else flags.delete('file')
    runner.check(event => flags.has(event))
  }
  const mark = (flag: string) => {
    flags.add(flag)
    runner.check(event => flags.has(event))
  }

  const side = el('div', 'ml-side')
  const main = el('div', 'ml-main')
  stage.append(side, main)

  const renderSide = () => {
    side.replaceChildren()
    side.appendChild(el('div', 'ml-logo', '📧 Outlook'))
    side.appendChild(
      btn('ml-new', '✏️ New Message', () => {
        view = 'compose'
        mark('compose')
        render()
      }),
    )
    const unread = inbox.filter(l => l.unread).length
    const folder = (id: 'inbox' | 'sent', label: string, count: number) => {
      const node = btn(`ml-folder${view === id ? ' on' : ''}`, '', () => {
        view = id
        if (id === 'sent' && sent.length > 0) mark('seen-sent')
        render()
      })
      node.append(el('span', '', label))
      if (count > 0) node.append(el('span', 'ml-num', String(count)))
      side.appendChild(node)
    }
    folder('inbox', '📥 Inbox', unread)
    folder('sent', '📤 Sent Items', sent.length)
  }

  const renderLetter = (letter: Letter, back: () => void) => {
    main.replaceChildren()
    main.appendChild(el('div', 'ml-h', letter.subject))
    main.appendChild(el('div', 'ml-meta', `ვისგან: ${letter.from} • ვის: ${letter.to}`))
    const body = el('div', 'ml-read')
    body.textContent = letter.body
    main.appendChild(body)
    if (letter.file) main.appendChild(el('div', 'ml-filechip', `📎 ${letter.file}`))
    const backBtn = btn('ml-clip', '← უკან', back)
    backBtn.style.alignSelf = 'flex-start'
    main.appendChild(backBtn)
  }

  const renderList = (title: string, letters: Letter[], who: (l: Letter) => string) => {
    main.replaceChildren()
    main.appendChild(el('div', 'ml-h', title))
    if (letters.length === 0) main.appendChild(el('div', 'ml-empty', 'აქ ჯერ წერილი არ არის.'))
    letters.forEach(letter => {
      const item = btn(`ml-item${letter.unread ? ' unread' : ''}`, '', () => {
        if (letter.unread) {
          letter.unread = false
          renderSide()
          mark('read-reply')
        }
        renderLetter(letter, render)
      })
      const first = el('span')
      first.textContent = `${letter.unread ? '🔵 ' : ''}${who(letter)}`
      const second = el('span', 'ml-sub')
      second.textContent = letter.subject
      item.append(first, second)
      main.appendChild(item)
    })
  }

  const renderCompose = () => {
    main.replaceChildren()
    main.appendChild(el('div', 'ml-h', '✏️ ახალი წერილი'))

    const field = (label: string, value: string, placeholder: string, flag: string, set: (v: string) => void) => {
      const rowEl = el('div', 'ml-field')
      const lab = el('label', '', label)
      const input = el('input')
      input.type = 'text'
      input.value = value
      input.placeholder = placeholder
      input.autocomplete = 'off'
      input.spellcheck = false
      guardKeys(input)
      input.addEventListener('input', () => {
        set(input.value)
        check()
        input.classList.toggle('ok', flags.has(flag))
      })
      input.classList.toggle('ok', flags.has(flag))
      rowEl.append(lab, input)
      main.appendChild(rowEl)
      return { rowEl, input }
    }

    const to = field('To:', draft.to, 'ვის? მაგ. saxeli@school.ge', 'to', v => (draft.to = v))
    to.rowEl.appendChild(
      btn('ml-at', '@', () => {
        to.input.value += '@'
        to.input.dispatchEvent(new Event('input'))
        to.input.focus()
      }),
    )
    field('Subject:', draft.subject, 'წერილის თემა', 'subject', v => (draft.subject = v))

    const text = el('textarea', 'ml-text')
    text.placeholder = 'გამარჯობა, ...'
    text.value = draft.body
    guardKeys(text)
    text.addEventListener('input', () => {
      draft.body = text.value
      check()
      text.classList.toggle('ok', flags.has('body'))
    })
    main.appendChild(text)

    const bar = el('div', 'ml-bar')
    const send = btn('ml-send', '📤 Send', () => {
      const address = draft.to.trim().toLowerCase()
      const fail = (message: string) => {
        shake(send)
        ctx.say(message, 'warn')
      }
      if (!address) return fail('🤔 ველი **To** ცარიელია. ვის უგზავნი წერილს?')
      if (!address.includes('@')) return fail('🤔 მისამართში ნიშანი **@** აკლია. ყოველ ელფოსტის მისამართში ის აუცილებლად არის.')
      if (address !== toAddress) return fail(`🤔 შეამოწმე მისამართი! უნდა ეწეროს: **${toAddress}**. ერთი ასოც რომ შეგეშალოს, წერილი სხვასთან წავა.`)
      if (!flags.has('subject')) return fail('🤔 ჩაწერე თემა ველში **Subject**, რომ ადრესატმა იცოდეს, რაზეა წერილი.')
      if (!flags.has('body')) return fail('🤔 წერილი ცარიელია. დაწერე ტექსტი.')
      if (config.attach && !draft.file) return fail('🤔 ჯერ ფაილი მიამაგრე ღილაკით **📎**.')

      const subject = draft.subject.trim()
      sent.unshift({ from: 'მე <me@school.ge>', to: toAddress, subject, body: draft.body, file: draft.file })
      draft = { to: '', subject: '', body: '', file: '' }
      view = 'sent'
      mark('sent')
      render()
      main.insertBefore(el('div', 'ml-toast ex-pop', '✔ წერილი გაიგზავნა'), main.children[1] ?? null)
      if (config.reply) {
        setTimeout(() => {
          inbox.unshift({
            from: `${toName} <${toAddress}>`,
            to: 'me@school.ge',
            subject: `Re: ${subject}`,
            body: `გამარჯობა!\nშენი წერილი მივიღე, დიდი მადლობა!\n\nმეგობრულად,\n${toName}`,
            unread: true,
          })
          if (stage.isConnected) renderSide()
        }, 1500)
      }
    })
    const clip = btn('ml-clip', '📎 ფაილი', () => {
      const open = bar.querySelector('.ml-pick')
      if (open) return open.remove()
      const pick = el('div', 'ml-pick ex-pop')
      FILES.forEach(name =>
        pick.appendChild(
          btn('', name, () => {
            draft.file = name
            check()
            renderCompose()
          }),
        ),
      )
      bar.appendChild(pick)
    })
    bar.append(send, clip)
    if (draft.file) bar.appendChild(el('span', 'ml-filechip', `📎 ${draft.file}`))
    main.appendChild(bar)
  }

  const render = () => {
    renderSide()
    if (view === 'compose') renderCompose()
    else if (view === 'inbox') renderList('📥 Inbox — მიღებული წერილები', inbox, l => l.from)
    else renderList('📤 Sent Items — გაგზავნილი წერილები', sent, l => `ვის: ${l.to}`)
  }
  render()
}
