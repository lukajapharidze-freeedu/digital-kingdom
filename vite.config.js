import { defineConfig } from 'vite'
import { typingChampionRelay } from './server/typingChampionRelay.mjs'

export default defineConfig({
  // Typing Champion-ის LAN რელე: მუშაობს მხოლოდ dev/preview სერვერზე, build-ზე გავლენა არ აქვს
  plugins: [typingChampionRelay()],
})
