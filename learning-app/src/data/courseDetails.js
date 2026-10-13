import { kaliDetails } from './courses/kali.js'
import { parrotDetails } from './courses/parrot.js'
import { blackarchDetails } from './courses/blackarch.js'
import { pentooDetails } from './courses/pentoo.js'

export { COURSE_REVIEWED_AT } from './courses/shared.js'

export const courseDetails = {
  kali: kaliDetails,
  parrot: parrotDetails,
  blackarch: blackarchDetails,
  pentoo: pentooDetails,
}

// Stable section IDs keep existing local and cloud completion records valid.
export const courseChapters = [
  { id: 'overview', title: '场景与学习目标', duration: '建议 6 分钟' },
  { id: 'concepts', title: '核心知识', duration: '建议 10 分钟' },
  { id: 'workflow', title: '安全工作流', duration: '建议 12 分钟' },
]
