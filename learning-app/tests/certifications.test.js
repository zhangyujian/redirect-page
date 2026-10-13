import assert from 'node:assert/strict'
import test from 'node:test'
import { certifications, certificationSkillIds, certificationSkills, certificationSources, certificationReportTemplate } from '../src/data/certifications.js'
import { getPracticeCase } from '../src/data/practiceCases.js'
import { readLearningRoute, learningRouteUrl } from '../src/data/learningNavigation.js'

test('certification route survives refresh and rejects unknown certificate identifiers', () => {
  for (const id of Object.keys(certifications)) {
    const route = { page: 'certifications', distroId: 'kali', courseId: null, caseId: null, certificationId: id }
    const url = new URL(learningRouteUrl(route, 'https://www.blvbtc.com/kali-linux-learning/'), 'https://www.blvbtc.com')
    assert.deepEqual(readLearningRoute(url.search), route)
  }
  assert.equal(readLearningRoute('?page=certifications&cert=unknown').certificationId, 'cisp')
})

test('CISSP includes all eight domains and official weights sum to 100', () => {
  assert.equal(certifications.cissp.modules.length, 8)
  assert.deepEqual(certifications.cissp.modules.map(module => module.weight), [16, 10, 13, 13, 13, 12, 13, 10])
  assert.equal(certifications.cissp.modules.reduce((sum, module) => sum + module.weight, 0), 100)
})

test('every listed skill has practical steps, evidence and honest coverage boundaries', () => {
  for (const [id, skill] of Object.entries(certificationSkills)) {
    assert.ok(['foundation', 'partial', 'external'].includes(skill.coverage), id)
    assert.equal(skill.steps.length, 3, id)
    assert.ok(skill.why && skill.scenario && skill.deliverable && skill.gap, id)
    if (skill.coverage === 'external') assert.equal(skill.entry, undefined, id)
    if (skill.entry) {
      const { distroId, courseId, caseId } = skill.entry
      const practice = getPracticeCase(distroId, courseId, caseId)
      assert.equal(practice?.id, caseId, id)
      assert.equal(practice?.courseId, courseId, id)
    }
  }
})

test('skill maps have valid unique skills and original self-check questions', () => {
  for (const [id, certification] of Object.entries(certifications)) {
    const listed = certification.modules.flatMap(module => module.skills)
    assert.equal(listed.length, new Set(listed).size, id)
    for (const skillId of certificationSkillIds(id)) assert.ok(certificationSkills[skillId], skillId)
    assert.equal(certification.drills.length, 3)
    for (const drill of certification.drills) {
      assert.equal(drill.options.length, 3)
      assert.ok(drill.options[drill.answer])
      assert.ok(drill.explanation.length > 20)
    }
    assert.ok(certificationReportTemplate(id).includes('不是官方考试报告模板'))
    for (const sourceId of certification.sources) {
      const url = new URL(certificationSources[sourceId].url)
      assert.equal(url.protocol, 'https:')
      assert.ok(['www.itsec.gov.cn', 'www.isc2.org', 'help.offsec.com'].includes(url.hostname))
    }
  }
})

test('OSCP+ explicitly separates missing Windows, AD, credential and pivot training', () => {
  const ids = certificationSkillIds('oscp')
  for (const id of ['windows', 'ad', 'passwords', 'tunnels', 'exploit']) {
    assert.ok(ids.includes(id))
    assert.equal(certificationSkills[id].coverage, 'external')
  }
})
