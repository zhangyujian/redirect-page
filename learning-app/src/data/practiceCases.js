import { courseDetails } from './courseDetails.js'
import { kaliCases } from './practice/kali.js'
import { parrotCases } from './practice/parrot.js'
import { blackarchCases } from './practice/blackarch.js'
import { pentooCases } from './practice/pentoo.js'
import { kaliAdvancedCases } from './practice/kaliAdvanced.js'
import { parrotAdvancedCases } from './practice/parrotAdvanced.js'
import { blackarchAdvancedCases } from './practice/blackarchAdvanced.js'
import { pentooAdvancedCases } from './practice/pentooAdvanced.js'

export const practiceCases = Object.fromEntries(
  Object.entries({
    kali: [...kaliCases, ...kaliAdvancedCases],
    parrot: [...parrotCases, ...parrotAdvancedCases],
    blackarch: [...blackarchCases, ...blackarchAdvancedCases],
    pentoo: [...pentooCases, ...pentooAdvancedCases],
  }).map(([distroId, cases]) => [
    distroId,
    cases.map(practice => ({
      level: 'foundation',
      ...practice,
      reviewedAt: practice.reviewedAt || courseDetails[distroId][practice.courseId].reviewedAt,
      resources: [...new Map(
        [...courseDetails[distroId][practice.courseId].resources, ...(practice.extraResources || [])]
          .map(resource => [resource.url, resource]),
      ).values()],
    })),
  ]),
)

export function getCoursePracticeCases(distroId, courseId) {
  if (!Object.hasOwn(practiceCases, distroId)) return []
  return practiceCases[distroId].filter(practice => practice.courseId === courseId)
}

export function getPracticeCase(distroId, courseId, caseId) {
  return getCoursePracticeCases(distroId, courseId).find(practice => !caseId || practice.id === caseId)
}

export function filterPracticeCases(distroId, level = 'all', query = '') {
  if (!Object.hasOwn(practiceCases, distroId)) return []
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
  return practiceCases[distroId].filter(practice => {
    const text = [practice.title, practice.summary, practice.difficulty, practice.scenario,
      ...practice.steps.map(step => step.command)].join(' ').toLowerCase()
    return (level === 'all' || practice.level === level) && terms.every(term => text.includes(term))
  })
}
