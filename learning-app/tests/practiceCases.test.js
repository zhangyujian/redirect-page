import assert from 'node:assert/strict'
import test from 'node:test'
import { courseDetails, courseChapters } from '../src/data/courseDetails.js'
import { getCoursePracticeCases, getPracticeCase, practiceCases } from '../src/data/practiceCases.js'
import { advancePracticeSession, createPracticeSession, formatPracticeReport } from '../src/data/practiceSession.js'

const paths = { kali: '~/lab', parrot: '~/audit', blackarch: '~/workspace', pentoo: '~/lab' }
const hosts = new Set(['www.kali.org', 'parrotsec.org', 'blackarch.org', 'man.archlinux.org', 'man7.org', 'nmap.org', 'docs.python.org', 'git-scm.com'])
for (const host of ['pentoo.org', 'dev.gentoo.org', 'github.com']) hosts.add(host)
for (const host of ['curl.se', 'www.gnu.org', 'www.man7.org', 'manpages.debian.org', 'cheatsheetseries.owasp.org']) hosts.add(host)
function fixture(id) {
  return { id, name: id, terminal: { user: id, path: paths[id], responses: {} }, mission: { command: 'whoami', description: 'Practice fixture' } }
}
function runAll(distroId, courseId) {
  const practice = getPracticeCase(distroId, courseId)
  let session = createPracticeSession(fixture(distroId))
  for (let index = 0; index < practice.steps.length; index++) {
    session = advancePracticeSession(session, practice)
    assert.equal(session.nextStep, index + 1, practice.id + ': ' + practice.steps[index].command + '\n' + JSON.stringify(session.results))
  }
  return session
}
function content(session, path) {
  return session.sandbox.fs[session.sandbox.initialPath + '/' + path]?.content
}

test('all four systems retain four foundation cases and add three advanced cases without changing course IDs', () => {
  assert.deepEqual(Object.keys(practiceCases), Object.keys(courseDetails))
  assert.deepEqual(courseChapters.map(chapter => chapter.id), ['overview', 'concepts', 'workflow'])
  const all = Object.values(practiceCases).flat()
  assert.equal(all.length, 28)
  assert.equal(new Set(all.map(practice => practice.id)).size, 28)
  assert.equal(all.reduce((sum, practice) => sum + practice.steps.length, 0), 158)
  for (const [distroId, cases] of Object.entries(practiceCases)) {
    assert.deepEqual(cases.filter(practice => practice.level === 'foundation').map(practice => String(practice.courseId)), Object.keys(courseDetails[distroId]))
    assert.equal(cases.filter(practice => practice.level === 'advanced').length, 3)
    for (const courseId of Object.keys(courseDetails[distroId])) {
      assert.equal(getCoursePracticeCases(distroId, Number(courseId))[0], getPracticeCase(distroId, Number(courseId)))
    }
    assert.equal(getPracticeCase(distroId, 99), undefined)
  }
})

for (const [distroId, cases] of Object.entries(practiceCases)) {
  for (const practice of cases) {
    test(practice.id + ': complete explanation, diagnostics, verification and primary sources', () => {
      assert.equal(getPracticeCase(distroId, practice.courseId, practice.id), practice)
      assert.equal(practice.reviewedAt, practice.level === 'advanced' ? '2026-09-03' : courseDetails[distroId][practice.courseId].reviewedAt)
      for (const key of ['scenario', 'goal', 'scope', 'transfer', 'report']) assert.ok(practice[key].length >= 30, key)
      assert.ok(practice.prerequisites.length >= 2)
      assert.equal(practice.thinking.length, 3)
      assert.equal(practice.troubleshooting.length, 3)
      assert.equal(practice.acceptance.length, 3)
      assert.ok(practice.steps.length >= 5)
      for (const item of practice.thinking) assert.ok(item.title.length > 5 && item.body.length > 40)
      for (const item of practice.troubleshooting) {
        for (const key of ['symptom', 'cause', 'fix']) assert.ok(item[key].length >= 10)
      }
      for (const step of practice.steps) {
        for (const key of ['title', 'why', 'command', 'expected', 'next']) assert.ok(step[key].length >= 6, key)
        assert.equal(step.explanation.length, 3)
        assert.ok(Number.isInteger(step.expectedCode))
        assert.doesNotMatch(step.command, /--noconfirm|--nodeps|--overwrite|curl.*\|\s*(sh|bash)/)
        if (distroId === 'blackarch') assert.doesNotMatch(step.command, /\bapt\b/)
        else assert.doesNotMatch(step.command, /\bpacman\b/)
      }
      assert.ok(practice.resources.length >= 2)
      assert.equal(new Set(practice.resources.map(source => source.url)).size, practice.resources.length)
      for (const source of practice.resources) {
        const url = new URL(source.url)
        assert.equal(url.protocol, 'https:')
        assert.ok(hosts.has(url.hostname), source.url)
      }
    })

    test(practice.id + ': all steps execute sequentially with independent state and expected exit codes', () => {
      let session = createPracticeSession(fixture(distroId))
      const initial = structuredClone(session)
      for (const [index, step] of practice.steps.entries()) {
        const before = structuredClone(session)
        const next = advancePracticeSession(session, practice)
        assert.deepEqual(session, before, 'Input session must not be mutated')
        assert.equal(next.results[index].code, step.expectedCode, step.command + '\n' + next.results[index].lines.join('\n'))
        assert.equal(next.nextStep, index + 1)
        assert.equal('missionCompleted' in next, false, 'Case examples must not award course or lab progress')
        session = next
      }
      assert.equal(advancePracticeSession(session, practice), session, 'Finished sessions cannot rerun or append steps')
      assert.equal(initial.nextStep, 0)
      assert.deepEqual(initial.results, [])
      const fresh = createPracticeSession(fixture(distroId))
      assert.deepEqual(fresh.sandbox.fs, initial.sandbox.fs, 'New cases start without artifacts from another session')
      assert.deepEqual(fresh.sandbox.services, initial.sandbox.services)
      assert.match(formatPracticeReport(practice, session), /不代表真实环境已验证/)
    })
  }
}

test('Kali reports contain real sandbox observations and leave source logs unchanged', () => {
  const baseline = runAll('kali', 1)
  assert.match(content(baseline, 'reports/environment.txt'), /ID=kali/)
  assert.match(content(baseline, 'reports/scope.txt'), /not verified/)
  const logs = runAll('kali', 2)
  assert.equal(content(logs, 'access.log'), content(logs, 'reports/access-original.log'))
  assert.equal(content(logs, 'reports/unauthorized.log'), '192.168.56.20 GET /login 401\n')
  assert.match(content(logs, 'reports/status-count.txt'), /2 200/)
  const network = runAll('kali', 3)
  assert.match(content(network, 'reports/service-scan.txt'), /443\/tcp closed unknown/)
  assert.equal(content(network, 'reports/inventory.csv').trim().split('\n').length, 4)
  const auth = runAll('kali', 4)
  assert.match(content(auth, 'reports/auth-failures.txt'), /2:.*Failed password/)
  assert.equal(auth.sandbox.services.ssh.active, true)
})

test('Parrot privacy and project examples do not claim metadata sanitization or Git execution', () => {
  const share = runAll('parrot', 2)
  assert.equal(content(share, 'share-demo/public.txt'), 'status=HTTP_401\n')
  assert.equal(content(share, 'share-demo/original.txt').trim().split('\n').length, 4)
  assert.equal(share.results[3].code, 1)
  assert.deepEqual(share.results[3].lines, [])
  const project = runAll('parrot', 4)
  assert.equal(project.sandbox.fs[project.sandbox.initialPath + '/project-demo/.env'].mode, '600')
  assert.equal(content(project, 'project-demo/.gitignore'), '.env\n.venv/\n')
  assert.match(getPracticeCase('parrot', 4).scope, /不运行 Git/)
  assert.match(getPracticeCase('parrot', 2).transfer, /元数据|对应格式/)
})

test('Parrot service shutdown has an expected failure and restores service, HTTP and enablement', () => {
  const practice = getPracticeCase('parrot', 3)
  let session = createPracticeSession(fixture('parrot'))
  for (let i = 0; i < 3; i++) session = advancePracticeSession(session, practice)
  assert.equal(session.sandbox.services['lab-web'].active, false)
  assert.doesNotMatch(session.results[2].lines.join('\n'), /8080/)
  session = advancePracticeSession(session, practice)
  assert.equal(session.results[3].code, 7)
  assert.equal(session.results[3].accepted, true)
  session = advancePracticeSession(session, practice)
  assert.equal(session.sandbox.services['lab-web'].active, true)
  assert.equal(session.sandbox.services['lab-web'].enabled, false)
  assert.equal(session.sandbox.services.ssh.active, true)
  assert.match(session.results[4].lines.join('\n'), /200 OK/)
})

test('BlackArch maintenance changes only the intended virtual package and teaching configuration', () => {
  const packages = runAll('blackarch', 2)
  assert.doesNotMatch(content(packages, 'reports/packages-before.txt'), /sleuthkit/)
  assert.match(content(packages, 'reports/packages-after.txt'), /sleuthkit/)
  assert.equal(packages.results[2].code, 1)
  const config = runAll('blackarch', 4)
  assert.equal(content(config, 'maintenance-demo/app.conf'), 'listen=127.0.0.1\nport=8080\nlogging=structured\n')
  assert.match(content(config, 'maintenance-demo/app.conf.before'), /logging=basic/)
  assert.match(content(config, 'maintenance-demo/app.conf.pacnew'), /listen=0.0.0.0/)
  assert.equal(config.sandbox.services['lab-web'].active, true)
  assert.match(config.results[4].lines.join('\n'), /192.168.56.30:8080/)
})

test('unexpected failure never advances or commits partial state, and reports mark unrun steps', () => {
  const original = createPracticeSession(fixture('kali'))
  const practice = { ...getPracticeCase('kali', 1), steps: [
    { command: 'echo demo > reports/partial.txt && definitely-unsupported', expectedCode: 0, title: 'unexpected failure' },
    { command: 'whoami', expectedCode: 0, title: 'not reached' },
  ] }
  const failed = advancePracticeSession(original, practice)
  assert.equal(failed.nextStep, 0)
  assert.equal(failed.results[0].accepted, false)
  assert.equal(content(failed, 'reports/partial.txt'), undefined)
  assert.deepEqual(failed.sandbox, original.sandbox)
  const report = formatPracticeReport(practice, failed)
  assert.match(report, /未符合预期/)
  assert.match(report, /本步尚未执行/)
})
