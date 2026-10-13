import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { getDistroCommands, COMMAND_SYSTEMS } from '../src/data/commandCatalog.js'
import { courseGuides } from '../src/data/courseGuides.js'
import { courseDetails } from '../src/data/courseDetails.js'
import { practiceCases } from '../src/data/practiceCases.js'
import { createSandbox, executeSandbox, supportedCommands, completeCommand } from '../src/sandbox/index.js'

const distro = { id: 'pentoo', name: 'Pentoo Linux', terminal: { user: 'pentoo', path: '~/lab', responses: {} }, mission: { command: 'ss -tulpn', description: 'Pentoo test' } }
function session() {
  let state = createSandbox(distro)
  return {
    get state() { return state },
    run(command, expected = 0) {
      const response = executeSandbox(state, command)
      assert.equal(response.code, expected, command + '\n' + response.lines.join('\n'))
      state = response.state
      return response
    },
  }
}

test('four registries include Pentoo with four lessons and existing course keys intact', () => {
  const ids = ['blackarch', 'kali', 'parrot', 'pentoo']
  for (const registry of [courseGuides, courseDetails, practiceCases]) assert.deepEqual(Object.keys(registry).sort(), ids)
  assert.deepEqual(COMMAND_SYSTEMS.map(system => system.id).sort(), ids)
  for (const id of ids) assert.deepEqual(Object.keys(courseDetails[id]), ['1', '2', '3', '4'])
})

test('Pentoo exposes Gentoo tools without advertising APT, pacman or systemd', () => {
  const entries = getDistroCommands('pentoo')
  assert.equal(entries.length, 150)
  assert.ok(entries.some(entry => entry.command === 'emerge --pretend'))
  assert.ok(entries.some(entry => entry.command === 'equery files'))
  assert.ok(entries.some(entry => entry.command === 'rc-service'))
  assert.ok(entries.every(entry => !/^(apt|dpkg|pacman|systemctl|journalctl|parrot-|kali-)/.test(entry.command)))
  for (const name of ['apt', 'pacman', 'systemctl', 'journalctl']) assert.equal(Object.hasOwn(supportedCommands('pentoo'), name), false)
  for (const id of ['kali', 'parrot', 'blackarch']) assert.equal(getDistroCommands(id).some(entry => entry.command.startsWith('emerge')), false)
})

test('Pentoo identity, address, config and completion are isolated in a fresh session', () => {
  const first = session(), second = session()
  assert.match(first.run('cat /etc/os-release').lines.join('\n'), /ID_LIKE=gentoo/)
  assert.equal(first.state.address, '192.168.56.40')
  assert.equal(first.state.cwd, '/home/pentoo/lab')
  first.run('echo own > notes/own.txt')
  second.run('cat notes/own.txt', 1)
  assert.equal(first.run('ss -tulpn').missionCompleted, true)
  first.run('sudo rc-service lab-web stop')
  assert.equal(first.run('ss -tulpn').missionCompleted, false)
  assert.equal(second.run('ss -tulpn').missionCompleted, true)
})

test('Portage preview and USE queries do not alter packages or source configuration', () => {
  const s = session()
  const packages = structuredClone(s.state.packages), files = structuredClone(s.state.fs)
  for (const command of ['emerge --info', 'emerge --search nmap', 'emerge --searchdesc forensic', 'emerge -pv app-forensics/sleuthkit', 'emerge -pvuDN @world', 'equery files net-analyzer/nmap', 'equery uses nmap', 'eselect profile list', 'eselect repository list']) s.run(command)
  s.run('equery list app-forensics/sleuthkit', 1)
  assert.deepEqual(s.state.packages, packages)
  assert.deepEqual(s.state.fs, files)
  assert.equal(s.state.packageRefreshes, 0)
  s.run('emerge --sync', 1)
  s.run('sudo emerge --sync')
  assert.equal(s.state.packageRefreshes, 1)
  assert.deepEqual(s.state.packages, packages)
})

test('unsupported installs, flags and cross-distro commands fail without fake success', () => {
  const s = session(), packages = structuredClone(s.state.packages)
  for (const command of ['sudo emerge --ask app-forensics/sleuthkit', 'sudo emerge app-forensics/sleuthkit', 'emerge --nodeps nmap', 'emerge --sync --info', 'emerge --pretend unknown/pkg', 'emerge -p @world', 'eselect profile set 1', 'equery list __proto__', 'sudo apt install nmap', 'pacman -Q', 'systemctl status ssh']) s.run(command, 1)
  assert.deepEqual(s.state.packages, packages)
  assert.equal(s.state.packageRefreshes, 0)
  for (const id of ['kali', 'parrot', 'blackarch']) {
    const state = createSandbox({ ...distro, id })
    assert.equal(executeSandbox(state, 'emerge --info').code, 1)
    assert.equal(executeSandbox(state, 'rc-status').code, 1)
  }
})

test('OpenRC enablement, runtime and HTTP evidence remain separate and reversible', () => {
  const s = session()
  s.run('rc-service lab-web stop', 1)
  assert.equal(s.state.services['lab-web'].active, true)
  s.run('sudo rc-update add lab-web default')
  assert.equal(s.state.services['lab-web'].enabled, true)
  s.run('sudo rc-update del lab-web default')
  assert.equal(s.state.services['lab-web'].active, true)
  s.run('sudo rc-service lab-web stop')
  s.run('rc-service lab-web status', 3)
  assert.doesNotMatch(s.run('ss -tulpn').lines.join('\n'), /:8080/)
  s.run('curl -I http://192.168.56.40:8080', 7)
  s.run('sudo rc-service lab-web start')
  assert.match(s.run('curl -I http://192.168.56.40:8080').lines.join('\n'), /200 OK/)
  assert.equal(s.state.services['lab-web'].enabled, false)
  assert.equal(s.state.services.ssh.active, true)
  assert.equal(s.state.services.dnsmasq.active, true)
  const before = structuredClone(s.state.services)
  for (const command of ['sudo rc-update add lab-web unknown', 'sudo rc-service constructor stop', 'sudo rc-service lab-web stop extra']) s.run(command, 1)
  assert.deepEqual(s.state.services, before)
})

test('Pentoo manuals, completion and read-only config restrictions match the supported subset', () => {
  const s = session()
  assert.deepEqual(completeCommand(s.state, 'emer'), ['emerge'])
  assert.match(s.run('man emerge').lines.join('\n'), /预览/)
  assert.match(s.run('help rc-service').lines.join('\n'), /OpenRC/)
  assert.match(s.run('man 8 rc-service').lines.join('\n'), /RC-SERVICE\(8\)/)
  s.run('sudo echo changed > /etc/portage/make.conf', 1)
  assert.match(s.run('cat /etc/portage/make.conf').lines.join('\n'), /USE="ssl"/)
})

test('six Pentoo questions are taught by course 3 and accepted by the feed contract', () => {
  const feed = JSON.parse(readFileSync(new URL('../public/data/challenge-feed.json', import.meta.url), 'utf8'))
  const questions = feed.questions.pentoo
  assert.equal(questions.length, 6)
  assert.equal(new Set(questions.map(question => question.uid)).size, 6)
  for (const question of questions) {
    assert.equal(question.requiredCourseId, 3)
    assert.equal(question.command, courseGuides.pentoo[3].command)
    for (const key of ['uid', 'id', 'title', 'description', 'target', 'hint', 'command', 'success']) assert.ok(question[key])
    assert.equal(question.objectives.length, 3)
    assert.ok(question.knowledge.length >= 3)
    assert.ok(question.terminalResponses['cat mission.txt'])
    assert.ok(question.terminalResponses[question.command])
  }
  assert.ok(readFileSync(new URL('../public/assets/distro-logos/pentoo-logo.webp', import.meta.url)).length > 1000)
})
