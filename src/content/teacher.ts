import type { Grade } from '../ui/GradeSelect'
import { hashSecret, hashTopicCode, xorWithSecret } from '../progress/hash'
import { TOPICS, type Topic } from './topics'

/**
 * მასწავლებლის რეჟიმი.
 * პაროლი თამაშის ფაილში ღიად არ ინახება — მხოლოდ მისი ჰეში.
 * თემების კოდები პაროლით არის დაშიფრული და მხოლოდ სწორი პაროლით იშიფრება.
 *
 * ახალი თემის დამატებისას: დაშიფრული კოდი მიიღება xorWithSecret(პაროლი, თემის id, კოდი, false)-ით.
 */
const TEACHER_PASSWORD_HASH = 'uhhdyp0ucb'

/** თემები school.emis.ge-ის გაკვეთილების რიგით: [თემის id, დაშიფრული კოდი] */
const ORDERED_CODES: Record<Grade, [string, string][]> = {
  2: [
    ['g2-conditional-signs', 'cd31ee16'],
    ['g2-signs-around-us', '0ae60bd1'],
    ['g2-part-and-whole', '2b7e14c8'],
    ['g2-cycles-in-life', '2180906b'],
    ['g2-creating-cycles', '6af124ea'],
    ['g2-user-interface', '72212978'],
    ['g2-programs-management', 'c65b6b42'],
    ['g2-learn-by-playing', 'ca20da07'],
    ['g2-computer-technologies', 'bc22b6fc'],
    ['g2-network', 'afcd8d6c'],
    ['g2-storing-information', '0880b21b'],
    ['g2-my-account', '585aecae'],
  ],
  3: [
    ['g3-computer-history', '1e1632ff'],
    ['computer-devices', '908db0fd'],
    ['g3-how-computer-works', '688c3f72'],
    ['g3-algorithms', 'c7b12046'],
    ['g3-programming-language', 'b71f9db4'],
    ['g3-visual-communication', '5c834826'],
    ['g3-visual-programming', '2bc04adc'],
    ['g3-how-internet-works', '3369646a'],
    ['g3-search-engine', '98b7978b'],
    ['g3-cloud-services', '28f96873'],
    ['g3-powerpoint', '96e631d3'],
    ['g3-cyber-hygiene', 'd6ce0733'],
    ['g3-robots', '14f8de2f'],
    ['g3-binary-bracelet', '3b6690bd'],
    ['g3-first-heroes', '9a77cfa0'],
    ['g3-robot-friend', '421b43ca'],
  ],
  4: [
    ['g4-electric-circuit', 'd36ac283'],
    ['errors-in-programming', '412167eb'],
    ['g4-predicting-behavior', 'f33f2b04'],
    ['g4-creating-program', '793054eb'],
    ['g4-graphical-interface', '6c9b0684'],
    ['g4-onedrive', 'f373294a'],
    ['g4-text-editor-tools', '4e0bad60'],
    ['g4-text-alignment', 'aac1ad99'],
    ['g4-templates-tables', 'eddd8a1a'],
    ['g4-cards', '9a8258a1'],
    ['g4-email', '6fbb59cf'],
    ['g4-information', 'ec75748e'],
    ['g4-brochures', '37e56784'],
    ['g4-onenote', 'c1d0a2c9'],
    ['g4-walking-internet', 'ee380b5c'],
    ['g4-text-design', '418c7ba8'],
  ],
}

export const TEACHER_GRADES: Grade[] = [2, 3, 4]

export interface TeacherCode {
  /** გაკვეთილის ნომერი საიტზე */
  lesson: number
  topic: Topic
  code: string
}

export type TeacherCodes = Record<Grade, TeacherCode[]>

/** კლასის თემები საიტის რიგით (მასწავლებლის ბიბლიოთეკისა და აკადემიისთვის) */
export function topicsInLessonOrder(grade: Grade): Topic[] {
  return ORDERED_CODES[grade]
    .map(([id]) => TOPICS.find(topic => topic.id === id))
    .filter((topic): topic is Topic => topic !== undefined)
}

/** სწორი პაროლის შემთხვევაში აბრუნებს გაშიფრულ კოდებს, არასწორისას — null */
export function unlockTeacherCodes(password: string): TeacherCodes | null {
  if (hashSecret(password) !== TEACHER_PASSWORD_HASH) return null

  const result = {} as TeacherCodes
  for (const grade of TEACHER_GRADES) {
    result[grade] = ORDERED_CODES[grade].flatMap(([id, encrypted], index) => {
      const topic = TOPICS.find(item => item.id === id)
      if (!topic) return []
      const code = xorWithSecret(password, id, encrypted, true)
      // გაშიფრული კოდი უნდა ემთხვეოდეს თემის ჰეშს — ასე შეცდომით დაშიფრული კოდი არ გამოჩნდება
      if (hashTopicCode(code) !== topic.codeHash) return []
      return [{ lesson: index + 1, topic, code }]
    })
  }
  return result
}
