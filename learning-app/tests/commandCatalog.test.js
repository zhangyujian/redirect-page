import test from 'node:test'
import assert from 'node:assert/strict'
import { COMMAND_CATEGORIES, COMMAND_SYSTEMS, commandCatalog, filterCommands, getDistroCommands } from '../src/data/commandCatalog.js'

test('every entry has unique identity, Chinese guidance, syntax, options and a usable example', () => {
  assert.equal(new Set(commandCatalog.map((entry) => entry.id)).size, commandCatalog.length)
  for (const entry of commandCatalog) {
    for (const field of ['id', 'command', 'summary', 'syntax', 'note', 'availability', 'permission', 'tag']) {
      assert.ok(typeof entry[field] === 'string' && entry[field].trim(), `${entry.id}: ${field}`)
    }
    assert.match(entry.summary, /[\u4e00-\u9fff]/)
    assert.ok(entry.options.length > 0, `${entry.id}: options`)
    assert.ok(entry.examples.length > 0, `${entry.id}: examples`)
    assert.ok(entry.options.every((item) => item.flag && item.description))
    assert.ok(entry.examples.every((item) => item.code && item.explanation))
    assert.equal(entry.example, entry.examples[0].code)
    assert.ok(COMMAND_CATEGORIES.some((category) => category.id === entry.category))
    assert.ok(entry.distros.length && entry.distros.every((id) => COMMAND_SYSTEMS.some((system) => system.id === id)))
  }
})

test('every system has extensive coverage across all learning categories', () => {
  for (const system of COMMAND_SYSTEMS) {
    const entries = getDistroCommands(system)
    assert.ok(entries.length >= 150, system.id)
    assert.equal(new Set(entries.map((entry) => entry.category)).size, COMMAND_CATEGORIES.length)
    assert.ok(entries.some((entry) => entry.scope === 'system'))
    assert.ok(entries.some((entry) => entry.scope === 'shared'))
    assert.ok(system.links.length >= 3)
  }
})

test('APT and distro-specific tools do not leak into the wrong system', () => {
  const names = (id) => getDistroCommands(id).map((entry) => entry.command)
  assert.ok(names('kali').includes('apt update'))
  assert.ok(names('parrot').includes('apt update'))
  assert.ok(names('blackarch').includes('pacman -Syu'))
  assert.ok(!names('blackarch').includes('apt update'))
  assert.ok(!names('kali').some((name) => name.startsWith('pacman')))
  assert.ok(!names('parrot').includes('kali-tweaks'))
  assert.ok(!names('kali').includes('parrot-upgrade'))
  assert.ok(names('parrot').includes('parrot-upgrade'))
})

test('existing curriculum command families stay available for all systems', () => {
  for (const system of COMMAND_SYSTEMS) {
    const commands = getDistroCommands(system).map((entry) => entry.command)
    for (const name of ['pwd', 'ls', 'cd', 'cat', 'grep', 'chmod', 'ps', 'ip', 'ss', 'nmap']) {
      assert.ok(commands.includes(name), `${system.id}: ${name}`)
    }
  }
})

test('search finds command names, Chinese use cases and options without case or whitespace sensitivity', () => {
  const entries = getDistroCommands('kali')
  assert.ok(filterCommands(entries, { query: '  CHMOD  ' }).some((entry) => entry.command === 'chmod'))
  assert.equal(filterCommands(entries, { query: '  CHMOD  ' })[0].command, 'chmod')
  assert.equal(filterCommands(getDistroCommands('parrot'), { query: 'parrot-upgrade' })[0].command, 'parrot-upgrade')
  assert.ok(filterCommands(entries, { query: '监听端口' }).some((entry) => entry.command === 'ss'))
  assert.ok(filterCommands(entries, { query: 'NMAP -sV' }).some((entry) => entry.command === 'nmap'))
  assert.ok(filterCommands(entries, { query: 'lab.pcap' }).some((entry) => entry.command === 'tshark'))
  assert.equal(filterCommands(entries, { query: 'definitely-no-command-238909' }).length, 0)
})

test('category and scope filtering compose correctly', () => {
  const entries = getDistroCommands('blackarch')
  const matches = filterCommands(entries, { category: 'packages', scope: 'system', query: 'pacman' })
  assert.ok(matches.length > 10)
  assert.ok(matches.every((entry) => entry.category === 'packages' && entry.scope === 'system'))
  assert.equal(filterCommands(entries, { category: 'packages', scope: 'shared' }).length, 0)
})

test('clearing filters restores the complete current-system list', () => {
  const entries = getDistroCommands('parrot')
  assert.deepEqual(filterCommands(entries), entries)
  assert.deepEqual(filterCommands(entries, { query: '   ', category: 'all', scope: 'all' }), entries)
  assert.deepEqual(getDistroCommands('not-a-system'), [])
})

test('all documentation uses HTTPS and a primary-source host', () => {
  const hosts = new Set(['www.kali.org', 'parrotsec.org', 'www.parrotsec.org', 'tools.parrotsec.org', 'blackarch.org', 'man.archlinux.org', 'manpages.debian.org', 'docs.python.org', 'pipx.pypa.io', 'docs.docker.com', 'nmap.org', 'www.tcpdump.org', 'www.wireshark.org', 'docs.openssl.org', 'exiftool.org', 'yara.readthedocs.io', 'www.sleuthkit.org', 'volatility3.readthedocs.io'])
  for (const link of [...commandCatalog.map((entry) => entry.source), ...COMMAND_SYSTEMS.flatMap((system) => system.links)]) {
    assert.ok(link.title)
    const url = new URL(link.url)
    assert.equal(url.protocol, 'https:')
    assert.ok(hosts.has(url.hostname) || ['pentoo.org', 'dev.gentoo.org', 'wiki.gentoo.org', 'packages.gentoo.org', 'github.com'].includes(url.hostname), link.url)
  }
})

test('examples avoid dangerous default deletion and partial Arch upgrades', () => {
  for (const entry of commandCatalog) {
    for (const example of entry.examples) {
      assert.doesNotMatch(example.code, /rm\s+-rf|--noconfirm|--overwrite=|curl[^\n]*\|\s*(sudo\s+)?(sh|bash)/)
      assert.doesNotMatch(example.code, /pacman\s+-Sy(?:\s|$)/)
    }
  }
  assert.equal(commandCatalog.find((entry) => entry.command === 'rm').risk, 'destructive')
  assert.equal(commandCatalog.find((entry) => entry.command === 'apt autoremove').risk, 'destructive')
})

test('BlackArch category enumeration uses groups rather than package-name search', () => {
  const entry = commandCatalog.find((item) => item.command === 'pacman -Sg')
  assert.equal(entry.example, 'pacman -Sg blackarch-forensic')
})
