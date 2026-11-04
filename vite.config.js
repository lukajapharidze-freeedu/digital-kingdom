import { defineConfig } from 'vite'
import { typingChampionRelay } from './server/typingChampionRelay.mjs'
import { penaltyShooterRelay } from './server/penaltyShooterRelay.mjs'

export default defineConfig({
  // LAN რელეები (Typing Champion, Penalty Shooter): მუშაობს მხოლოდ dev/preview სერვერზე, build-ზე გავლენა არ აქვს
  plugins: [typingChampionRelay(), penaltyShooterRelay()],
})
