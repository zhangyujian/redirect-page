export const learningPages = ['dashboard', 'distros', 'courses', 'certifications', 'practice', 'commands', 'notes']
export const learningDistros = ['kali', 'parrot', 'blackarch', 'pentoo']

export function readLearningRoute(search, fallbackDistro = 'kali') {
  const params = new URLSearchParams(search)
  const page = learningPages.includes(params.get('page')) ? params.get('page') : 'dashboard'
  const distroId = learningDistros.includes(params.get('distro')) ? params.get('distro') : learningDistros.includes(fallbackDistro) ? fallbackDistro : 'kali'
  const courseId = page === 'courses' && /^[1-4]$/.test(params.get('course') || '') ? Number(params.get('course')) : null
  return { page, distroId, courseId, caseId: courseId ? params.get('case') || null : null, ...(page === 'certifications' ? { certificationId: ['cisp', 'cissp', 'oscp'].includes(params.get('cert')) ? params.get('cert') : 'cisp' } : {}) }
}

export function learningRouteUrl(route, currentUrl) {
  const url = new URL(currentUrl)
  for (const key of ['page', 'distro', 'course', 'case', 'cert']) url.searchParams.delete(key)
  url.searchParams.set('page', route.page)
  url.searchParams.set('distro', route.distroId)
  if (route.page === 'certifications') url.searchParams.set('cert', route.certificationId || 'cisp')
  if (route.page === 'courses' && route.courseId) {
    url.searchParams.set('course', String(route.courseId))
    if (route.caseId) url.searchParams.set('case', route.caseId)
  }
  // Chapter anchors belong to the reader and must not carry into a different page.
  url.hash = ''
  return url.pathname + url.search
}

export function courseIsUnlocked(lessons, progress, courseId) {
  const index = lessons.findIndex(lesson => lesson.id === courseId)
  return index >= 0 && (index === 0 || Boolean(progress[lessons[index - 1].id]?.completed))
}

export function recommendedLesson(lessons, progress) {
  return lessons.find(lesson => !progress[lesson.id]?.completed && courseIsUnlocked(lessons, progress, lesson.id)) || lessons[0]
}
