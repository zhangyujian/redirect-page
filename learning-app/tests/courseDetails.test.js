import assert from 'node:assert/strict'
import test from 'node:test'
import { COURSE_REVIEWED_AT, courseChapters, courseDetails } from '../src/data/courseDetails.js'
import { courseGuides } from '../src/data/courseGuides.js'
import { createSandbox, executeSandbox } from '../src/sandbox/index.js'

const sectionIds = ['overview', 'concepts', 'workflow']
const paths = { kali: '~/lab', parrot: '~/audit', blackarch: '~/workspace', pentoo: '~/lab' }
const sourceHosts = new Set(['www.kali.org', 'parrotsec.org', 'blackarch.org', 'nmap.org', 'man.archlinux.org', 'man7.org', 'docs.python.org'])
for (const host of ['pentoo.org', 'dev.gentoo.org', 'github.com']) sourceHosts.add(host)

function fixture(id) {
  return { id, name: id, terminal: { user: id, path: paths[id], responses: {} }, mission: { command: courseGuides[id][3].command, description: 'Course example' } }
}

test('detailed curriculum keeps all course and section IDs compatible with saved progress', () => {
  assert.deepEqual(Object.keys(courseDetails).sort(), Object.keys(courseGuides).sort())
  assert.deepEqual(courseChapters.map(chapter => chapter.id), sectionIds)
  assert.equal(Object.values(courseDetails).flatMap(Object.values).length, 16)
  for (const [distroId, courses] of Object.entries(courseDetails)) {
    assert.deepEqual(Object.keys(courses), Object.keys(courseGuides[distroId]))
    for (const detail of Object.values(courses)) assert.deepEqual(Object.keys(detail.sections), sectionIds)
  }
})

for (const [distroId, courses] of Object.entries(courseDetails)) {
  for (const [courseId, detail] of Object.entries(courses)) {
    const label = `${distroId} ${courseId}: ${detail.title}`

    test(`${label} has complete explanations, tasks, checks and reviewed resources`, () => {
      assert.equal(detail.reviewedAt, COURSE_REVIEWED_AT)
      for (const [sectionId, section] of Object.entries(detail.sections)) {
        assert.ok(section.intro.length >= 30, sectionId)
        assert.equal(section.topics.length, 3)
        assert.equal(new Set(section.topics.map(topic => topic.title)).size, 3)
        for (const topic of section.topics) {
          assert.ok(topic.explanation.length >= 30, `${sectionId}: ${topic.title} explanation`)
          assert.ok(topic.task.length >= 10, `${sectionId}: ${topic.title} task`)
          assert.ok(topic.verification.length >= 10, `${sectionId}: ${topic.title} verification`)
          assert.doesNotMatch(topic.explanation, /这项内容是.*学习目标之一|这是本节需要掌握的核心概念/)
        }
        assert.ok(section.pitfall.includes('纠正：'))
        assert.ok(section.check.question.length >= 10)
        assert.ok(section.check.answer.length >= 20)
        assert.ok(section.example.code.length > 5)
        if (sectionId === 'overview') {
          assert.equal(section.example.kind, 'record')
          assert.ok(section.example.code.includes('\n'))
          assert.ok(section.example.explanation.length >= 20)
        } else {
          assert.equal(section.example.kind, 'command')
          assert.ok(['sandbox', 'vm'].includes(section.example.environment))
          assert.ok(section.example.setup.length >= 20)
          assert.equal(section.example.explanation.length, 3)
          assert.ok(section.example.output.length > 0)
        }
      }
      assert.equal(new Set(detail.checks.map(check => check.question)).size, 3)
      assert.ok(detail.resources.length >= 2)
      assert.equal(new Set(detail.resources.map(resource => resource.url)).size, detail.resources.length)
      for (const resource of detail.resources) {
        const url = new URL(resource.url)
        assert.equal(url.protocol, 'https:')
        assert.ok(sourceHosts.has(url.hostname), resource.url)
        assert.ok(resource.summary.length >= 30)
        assert.equal(resource.points.length, 3)
        assert.equal(resource.reviewedAt, COURSE_REVIEWED_AT)
        assert.doesNotMatch(resource.url, /what-is-parrot|freedesktop\.org/)
      }
      const quiz = courseGuides[distroId][courseId].quiz
      assert.ok(quiz.options[quiz.answer])
      assert.ok(quiz.explanation.length > 10)
    })

    for (const [sectionId, section] of Object.entries(detail.sections)) {
      const example = section.example
      if (example.environment !== 'sandbox') continue
      test(`${label} / ${sectionId} example runs from a fresh offline state`, () => {
        const original = createSandbox(fixture(distroId))
        const before = structuredClone(original)
        const response = executeSandbox(original, example.code)
        assert.equal(response.code, 0, `${example.code}\n${response.lines.join('\n')}`)
        assert.deepEqual(original, before, 'A demonstration must not mutate its input session')
        assert.ok(Array.isArray(response.lines))
        assert.deepEqual(executeSandbox(createSandbox(fixture(distroId)), example.code).lines, response.lines, 'Repeated demos must start independently')
      })
    }
  }

  test(`${distroId}: the linked lab command remains taught in the course`, () => {
    const course = courses[3]
    assert.ok(JSON.stringify(course.sections).includes(courseGuides[distroId][3].command))
  })
}

test('VM-only operations are explicitly separated from offline examples', () => {
  const example = courseDetails.parrot[4].sections.concepts.example
  assert.equal(example.environment, 'vm')
  assert.match(example.setup, /虚拟机/)
  assert.match(example.setup, /不运行/)
  assert.match(courseDetails.parrot[4].sections.concepts.topics[0].explanation, /文件访问权限/)
})

test('course-specific corrections distinguish searches, snapshots and metadata', () => {
  assert.match(courseDetails.kali[1].checks[1].answer, /不会.*软件包.*个人文件/)
  assert.match(courseDetails.parrot[2].checks[1].answer, /不能.*格式.*元数据/)
  assert.match(courseDetails.blackarch[3].checks[1].answer, /-Sg.*-Ss/)
  assert.match(courseDetails.blackarch[4].conceptExample.explanation.join(' '), /无输出.*不能证明/)
})
