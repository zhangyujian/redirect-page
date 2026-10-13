import assert from 'node:assert/strict'
import test from 'node:test'
import { courseIsUnlocked, learningRouteUrl, readLearningRoute, recommendedLesson } from '../src/data/learningNavigation.js'

const lessons = [1, 2, 3, 4].map(id => ({ id, title: `Course ${id}` }))

test('course and system survive a share-link round trip', () => {
  const route = { page: 'courses', distroId: 'pentoo', courseId: 2, caseId: 'dependency-review' }
  const url = new URL(learningRouteUrl(route, 'https://www.blvbtc.com/kali-linux-learning/?utm_source=guide#old-section'), 'https://www.blvbtc.com')
  assert.deepEqual(readLearningRoute(url.search), route)
  assert.equal(url.searchParams.get('utm_source'), 'guide')
  assert.equal(url.hash, '')
  assert.equal(url.pathname, '/kali-linux-learning/')
})

test('invalid routes fall back safely and do not create unknown course states', () => {
  assert.deepEqual(readLearningRoute('?page=unknown&distro=unknown&course=99', 'parrot'), { page: 'dashboard', distroId: 'parrot', courseId: null, caseId: null })
  for (const invalid of ['0', '5', '1.5', '1e0', 'NaN']) assert.equal(readLearningRoute(`?page=courses&course=${invalid}`).courseId, null)
  assert.equal(readLearningRoute('', 'unknown').distroId, 'kali')
})

test('changing to another page removes course and case without dropping unrelated parameters', () => {
  const url = new URL(learningRouteUrl({ page: 'notes', distroId: 'blackarch' }, 'https://example.com/app/?page=courses&course=2&case=old&ref=test'), 'https://example.com')
  assert.deepEqual(readLearningRoute(url.search), { page: 'notes', distroId: 'blackarch', courseId: null, caseId: null })
  assert.equal(url.searchParams.get('ref'), 'test')
  assert.equal(url.searchParams.has('course'), false)
  assert.equal(url.searchParams.has('case'), false)
})

test('new learners start at lesson one, completed lessons unlock the next lesson', () => {
  assert.equal(recommendedLesson(lessons, {}).id, 1)
  const progress = { 1: { completed: true }, 2: { sections: ['overview'] } }
  assert.equal(recommendedLesson(lessons, progress).id, 2)
  assert.equal(courseIsUnlocked(lessons, progress, 2), true)
  assert.equal(courseIsUnlocked(lessons, progress, 3), false)
  assert.equal(courseIsUnlocked(lessons, progress, 99), false)
})

test('deep links and inconsistent records never bypass the prior course prerequisite', () => {
  const progress = { 1: { sections: ['overview', 'concepts', 'workflow'], quizPassed: false }, 3: { completed: true } }
  const route = readLearningRoute('?page=courses&distro=kali&course=3')
  assert.equal(courseIsUnlocked(lessons, progress, route.courseId), false)
  assert.equal(recommendedLesson(lessons, progress).id, 1)
})

test('completed curriculum recommends a review without resetting saved records', () => {
  const progress = Object.fromEntries(lessons.map(lesson => [lesson.id, { completed: true }]))
  const snapshot = structuredClone(progress)
  assert.equal(recommendedLesson(lessons, progress).id, 1)
  assert.deepEqual(progress, snapshot)
})
