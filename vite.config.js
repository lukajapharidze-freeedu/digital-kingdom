import { hostname } from 'node:os'
import { defineConfig } from 'vite'
import { typingChampionRelay } from './server/typingChampionRelay.mjs'
import { penaltyShooterRelay } from './server/penaltyShooterRelay.mjs'
import { LAN_NAME, lanNamePlugin } from './server/lanName.mjs'

/**
 * კლასში თამაში მოკლე სახელით იხსნება: http://digitalkingdom.local/ (იხ. server/lanName.mjs),
 * სათადარიგოდ — კომპიუტერის სახელით (მაგ. http://itroom/). `npm run lan` პორტ 80-ზე უშვებს.
 * Vite სხვა სახელით შემოსულ მოთხოვნებს ბლოკავს, ამიტომ ამ სახელებს აქ ვრთავთ.
 */
const pcName = hostname().toLowerCase()
const LAN_HOSTNAMES = [LAN_NAME, 'digital.kingdom', pcName, `${pcName}.local`]

export default defineConfig({
  // LAN რელეები (Typing Champion, Penalty Shooter): მუშაობს მხოლოდ dev/preview სერვერზე, build-ზე გავლენა არ აქვს
  plugins: [typingChampionRelay(), penaltyShooterRelay(), lanNamePlugin()],
  server: { allowedHosts: LAN_HOSTNAMES },
  preview: { allowedHosts: LAN_HOSTNAMES },
})
