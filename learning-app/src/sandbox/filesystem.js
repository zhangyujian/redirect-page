export const FILE_LIMIT = 65536
const MAX_ENTRIES = 500
export const byteLength = text => new TextEncoder().encode(text).length
export const textLines = text => text ? text.replace(/\n$/, '').split('\n') : []
export const parentPath = path => path.slice(0, path.lastIndexOf('/')) || '/'
export const baseName = path => path.split('/').filter(Boolean).at(-1) || '/'

export function resolvePath(state, input = '.') {
  let path = input
  if (path === '~' || path.startsWith('~/')) path = state.home + path.slice(1)
  if (!path.startsWith('/')) path = `${state.cwd}/${path}`
  const parts = []
  for (const item of path.split('/')) {
    if (item === '..') parts.pop()
    else if (item && item !== '.') parts.push(item)
  }
  return '/' + parts.join('/')
}

export function displayPath(state, path = state.cwd) {
  return path === state.home || path.startsWith(state.home + '/') ? '~' + path.slice(state.home.length) : path
}

export function entryAt(state, path) {
  const entry = state.fs[path]
  if (!entry) throw new Error(`${path}: No such file or directory（路径不存在）`)
  return entry
}

export function checkAccess(state, path, mask, root = false) {
  if (!root) {
    let ancestor = parentPath(path)
    while (true) {
      const directory = entryAt(state, ancestor)
      if (directory.type !== 'dir' || !(parseInt(directory.mode[directory.owner === state.user ? 0 : 2], 8) & 1)) throw new Error(`${ancestor}: Permission denied（目录不可遍历）`)
      if (ancestor === '/') break
      ancestor = parentPath(ancestor)
    }
  }
  const entry = entryAt(state, path)
  if (!root && !(parseInt(entry.mode[entry.owner === state.user ? 0 : 2], 8) & mask)) throw new Error(`${path}: Permission denied（权限不足）`)
  return entry
}

export function readFile(state, input, root = false) {
  const path = resolvePath(state, input), entry = checkAccess(state, path, 4, root)
  if (entry.type !== 'file') throw new Error(`${input}: Is a directory（这是目录）`)
  return entry.content
}

export function writablePath(state, input, root = false) {
  const path = resolvePath(state, input)
  if (!(path.startsWith(state.home + '/') || path.startsWith('/tmp/'))) throw new Error('练习写入仅限当前用户家目录和 /tmp；系统样本为只读。')
  if (entryAt(state, parentPath(path)).type !== 'dir') throw new Error('父路径不是目录。')
  checkAccess(state, parentPath(path), 2, root)
  checkAccess(state, parentPath(path), 1, root)
  return path
}

export function writeFile(state, input, content, append = false, root = false) {
  const path = writablePath(state, input, root), previous = state.fs[path]
  if (previous?.type === 'dir') throw new Error(`${input}: Is a directory`)
  if (previous) checkAccess(state, path, 2, root)
  const next = (append ? previous?.content || '' : '') + content
  if (byteLength(next) > FILE_LIMIT) throw new Error('单个虚拟文件最多 64 KiB，请缩小练习数据。')
  const total = Object.entries(state.fs).reduce((size, [name, entry]) => size + (name !== path && entry.type === 'file' ? byteLength(entry.content) : 0), byteLength(next))
  if (total > 1048576) throw new Error('虚拟文件总容量达到 1 MiB 上限，请清理或重置沙盒。')
  if (!previous && Object.keys(state.fs).length >= MAX_ENTRIES) throw new Error('虚拟文件数量达到上限，请清理或重置沙盒。')
  state.fs[path] = { type: 'file', content: next, mode: previous?.mode || '644', owner: previous?.owner || (root ? 'root' : state.user), modified: ++state.tick }
}

export function makeDir(state, input, parents = false, root = false) {
  const path = resolvePath(state, input)
  if (state.fs[path]) {
    if (parents && state.fs[path].type === 'dir') return
    throw new Error(`${input}: File exists（已存在）`)
  }
  if (parents && !state.fs[parentPath(path)]) makeDir(state, parentPath(path), true, root)
  writablePath(state, path, root)
  if (Object.keys(state.fs).length >= MAX_ENTRIES) throw new Error('虚拟文件数量达到上限。')
  state.fs[path] = { type: 'dir', mode: '755', owner: root ? 'root' : state.user, modified: ++state.tick }
}

export function children(state, path) {
  return Object.keys(state.fs).filter(p => p !== path && parentPath(p) === path).sort()
}

export function globRegex(pattern) {
  return new RegExp('^' + [...pattern].map(c => c === '*' ? '[^/]*' : c === '?' ? '[^/]' : c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('') + '$')
}

export function expandGlob(state, word) {
  if (!/[?*]/.test(word)) return [word]
  const absolute = resolvePath(state, word), matcher = globRegex(absolute)
  const patternParts = absolute.split('/')
  const matches = Object.keys(state.fs).filter(path => matcher.test(path) && path.split('/').every((part, i) => !part.startsWith('.') || patternParts[i]?.startsWith('.'))).sort()
  return matches.length ? matches : [word]
}

export function modeString(entry) {
  return (entry.type === 'dir' ? 'd' : '-') + [...entry.mode].map(digit => {
    const n = Number(digit)
    return `${n & 4 ? 'r' : '-'}${n & 2 ? 'w' : '-'}${n & 1 ? 'x' : '-'}`
  }).join('')
}

export function seedFiles(state, distro) {
  function dir(path, owner = 'root') { state.fs[path] = { type: 'dir', mode: '755', owner, modified: 0 } }
  function file(path, content, owner = 'root') { state.fs[path] = { type: 'file', content, mode: '644', owner, modified: 0 } }
  for (const path of ['/', '/home', '/tmp', '/etc', '/var', '/var/log', '/usr', '/usr/bin']) dir(path)
  state.fs['/tmp'].mode = '777'
  dir(state.home, state.user)
  dir(state.cwd, state.user)
  for (const name of ['notes', 'reports', 'tools']) dir(`${state.cwd}/${name}`, state.user)
  const samples = {
    'mission.txt': (distro.terminal.responses['cat mission.txt'] || [distro.mission.description, `练习命令：${distro.mission.command}`]).join('\n') + '\n',
    'notes/README.md': '# 沙盒练习笔记\n只操作自有或授权环境。\n记录命令、输出和结论。\n',
    'tools/README.md': '输入 help 查看实际支持的命令和参数。\n所有网络、包和服务数据均为离线样本。\n',
    'hosts.txt': '192.168.56.101\n127.0.0.1\n192.168.56.101\n',
    'access.log': '192.168.56.10 GET / 200\n192.168.56.20 GET /login 401\n192.168.56.10 GET /docs 200\n192.168.56.30 GET /missing 404\n',
    'services.csv': 'name,port,state\nssh,22,open\nhttp,80,open\ndns,53,local\n',
    '.lab-config': 'MODE=offline\n',
  }
  for (const [name, content] of Object.entries(samples)) file(`${state.cwd}/${name}`, content, state.user)
  file('/etc/os-release', `NAME="${distro.name}"\nID=${distro.id}\nID_LIKE=${distro.id === 'pentoo' ? 'gentoo' : distro.id === 'blackarch' ? 'arch' : 'debian'}\nPRETTY_NAME="${distro.name} (Sandbox)"\n`)
  if (distro.id === 'pentoo') {
    for (const path of ['/etc/portage', '/etc/portage/repos.conf', '/var/lib', '/var/lib/portage']) dir(path)
    file('/etc/portage/make.conf', '# Offline sample, not a recommended host configuration\nCOMMON_FLAGS="-O2 -pipe"\nUSE="ssl"\n')
    file('/etc/portage/repos.conf/pentoo.conf', '# Offline repository description; no network synchronization\n[pentoo]\nlocation = /var/db/repos/pentoo\n')
    file('/var/lib/portage/world', 'net-analyzer/nmap\nnet-misc/curl\n')
    file('/var/log/emerge.log', 'Sep 02 sandbox: repository metadata sample loaded\nSep 02 sandbox: no real build or installation performed\n')
  }
  file('/etc/passwd', `root:x:0:0:root:/root:/bin/bash\n${state.user}:x:1000:1000:Lab user:${state.home}:/bin/bash\n`)
  file('/etc/hosts', '127.0.0.1 localhost\n192.168.56.101 lab-target\n')
  file('/etc/resolv.conf', 'nameserver 192.168.56.1\n')
  file('/var/log/auth.log', 'Sep 02 10:00:00 lab sshd[744]: Accepted publickey for labuser from 192.168.56.10\nSep 02 10:01:00 lab sshd[744]: Failed password for test from 192.168.56.20\nSep 02 10:02:00 lab sudo: session opened for user root\n')
}
