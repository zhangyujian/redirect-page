import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { getDistroCommands } from '../src/data/commandCatalog.js'
import { courseGuides } from '../src/data/courseGuides.js'
import { completeCommand, createSandbox, displayPath, executeSandbox, sandboxExercises, supportedCommands } from '../src/sandbox/index.js'
import { readFile } from '../src/sandbox/filesystem.js'

function fixture(id = 'kali', overrides = {}) {
  return { id, name: id, terminal: { user: id, path: id === 'blackarch' ? '~/workspace' : id === 'parrot' ? '~/audit' : '~/lab', responses: {} }, mission: { command: courseGuides[id][3].command, description: 'Test mission' }, ...overrides }
}
function session(id = 'kali') {
  let state = createSandbox(fixture(id))
  return {
    get state() { return state },
    run(command, expected = 0) {
      const response = executeSandbox(state, command); state = response.state
      assert.equal(response.code, expected, command + ': ' + response.lines.join('\n'))
      return response
    },
    text(command, expected = 0) { return this.run(command, expected).lines.join('\n') },
  }
}

for (const id of ['kali', 'parrot', 'blackarch', 'pentoo']) {
  test(`${id}: every guided step runs successfully in sequence`, () => {
    const s = session(id)
    for (const exercise of sandboxExercises(s.state)) for (const [, command] of exercise.steps) s.run(command)
    assert.ok(Object.keys(supportedCommands(id)).length >= 65)
  })
  test(`${id}: every existing command catalog entry has a Chinese learning manual`, () => {
    const s = session(id)
    for (const entry of getDistroCommands(id)) {
      const response = s.text(`man ${entry.command}`)
      assert.ok(response.includes(entry.summary), entry.command)
      assert.ok(response.includes('当前沙盒支持'))
    }
  })
}

test('man accepts explicit section and rejects incorrect section', () => {
  const s = session()
  assert.match(s.text('man 1 ls'), /LS\(1\).*中文学习手册/)
  assert.match(s.text('man ls'), /列出目录内容/)
  assert.match(s.text('ls --help'), /当前沙盒支持/)
  s.run('man 8 ls', 1)
  assert.match(session('blackarch').text('man 8 pacman'), /PACMAN\(8\)/)
  assert.match(s.text('man -k 权限'), /chmod/)
  assert.match(s.text('whatis ls chmod'), /chmod/)
})

test('file operations preserve content, cwd, case and spaces', () => {
  const s = session()
  s.run('mkdir -p "notes/My Folder" && cd "notes/My Folder"')
  assert.equal(displayPath(s.state), '~/lab/notes/My Folder')
  s.run('printf "%s\\n" Hello Linux > "My Notes.txt"')
  s.run('echo World >> "My Notes.txt"')
  assert.equal(s.text('cat "My Notes.txt"'), 'Hello\nLinux\nWorld')
  s.run('cat "my notes.txt"', 1)
  s.run('cp "My Notes.txt" copy.txt && mv copy.txt renamed.txt')
  assert.equal(s.text('cat renamed.txt'), 'Hello\nLinux\nWorld')
  s.run('cd .. && pwd')
  assert.match(s.text('cd -'), /My Folder/)
  s.run('cd ~')
  assert.equal(displayPath(s.state), '~')
})

test('pipes, redirects and quoted operators use actual file contents', () => {
  const s = session()
  assert.equal(s.text('cat access.log | grep 200 | wc -l'), '2')
  assert.match(s.text('sort hosts.txt | uniq -c'), /2 192.168.56.101/)
  s.run('grep 404 access.log | tee reports/errors.txt > reports/copy.txt')
  assert.equal(readFile(s.state, 'reports/errors.txt'), readFile(s.state, 'reports/copy.txt'))
  assert.equal(s.text('wc -l < reports/errors.txt'), '1')
  s.run('echo "a | b > c && d" > quoted.txt')
  assert.equal(s.text('cat quoted.txt'), 'a | b > c && d')
  s.run('echo first > quoted.txt > second.txt')
  assert.equal(readFile(s.state, 'quoted.txt'), '')
  assert.equal(s.text('cat second.txt'), 'first')
})

test('shell operators short circuit with real exit codes', () => {
  const s = session()
  assert.equal(s.text('false && echo wrong || echo correct'), 'correct')
  s.run('false', 1)
  assert.equal(s.text('echo $?'), '1')
  s.run('cat missing && touch should-not-exist', 1)
  assert.equal(s.state.fs[s.state.cwd + '/should-not-exist'], undefined)
  assert.equal(s.text('grep absent access.log || echo no-match'), 'no-match')
  assert.equal(s.text('false | true && echo pipeline-ok'), 'pipeline-ok')
})

test('pipeline cwd is isolated, while redirects persist', () => {
  const s = session(), cwd = s.state.cwd
  s.run('cd notes | cat')
  assert.equal(s.state.cwd, cwd)
  s.run('echo persisted | tee reports/pipe.txt | wc -l')
  assert.equal(readFile(s.state, 'reports/pipe.txt'), 'persisted\n')
})

test('environment expansion respects quote and escape boundaries', () => {
  const s = session()
  s.run('export NAME="Hello Linux"')
  assert.equal(s.text('echo "$NAME"'), 'Hello Linux')
  assert.equal(s.text("echo '$NAME'"), '$NAME')
  assert.equal(s.text('echo \\$NAME'), '$NAME')
  assert.equal(s.text('cd notes && echo "$PWD"'), s.state.cwd)
  s.run('unset NAME')
  assert.equal(s.text('echo "${NAME}"'), '')
  s.run('export __proto__=invalid', 1)
})

test('unquoted wildcard expands existing files while quoted wildcard stays literal', () => {
  const s = session()
  assert.match(s.text('ls *.txt'), /hosts.txt/)
  assert.match(s.text('find . -maxdepth 1 -type f -name "*.txt"'), /mission.txt/)
  s.run('ls "*.txt"', 1)
  s.run('echo literal > "*.txt"')
  assert.equal(s.text('cat "*.txt"'), 'literal')
})

test('numeric and symbolic modes affect reads and chmod can restore access', () => {
  const s = session()
  s.run('echo private > secret.txt && chmod 000 secret.txt')
  s.run('cat secret.txt', 1)
  assert.equal(s.text('sudo cat secret.txt'), 'private')
  s.run('chmod u+rw secret.txt')
  assert.equal(s.text('cat secret.txt'), 'private')
  assert.match(s.text('ls -l secret.txt'), /-rw-------/)
  s.run('chmod 755 secret.txt && chmod go-rwx secret.txt')
  assert.match(s.text('stat secret.txt'), /700/)
})

test('ancestor directory permissions govern traversal and reads', () => {
  const s = session()
  s.run('mkdir restricted && echo private > restricted/note && chmod 000 restricted')
  s.run('cd restricted', 1)
  s.run('cat restricted/note', 1)
  assert.equal(s.text('sudo cat restricted/note'), 'private')
})

test('directory copy, no-clobber, removal and errors are stateful', () => {
  const s = session()
  s.run('cp notes new-notes', 1)
  s.run('cp -r notes new-notes')
  assert.equal(readFile(s.state, 'notes/README.md'), readFile(s.state, 'new-notes/README.md'))
  s.run('echo keep > target && cp -n mission.txt target')
  assert.equal(s.text('cat target'), 'keep')
  s.run('rmdir new-notes', 1)
  s.run('rm -r new-notes')
  s.run('ls new-notes', 1)
  s.run('rm -f missing')
  s.run('cp -r notes notes/copy', 1)
  s.run('mv . moved', 1)
})

test('writes and deletion cannot escape simulated writable areas', () => {
  const s = session(), original = readFile(s.state, '/etc/os-release')
  for (const command of ['echo bad > /etc/os-release', 'sudo rm -rf /', 'mkdir /outside', 'cp mission.txt /etc/mission.txt', 'rm -r /home/kali', 'echo bad > ../../../etc/os-release']) s.run(command, 1)
  assert.equal(readFile(s.state, '/etc/os-release'), original)
  s.run('echo temporary > /tmp/note')
  assert.equal(s.text('cat /tmp/note'), 'temporary')
})

test('text commands handle counts, fields, ordering and missing matches', () => {
  const s = session()
  s.run('printf "%s\\n" 10 2 2 1 > numbers.txt')
  assert.equal(s.text('sort -n numbers.txt | uniq -c'), '      1 1\n      2 2\n      1 10')
  assert.equal(s.text('head -n2 numbers.txt'), '10\n2')
  assert.equal(s.text('tail -n 0 numbers.txt'), '')
  assert.equal(s.text('tail -n 1 numbers.txt'), '1')
  assert.equal(s.text('cut -d: -f1 /etc/passwd'), 'root\nkali')
  assert.equal(s.text('grep -nc 200 access.log'), '2')
  assert.equal(s.text('grep -n ^10 numbers.txt'), '1:10')
  assert.equal(s.text('grep -v 2 numbers.txt'), '10\n1')
  assert.equal(s.text('grep -F "(x)+" numbers.txt', 1), '')
  s.run('grep "(x+)+$" numbers.txt', 1)
  s.run('printf "%s" 中文 > unicode.txt')
  assert.equal(s.text('wc -lwmc unicode.txt'), '0 1 2 6 unicode.txt')
  s.run('head -n 100000 numbers.txt', 1)
})

test('unsupported flags do not claim successful execution or change files', () => {
  const s = session()
  for (const command of ['ls --invalid', 'grep -R needle .', 'cp --delete mission.txt out', 'printf "%d" 2', 'systemctl mask ssh', 'pacman -Q']) s.run(command, 1)
  assert.match(s.text('awk \'{print $1}\' access.log', 127), /暂只支持中文手册/)
  s.run('LS', 127)
})

test('service state updates port and process queries and logs', () => {
  const s = session('parrot')
  assert.match(s.text('ss -tulpn'), /8080/)
  s.run('systemctl stop lab-web', 1)
  s.run('sudo systemctl stop lab-web')
  assert.doesNotMatch(s.text('ss -tulpn'), /8080/)
  assert.doesNotMatch(s.text('ps aux'), /python3/)
  s.run('systemctl is-active lab-web', 3)
  s.run('sudo systemctl start lab-web')
  assert.match(s.text('journalctl -u lab-web -n 2'), /start lab-web/)
  assert.match(s.text('ss -tulpn'), /8080/)
  s.run('sudo systemctl enable --now lab-web')
  assert.match(s.text('systemctl list-unit-files --state=enabled'), /lab-web/)
})

test('network fixtures are bounded and support report output', () => {
  const s = session()
  assert.match(s.text('nmap -sV -p22,80,443 192.168.56.101 -oN reports/scan.txt'), /443\/tcp closed/)
  assert.match(readFile(s.state, 'reports/scan.txt'), /OpenSSH/)
  assert.match(s.text('curl -I http://192.168.56.101'), /200 OK/)
  s.run('curl -o reports/page.html http://192.168.56.101')
  assert.match(readFile(s.state, 'reports/page.html'), /offline lab/)
  assert.match(s.text('ping -c 2 lab-target'), /2 packets transmitted/)
  for (const command of ['nmap -sV example.com', 'curl https://example.com', 'curl file:///etc/passwd', 'ping -c 100 lab-target', 'nmap -sV -p 99999 lab-target']) s.run(command, 1)
})

test('package operations honor distro and simulated install state', () => {
  const s = session()
  s.run('apt install sleuthkit', 1)
  s.run('apt -s install sleuthkit')
  assert.equal(s.state.packages.sleuthkit, undefined)
  s.run('sudo apt install sleuthkit')
  assert.match(s.text('dpkg -l sleuthkit'), /ii sleuthkit/)
  s.run('sudo apt remove sleuthkit')
  assert.equal(s.state.packages.sleuthkit, undefined)
  s.run('parrot-upgrade', 1)
  const arch = session('blackarch')
  arch.run('apt search nmap', 1)
  assert.match(arch.text('pacman -Sg blackarch-forensic'), /blackarch-forensic sleuthkit/)
  arch.run('pacman -syu', 1)
  arch.run('sudo pacman -Syu --needed sleuthkit')
  assert.match(arch.text('pacman -Qi sleuthkit'), /Name: sleuthkit/)
  assert.doesNotMatch(arch.text('pacman -Ss parrot', 1), /parrot-tools/)
  session('parrot').run('sudo parrot-upgrade')
})

test('history is real, clearing preserves files and sessions are isolated', () => {
  const first = session(), second = session()
  first.run('echo own > user.txt')
  assert.match(first.text('history'), /echo own > user.txt/)
  assert.equal(first.run('clear').clear, true)
  assert.equal(first.text('cat user.txt'), 'own')
  second.run('cat user.txt', 1)
  assert.equal(second.state.history.includes('echo own > user.txt'), false)
})

test('completion offers commands and existing paths', () => {
  const s = session()
  assert.deepEqual(completeCommand(s.state, 'pw'), ['pwd'])
  assert.deepEqual(completeCommand(s.state, 'cat miss'), ['cat /home/kali/lab/mission.txt'])
  assert.deepEqual(completeCommand(s.state, 'cat "incomplete'), [])
})

test('command parsing validates before execution and input is bounded', () => {
  const s = session()
  for (const command of ['echo incomplete "', 'echo hello |', 'echo >', 'true &&', 'echo ok; echo $(whoami)', 'echo `whoami`', 'echo ok &', 'echo hi 2> file', 'x'.repeat(4097)]) s.run(command, 2)
  s.run('touch before && echo "bad', 2)
  assert.equal(s.state.fs[s.state.cwd + '/before'], undefined)
  assert.equal(s.text('echo "$HOME";'), '/home/kali')
})

test('mission completion requires actual successful execution, including in command chains', () => {
  const s = session()
  assert.equal(s.run('echo "nmap -sV 192.168.56.101"').missionCompleted, false)
  assert.equal(s.run('false && nmap -sV 192.168.56.101', 1).missionCompleted, false)
  assert.equal(s.run('nmap -sv 192.168.56.101', 1).missionCompleted, false)
  assert.equal(s.run('sudo nmap -sV 192.168.56.101 | grep 22').missionCompleted, true)
})

test('all published challenge questions still load their mission and execute', () => {
  const feed = JSON.parse(readFileSync(new URL('../public/data/challenge-feed.json', import.meta.url)))
  for (const [id, questions] of Object.entries(feed.questions)) for (const question of questions) {
    const distro = fixture(id)
    distro.mission = question; distro.terminal.responses = question.terminalResponses
    const state = createSandbox(distro)
    assert.equal(readFile(state, 'mission.txt'), question.terminalResponses['cat mission.txt'].join('\n') + '\n')
    const result = executeSandbox(state, question.command)
    assert.equal(result.code, 0, `${id}: ${question.uid}`)
    assert.equal(result.missionCompleted, true)
  }
})

test('failed command transactions do not mutate previous caller state', () => {
  const previous = createSandbox(fixture())
  const snapshot = structuredClone(previous)
  const result = executeSandbox(previous, 'mkdir -p one /outside')
  assert.equal(result.code, 1)
  assert.deepEqual(previous, snapshot)
  assert.equal(result.state.fs[previous.cwd + '/one'], undefined)
})

test('user supplied names cannot access inherited properties', () => {
  const s = session()
  for (const name of ['__proto__', 'constructor', 'toString']) {
    s.run(`man ${name}`, 1)
    s.run(`sudo systemctl stop ${name}`, 1)
    s.run(`sudo apt install ${name}`, 1)
  }
  assert.equal(s.text('echo "$toString"'), '')
  assert.equal({}.active, undefined)
})

test('Parrot mission requires the relevant simulated listeners to be available', () => {
  const s = session('parrot')
  assert.equal(s.run('sudo systemctl stop lab-web && ss -tulpn').missionCompleted, false)
  assert.equal(s.run('sudo systemctl start lab-web && ss -tulpn').missionCompleted, true)
})

test('quoted-path completion and data limits are explicit', () => {
  const s = session()
  s.run('touch "space name.txt"')
  assert.deepEqual(completeCommand(s.state, 'cat space'), ["cat '/home/kali/lab/space name.txt'"])
  s.run('printf "%s" ' + 'a'.repeat(3000) + ' > size.txt')
  for (let i = 0; i < 4; i++) s.run('cat size.txt size.txt > larger.txt && mv larger.txt size.txt')
  s.run('cat size.txt size.txt > larger.txt', 1)
  assert.equal(readFile(s.state, 'size.txt').length, 48000)
})
