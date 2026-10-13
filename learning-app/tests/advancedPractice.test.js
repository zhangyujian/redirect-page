import assert from 'node:assert/strict'
import test from 'node:test'
import { filterPracticeCases, getCoursePracticeCases, getPracticeCase, practiceCases } from '../src/data/practiceCases.js'
import { advancePracticeSession, createPracticeSession, formatPracticeReport } from '../src/data/practiceSession.js'

const paths = { kali: '~/lab', parrot: '~/audit', blackarch: '~/workspace', pentoo: '~/lab' }
function fixture(id) {
  return { id, name: id, terminal: { user: id, path: paths[id], responses: {} }, mission: { command: 'whoami', description: 'Advanced QA' } }
}
function runCase(distroId, caseId, through = Infinity) {
  const practice = practiceCases[distroId].find(item => item.id === caseId)
  assert.ok(practice, caseId)
  let session = createPracticeSession(fixture(distroId))
  for (const index of practice.steps.keys()) {
    if (index >= through) break
    session = advancePracticeSession(session, practice)
    assert.equal(session.nextStep, index + 1, caseId + ': step ' + (index + 1))
  }
  return { practice, session }
}
function content(session, path) {
  return session.sandbox.fs[session.sandbox.initialPath + '/' + path]?.content
}
function output(session, index) {
  return session.results[index].lines.join('\n')
}

test('advanced cases provide original analysis, evidence, limits and stop conditions for every distro', () => {
  for (const [distroId, cases] of Object.entries(practiceCases)) {
    const advanced = cases.filter(item => item.level === 'advanced')
    assert.equal(advanced.length, 3)
    for (const item of advanced) {
      assert.ok(item.analysis.focus.length >= 40, item.id)
      assert.equal(item.analysis.hypotheses.length, 3)
      assert.equal(item.analysis.stopConditions.length, 3)
      for (const hypothesis of item.analysis.hypotheses) {
        assert.ok(hypothesis.title.length >= 10, item.id + ': title')
        for (const key of ['evidence', 'interpretation', 'next']) assert.ok(hypothesis[key].length >= 25, item.id + ': ' + key)
      }
      for (const condition of item.analysis.stopConditions) assert.ok(condition.length >= 20)
      assert.ok(item.steps.length >= 6)
      assert.ok(item.reflection.answer.length >= 60)
      assert.ok(getCoursePracticeCases(distroId, item.courseId).includes(item))
      assert.notEqual(getPracticeCase(distroId, item.courseId), item, 'Legacy entry must still open the foundation case')
    }
  }
})

test('filters combine level and case-insensitive terms, with explicit empty and unknown results', () => {
  for (const id of Object.keys(practiceCases)) {
    assert.equal(filterPracticeCases(id).length, 7)
    assert.equal(filterPracticeCases(id, 'foundation').length, 4)
    assert.equal(filterPracticeCases(id, 'advanced').length, 3)
    assert.equal(filterPracticeCases(id, 'all', 'definitely-no-such-topic').length, 0)
  }
  assert.deepEqual(filterPracticeCases('pentoo', 'advanced', ' USE   nmap ').map(item => item.id), ['pentoo-use-change-analysis'])
  assert.deepEqual(filterPracticeCases('parrot', 'advanced', 'PIPELINE').map(item => item.id), ['parrot-pipeline-false-success'])
  assert.equal(filterPracticeCases('kali', 'advanced', 'apt-cache').length, 1)
  assert.equal(filterPracticeCases('missing').length, 0)
  assert.equal(filterPracticeCases('__proto__').length, 0)
  assert.deepEqual(getCoursePracticeCases('missing', 1), [])
})

test('case lookup uses both course and case identity, preserving old entry points', () => {
  assert.equal(getPracticeCase('kali', 3).id, 'kali-service-inventory')
  assert.equal(getPracticeCase('pentoo', 1).id, 'pentoo-readiness')
  assert.equal(getPracticeCase('kali', 3, 'kali-http-layered-analysis').id, 'kali-http-layered-analysis')
  assert.equal(getPracticeCase('kali', 2, 'kali-http-layered-analysis'), undefined)
  assert.equal(getPracticeCase('parrot', 3, 'kali-http-layered-analysis'), undefined)
  assert.equal(getPracticeCase('pentoo', 3, 'invalid'), undefined)
  assert.equal(getPracticeCase('__proto__', 3), undefined)
})

test('Kali advanced HTTP case distinguishes transport, response status and stateful recovery', () => {
  const stopped = runCase('kali', 'kali-http-layered-analysis', 5).session
  assert.equal(stopped.results[1].code, 7)
  assert.equal(stopped.results[2].code, 0)
  assert.match(output(stopped, 2), /404 Not Found/)
  assert.match(output(stopped, 3), /200 OK/)
  assert.equal(stopped.sandbox.services['lab-web'].active, false)
  assert.equal(stopped.sandbox.services.ssh.active, true)
  const { session } = runCase('kali', 'kali-http-layered-analysis')
  assert.equal(session.sandbox.services['lab-web'].active, true)
  assert.equal(session.sandbox.services['lab-web'].enabled, false)
  assert.match(content(session, 'reports/http-analysis.txt'), /Not verified/)
})

test('Kali request correlation separates actors and marks missing evidence without fabricated actions', () => {
  const { session } = runCase('kali', 'kali-request-correlation')
  const record = content(session, 'reports/request-A.txt')
  assert.match(record, /req-A\|alice\|401/)
  assert.match(record, /credential_rejected/)
  assert.doesNotMatch(record, /req-B|session_opened|read_profile/)
  assert.equal(session.results[3].code, 1)
  assert.deepEqual(session.results[3].lines, [])
  assert.match(output(session, 4), /req-B\|bob\|role=reader/)
  assert.match(content(session, 'reports/correlation-findings.txt'), /Unknown: log completeness/)
})

test('Kali review previews do not change packages or perform index updates', () => {
  const { session } = runCase('kali', 'kali-package-change-review')
  assert.equal(session.sandbox.packages.sleuthkit, undefined)
  assert.equal(session.sandbox.packageRefreshes, 0)
  assert.equal(content(session, 'reports/kali-installed-before.txt'), content(session, 'reports/kali-installed-after.txt'))
  assert.match(content(session, 'reports/kali-install-preview.txt'), /仅预览/)
})

test('Parrot evidence export preserves restricted originals and only projects allowed fields', () => {
  const { session } = runCase('parrot', 'parrot-evidence-minimization')
  const base = session.sandbox.initialPath
  assert.equal(content(session, 'privacy-demo/export/status.txt'), '/login|401\n/docs|200\n')
  assert.match(content(session, 'privacy-demo/private/raw.log'), /DEMO-ONLY-A/)
  assert.equal(session.sandbox.fs[base + '/privacy-demo/private'].mode, '700')
  assert.equal(session.sandbox.fs[base + '/privacy-demo/private/.env'].mode, '600')
  assert.deepEqual(Object.keys(session.sandbox.fs).filter(path => path.startsWith(base + '/privacy-demo/export/')), [base + '/privacy-demo/export/status.txt'])
  assert.equal(session.results[4].code, 1)
  assert.deepEqual(session.results[4].lines, [])
})

test('Parrot permissions case reproduces traversal and write failures without losing original content', () => {
  const denied = runCase('parrot', 'parrot-permission-path-analysis', 3).session
  assert.match(output(denied, 2), /Permission denied/)
  assert.equal(denied.sandbox.fs[denied.sandbox.initialPath + '/permission-demo/private'].mode, '600')
  const readOnly = runCase('parrot', 'parrot-permission-path-analysis', 5).session
  assert.match(output(readOnly, 4), /权限不足|Permission denied/)
  assert.equal(content(readOnly, 'permission-demo/private/app.conf'), 'MODE=training\n')
  const { session } = runCase('parrot', 'parrot-permission-path-analysis')
  assert.equal(session.sandbox.fs[session.sandbox.initialPath + '/permission-demo/private'].mode, '700')
  assert.equal(session.sandbox.fs[session.sandbox.initialPath + '/permission-demo/private/app.conf'].mode, '600')
  assert.equal(content(session, 'permission-demo/private/app.conf'), 'MODE=training\n')
})

test('Parrot audit demonstrates false pipeline success and prevents a false success artifact', () => {
  const { session } = runCase('parrot', 'parrot-pipeline-false-success')
  assert.equal(session.results[1].code, 0)
  assert.match(output(session, 1), /^0\n/)
  assert.match(output(session, 1), /No such file/)
  assert.equal(session.results[2].code, 1)
  assert.equal(session.results[3].code, 1)
  assert.deepEqual(session.results[3].lines, [])
  assert.equal(content(session, 'reports/audit-success.txt'), undefined)
  assert.equal(content(session, 'reports/audit-input.txt'), content(session, 'access.log'))
  assert.equal(content(session, 'reports/audit-401.txt'), '192.168.56.20 GET /login 401\n')
})

test('BlackArch transaction changes only the requested virtual package, not the whole group', () => {
  const { session } = runCase('blackarch', 'blackarch-transaction-scope')
  assert.ok(session.sandbox.packages.sleuthkit)
  assert.equal(session.sandbox.packages['bulk-extractor'], undefined)
  assert.equal(content(session, 'reports/arch-before.txt').trim().split('\n').length, 4)
  assert.equal(content(session, 'reports/arch-after.txt').trim().split('\n').length, 5)
  assert.equal(session.sandbox.services.ssh.active, true)
})

test('BlackArch dual-host case never confuses fixed remote HTTP with local service state', () => {
  const stopped = runCase('blackarch', 'blackarch-two-host-evidence', 5).session
  assert.equal(stopped.sandbox.services['lab-web'].active, false)
  assert.match(output(stopped, 4), /80\/tcp open http/)
  assert.match(output(stopped, 4), /200 OK/)
  assert.match(output(stopped, 4), /Failed to connect to 192.168.56.30/)
  assert.equal(stopped.results[4].code, 7)
  const { session } = runCase('blackarch', 'blackarch-two-host-evidence')
  assert.equal(session.sandbox.services['lab-web'].active, true)
  assert.equal(session.sandbox.services.ssh.active, true)
})

test('BlackArch recovery separates teaching files from runtime and preserves the package baseline', () => {
  const restoredFile = runCase('blackarch', 'blackarch-maintenance-acceptance', 5).session
  assert.equal(content(restoredFile, 'change-demo/app.conf'), content(restoredFile, 'change-demo/app.conf.before'))
  assert.equal(restoredFile.sandbox.services['lab-web'].active, false)
  assert.equal(restoredFile.results[4].code, 7)
  const { session } = runCase('blackarch', 'blackarch-maintenance-acceptance')
  assert.equal(Object.keys(session.sandbox.packages).length, 4)
  assert.equal(session.sandbox.packageRefreshes, 0)
  assert.equal(session.sandbox.services['lab-web'].active, true)
  assert.equal(session.sandbox.services['lab-web'].enabled, false)
})

test('Pentoo USE and world reviews never apply effective config, package or repository changes', () => {
  for (const id of ['pentoo-use-change-analysis', 'pentoo-world-cleanup-review']) {
    const initial = createPracticeSession(fixture('pentoo')).sandbox
    const { session } = runCase('pentoo', id)
    assert.deepEqual(session.sandbox.packages, initial.packages)
    assert.equal(session.sandbox.packageRefreshes, 0)
    for (const path of ['/etc/portage/make.conf', '/var/lib/portage/world', '/etc/portage/repos.conf/pentoo.conf']) {
      assert.deepEqual(session.sandbox.fs[path], initial.fs[path])
    }
  }
})

test('Pentoo readiness proves enabled but stopped and restores both configuration and runtime', () => {
  const stopped = runCase('pentoo', 'pentoo-openrc-readiness', 5).session
  assert.equal(stopped.sandbox.services['lab-web'].enabled, true)
  assert.equal(stopped.sandbox.services['lab-web'].active, false)
  assert.equal(stopped.results[3].code, 3)
  assert.equal(stopped.results[4].code, 7)
  const { practice, session } = runCase('pentoo', 'pentoo-openrc-readiness')
  assert.equal(session.sandbox.services['lab-web'].enabled, false)
  assert.equal(session.sandbox.services['lab-web'].active, true)
  assert.equal(session.sandbox.services.ssh.active, true)
  assert.equal(session.sandbox.services.dnsmasq.active, true)
  assert.match(formatPracticeReport(practice, session), /未验证|限制/)
})
