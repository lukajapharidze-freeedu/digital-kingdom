/**
 * ბიბლიოთეკის ნახატების საკუთარი ხატულები — იმ მოწყობილობებისთვის, რომლებსაც ემოჯი არ აქვს
 * (სისტემური ბლოკი, ფლეშკა, სკანერი...). ტექსტებში ასე ვწერთ: { icon: 'svg:tower' }.
 */
const ICONS: Record<string, string> = {
  // სისტემური ბლოკი
  tower: `
    <rect x="18" y="4" width="28" height="56" rx="4" fill="#3b4a5e"/>
    <rect x="21" y="7" width="22" height="50" rx="2" fill="#56677d"/>
    <rect x="25" y="12" width="14" height="4" rx="1" fill="#2a3646"/>
    <rect x="25" y="19" width="14" height="4" rx="1" fill="#2a3646"/>
    <circle cx="32" cy="46" r="4.5" fill="#2a3646"/>
    <circle cx="32" cy="46" r="2.2" fill="#4ade80"/>
    <rect x="27" y="53" width="3" height="2" rx="1" fill="#9fb0c4"/>
    <rect x="34" y="53" width="3" height="2" rx="1" fill="#9fb0c4"/>`,
  // სერვერი (კარადა თაროებით)
  server: `
    <rect x="10" y="4" width="44" height="56" rx="4" fill="#2f3b4c"/>
    <rect x="14" y="9" width="36" height="12" rx="2" fill="#4b5b70"/>
    <rect x="14" y="26" width="36" height="12" rx="2" fill="#4b5b70"/>
    <rect x="14" y="43" width="36" height="12" rx="2" fill="#4b5b70"/>
    <circle cx="19" cy="15" r="2" fill="#4ade80"/><circle cx="19" cy="32" r="2" fill="#4ade80"/><circle cx="19" cy="49" r="2" fill="#facc15"/>
    <rect x="26" y="13.5" width="20" height="3" rx="1.5" fill="#24303f"/>
    <rect x="26" y="30.5" width="20" height="3" rx="1.5" fill="#24303f"/>
    <rect x="26" y="47.5" width="20" height="3" rx="1.5" fill="#24303f"/>`,
  // ფლეშ მეხსიერება (ფლეშკა)
  usb: `
    <g transform="rotate(-35 32 32)">
      <rect x="25" y="6" width="14" height="12" rx="1" fill="#c9d3de"/>
      <rect x="28" y="9" width="3" height="3" fill="#6b7a8c"/><rect x="33" y="9" width="3" height="3" fill="#6b7a8c"/>
      <rect x="21" y="17" width="22" height="40" rx="5" fill="#2f80ed"/>
      <rect x="25" y="23" width="14" height="22" rx="3" fill="#5aa0f5"/>
      <circle cx="32" cy="51" r="2.5" fill="#1b4f99"/>
    </g>`,
  // მიკროჩიპი
  chip: `
    <g fill="#c99a3a">
      <rect x="20" y="6" width="3" height="10"/><rect x="28" y="6" width="3" height="10"/><rect x="36" y="6" width="3" height="10"/><rect x="43" y="6" width="3" height="10"/>
      <rect x="20" y="48" width="3" height="10"/><rect x="28" y="48" width="3" height="10"/><rect x="36" y="48" width="3" height="10"/><rect x="43" y="48" width="3" height="10"/>
      <rect x="6" y="20" width="10" height="3"/><rect x="6" y="28" width="10" height="3"/><rect x="6" y="36" width="10" height="3"/><rect x="6" y="43" width="10" height="3"/>
      <rect x="48" y="20" width="10" height="3"/><rect x="48" y="28" width="10" height="3"/><rect x="48" y="36" width="10" height="3"/><rect x="48" y="43" width="10" height="3"/>
    </g>
    <rect x="14" y="14" width="36" height="36" rx="4" fill="#2b3442"/>
    <rect x="22" y="22" width="20" height="20" rx="2" fill="#475569"/>
    <circle cx="19" cy="19" r="1.8" fill="#94a3b8"/>`,
  // სკანერი
  scanner: `
    <rect x="6" y="28" width="52" height="22" rx="4" fill="#4b5b70"/>
    <rect x="9" y="31" width="46" height="8" rx="2" fill="#7dd3fc"/>
    <rect x="9" y="34" width="46" height="2" fill="#38bdf8"/>
    <path d="M8 28 L14 14 L56 14 L56 28 Z" fill="#9fb0c4"/>
    <rect x="15" y="17" width="38" height="3" rx="1.5" fill="#cfd8e3"/>
    <circle cx="50" cy="45" r="2" fill="#4ade80"/>
    <rect x="12" y="43" width="20" height="3" rx="1.5" fill="#2f3b4c"/>`,
  // პროექტორი
  projector: `
    <path d="M44 26 L62 14 L62 50 L44 38 Z" fill="#fde68a" opacity="0.85"/>
    <rect x="4" y="22" width="42" height="22" rx="5" fill="#e2e8f0" stroke="#64748b" stroke-width="2"/>
    <circle cx="36" cy="33" r="7.5" fill="#334155"/>
    <circle cx="36" cy="33" r="4" fill="#60a5fa"/>
    <rect x="10" y="28" width="14" height="3" rx="1.5" fill="#94a3b8"/>
    <rect x="10" y="34" width="10" height="3" rx="1.5" fill="#94a3b8"/>
    <rect x="9" y="44" width="5" height="5" rx="1" fill="#64748b"/><rect x="36" y="44" width="5" height="5" rx="1" fill="#64748b"/>`,
  // ვებ-კამერა
  webcam: `
    <circle cx="32" cy="26" r="18" fill="#2f3b4c"/>
    <circle cx="32" cy="26" r="11" fill="#475569"/>
    <circle cx="32" cy="26" r="6.5" fill="#1e293b"/>
    <circle cx="34.5" cy="23.5" r="2.2" fill="#93c5fd"/>
    <circle cx="44" cy="14" r="2" fill="#ef4444"/>
    <path d="M26 44 L38 44 L42 56 L22 56 Z" fill="#475569"/>
    <rect x="16" y="55" width="32" height="5" rx="2.5" fill="#2f3b4c"/>`,
  // საბეჭდი მანქანა
  typewriter: `
    <rect x="18" y="6" width="28" height="16" rx="1" fill="#ffffff" stroke="#94a3b8" stroke-width="1.5"/>
    <rect x="22" y="10" width="18" height="2" fill="#94a3b8"/><rect x="22" y="15" width="14" height="2" fill="#94a3b8"/>
    <rect x="8" y="20" width="48" height="8" rx="4" fill="#1f2937"/>
    <path d="M6 30 H58 L54 56 H10 Z" fill="#b45309"/>
    <g fill="#fef3c7">
      <circle cx="16" cy="37" r="2.6"/><circle cx="24" cy="37" r="2.6"/><circle cx="32" cy="37" r="2.6"/><circle cx="40" cy="37" r="2.6"/><circle cx="48" cy="37" r="2.6"/>
      <circle cx="20" cy="44" r="2.6"/><circle cx="28" cy="44" r="2.6"/><circle cx="36" cy="44" r="2.6"/><circle cx="44" cy="44" r="2.6"/>
    </g>
    <rect x="22" y="49" width="20" height="3" rx="1.5" fill="#fef3c7"/>`,
  // უწყვეტი დენის წყარო
  ups: `
    <rect x="16" y="6" width="32" height="54" rx="4" fill="#334155"/>
    <rect x="21" y="12" width="22" height="12" rx="2" fill="#0f172a"/>
    <rect x="24" y="15" width="12" height="6" rx="1" fill="#4ade80"/>
    <rect x="36" y="16.5" width="2" height="3" fill="#4ade80"/>
    <path d="M34 30 L26 43 H32 L29 54 L39 39 H33 Z" fill="#facc15"/>`,
}

export function hasPictureIcon(icon: string): boolean {
  return icon.startsWith('svg:') && icon.slice(4) in ICONS
}

/** ხატულა SVG-ის სახით (ზომა em-ებშია, რომ ტექსტთან ერთად იზრდებოდეს/პატარავდებოდეს) */
export function pictureIconSvg(icon: string, size = '2.3em'): string {
  const body = ICONS[icon.slice(4)] ?? ''
  return `<svg viewBox="0 0 64 64" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${body}</svg>`
}
