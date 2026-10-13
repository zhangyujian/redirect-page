import { options, positiveNumber } from './shell.js'
import { baseName, byteLength, checkAccess, children, entryAt, globRegex, makeDir, modeString, parentPath, readFile, resolvePath, textLines, writablePath, writeFile } from './filesystem.js'

const output = (stdout = '', code = 0) => ({ stdout, code })
const linesOutput = (lines, code = 0) => output(lines.length ? lines.join('\n') + '\n' : '', code)
const required = (items, count = 1) => { if (items.length < count) throw new Error('缺少操作对象，请输入 help 命令名 查看示例。') }

export function runFileCommand(state, name, args, stdin, root) {
  if (name === 'pwd') {
    const { rest } = options(args, 'LP'); if (rest.length) throw new Error('pwd 不接受路径参数。')
    return linesOutput([state.cwd])
  }
  if (name === 'cd') {
    const { rest } = options(args, 'LP')
    if (rest.length > 1) throw new Error('cd: too many arguments')
    const destination = rest[0] === '-' ? state.previous : resolvePath(state, rest[0] || state.home)
    if (!destination) throw new Error('cd: OLDPWD not set')
    if (checkAccess(state, destination, 1, root).type !== 'dir') throw new Error('cd: Not a directory')
    state.previous = state.cwd; state.cwd = destination
    state.env.OLDPWD = state.previous; state.env.PWD = destination
    return rest[0] === '-' ? linesOutput([destination]) : output()
  }
  if (name === 'ls' || name === 'tree') {
    const { opts, rest } = options(args, name === 'ls' ? 'laAh1drtFp' : 'ad', name === 'tree' ? 'L' : '', { all: 'a', 'almost-all': 'A' })
    const result = [], depth = positiveNumber(opts.L, 3, 10)
    function label(path, display) {
      const entry = entryAt(state, path)
      const suffix = entry.type === 'dir' && (opts.F || opts.p || name === 'tree') ? '/' : ''
      const size = entry.type === 'dir' ? 4096 : byteLength(entry.content)
      const formattedSize = opts.h && size >= 1024 ? `${(size / 1024).toFixed(1)}K` : size
      return opts.l ? `${modeString(entry)} 1 ${entry.owner} ${entry.owner} ${formattedSize} ${display}${suffix}` : display + suffix
    }
    function visit(path, level) {
      if (level >= depth) return
      checkAccess(state, path, 4, root)
      for (const child of children(state, path).filter(p => opts.a || !baseName(p).startsWith('.'))) {
        if (opts.d && state.fs[child].type !== 'dir') continue
        result.push('  '.repeat(level + 1) + label(child, baseName(child)))
        if (state.fs[child].type === 'dir') visit(child, level + 1)
      }
    }
    for (const input of rest.length ? rest : ['.']) {
      const path = resolvePath(state, input), entry = entryAt(state, path)
      if (name === 'tree') { result.push(input); if (entry.type === 'dir') visit(path, 0); continue }
      if (entry.type === 'file' || opts.d) { result.push(label(path, input)); continue }
      checkAccess(state, path, 4, root)
      let list = children(state, path).filter(p => opts.a || opts.A || !baseName(p).startsWith('.'))
      if (opts.t) list.sort((a, b) => state.fs[b].modified - state.fs[a].modified)
      if (opts.r) list.reverse()
      if (rest.length > 1) result.push(input + ':')
      if (opts.a) result.push(label(path, '.'), label(parentPath(path), '..'))
      result.push(...list.map(p => label(p, baseName(p))))
    }
    return linesOutput(result)
  }
  if (name === 'mkdir' || name === 'touch') {
    const { opts, rest } = options(args, name === 'mkdir' ? 'pv' : 'c', '', name === 'mkdir' ? { parents: 'p' } : {})
    required(rest)
    for (const input of rest) {
      if (name === 'mkdir') makeDir(state, input, opts.p, root)
      else {
        const path = resolvePath(state, input)
        if (state.fs[path]) { writablePath(state, path, root); checkAccess(state, path, 2, root); state.fs[path].modified = ++state.tick }
        else if (!opts.c) writeFile(state, path, '', false, root)
      }
    }
    return opts.v ? linesOutput(rest.map(p => `mkdir: created directory '${p}'`)) : output()
  }
  if (name === 'cp' || name === 'mv') {
    const { opts, rest } = options(args, name === 'cp' ? 'rRnv' : 'nv')
    required(rest, 2)
    const target = resolvePath(state, rest.at(-1)), sources = rest.slice(0, -1)
    if (sources.length > 1 && state.fs[target]?.type !== 'dir') throw new Error('复制或移动多个对象时，目标必须是目录。')
    const messages = []
    for (const input of sources) {
      const source = resolvePath(state, input), entry = entryAt(state, source)
      const destination = state.fs[target]?.type === 'dir' ? `${target}/${baseName(source)}` : target
      if (source === destination || destination.startsWith(source + '/')) throw new Error('不能复制或移动到自身或自己的子目录。')
      writablePath(state, destination, root)
      if (name === 'mv') {
        writablePath(state, source, root)
        if (state.cwd === source || state.cwd.startsWith(source + '/')) throw new Error('请先离开此目录再移动它。')
      }
      if (opts.n && state.fs[destination]) continue
      if (entry.type === 'dir' && name === 'cp' && !(opts.r || opts.R)) throw new Error('复制目录需要 cp -r。')
      if (entry.type === 'dir' && state.fs[destination]) throw new Error('沙盒暂不合并已有目录，请选择新的目标目录。')
      const all = [source, ...Object.keys(state.fs).filter(p => p.startsWith(source + '/')).sort((a, b) => a.length - b.length)]
      for (const path of all) {
        const dest = destination + path.slice(source.length), node = state.fs[path]
        if (node.type === 'dir') makeDir(state, dest, false, root)
        else writeFile(state, dest, readFile(state, path, root), false, root)
        state.fs[dest].mode = node.mode
      }
      if (name === 'mv') for (const path of all) delete state.fs[path]
      messages.push(`${input} -> ${destination}`)
    }
    return opts.v ? linesOutput(messages) : output()
  }
  if (name === 'rm' || name === 'rmdir') {
    const { opts, rest } = options(args, name === 'rm' ? 'rRfvd' : 'v')
    if (!rest.length && opts.f) return output()
    required(rest)
    const removed = []
    for (const input of rest) {
      const path = resolvePath(state, input)
      if (!state.fs[path] && opts.f) continue
      const entry = entryAt(state, path)
      writablePath(state, path, root)
      if (path === state.cwd || state.cwd.startsWith(path + '/')) throw new Error('请先离开此目录再删除它。')
      if (name === 'rmdir' && entry.type !== 'dir') throw new Error('rmdir: Not a directory')
      const descendants = Object.keys(state.fs).filter(p => p.startsWith(path + '/'))
      if (entry.type === 'dir') {
        if (!(opts.r || opts.R || opts.d || name === 'rmdir')) throw new Error('rm: Is a directory（使用 -r 递归删除虚拟目录）')
        if (descendants.length && !(opts.r || opts.R)) throw new Error('Directory not empty（目录非空）')
      }
      for (const candidate of [path, ...descendants]) delete state.fs[candidate]
      removed.push(`removed '${input}'`)
    }
    return opts.v ? linesOutput(removed) : output()
  }
  if (name === 'chmod') {
    const { rest } = options(args); required(rest, 2)
    const mode = rest[0]
    for (const input of rest.slice(1)) {
      const path = writablePath(state, input, root), entry = entryAt(state, path)
      if (!root && entry.owner !== state.user) throw new Error('chmod: Operation not permitted')
      if (/^[0-7]{3}$/.test(mode)) entry.mode = mode
      else {
        const match = mode.match(/^([ugoa]+)([+=-])([rwx]+)$/)
        if (!match) throw new Error('沙盒支持三位八进制权限或 u/g/o/a 的单项表达式，例如 600、u+x、go-rwx。')
        const [, who, op, permissions] = match
        const mask = [...new Set(permissions)].reduce((n, c) => n | ({ r: 4, w: 2, x: 1 }[c]), 0)
        entry.mode = [...entry.mode].map((digit, i) => {
          if (!who.includes('a') && !who.includes('ugo'[i])) return digit
          const n = Number(digit)
          return String(op === '+' ? n | mask : op === '-' ? n & ~mask : mask)
        }).join('')
      }
    }
    return output()
  }
  if (name === 'stat' || name === 'file' || name === 'du') {
    const { rest } = options(args, name === 'du' ? 'sh' : '')
    const result = []
    for (const input of rest.length ? rest : ['.']) {
      const path = resolvePath(state, input), entry = entryAt(state, path)
      const size = entry.type === 'file' ? byteLength(entry.content) : 4096
      if (name === 'stat') result.push(`File: ${input}`, `Size: ${size}  Type: ${entry.type}`, `Access: (${entry.mode}/${modeString(entry)})  Uid: ${entry.owner}`)
      else if (name === 'file') result.push(`${input}: ${entry.type === 'dir' ? 'directory' : size ? 'Unicode text, UTF-8 text' : 'empty'}`)
      else {
        const total = [path, ...Object.keys(state.fs).filter(p => p.startsWith(path + '/'))].reduce((n, p) => n + (state.fs[p].type === 'dir' ? 4096 : byteLength(state.fs[p].content)), 0)
        result.push(`${Math.ceil(total / 1024)}K\t${input}`)
      }
    }
    return linesOutput(result)
  }
  if (name === 'find') {
    const inputs = [...args], start = !inputs[0]?.startsWith('-') ? inputs.shift() || '.' : '.'
    const filters = {}
    while (inputs.length) {
      const flag = inputs.shift()
      if (flag === '-print') continue
      if (!['-maxdepth', '-type', '-name'].includes(flag)) throw new Error('find 支持 -maxdepth、-type f/d、-name 通配符、-print。')
      const value = inputs.shift()
      if (value === undefined) throw new Error(`${flag} 缺少值。`)
      filters[flag] = value
    }
    if (filters['-type'] && !['f', 'd'].includes(filters['-type'])) throw new Error('find: -type 仅支持 f 或 d。')
    const maxDepth = positiveNumber(filters['-maxdepth'], 100, 100), path = resolvePath(state, start)
    entryAt(state, path)
    const matches = [path, ...Object.keys(state.fs).filter(p => p.startsWith(path === '/' ? '/' : path + '/') && p !== path).sort()].filter(p => {
      const depth = p === path ? 0 : p.slice(path.length).split('/').filter(Boolean).length
      return depth <= maxDepth && (!filters['-type'] || state.fs[p].type === (filters['-type'] === 'f' ? 'file' : 'dir')) && (!filters['-name'] || globRegex(filters['-name']).test(baseName(p)))
    })
    return linesOutput(matches.map(p => start.startsWith('/') ? p : (start.replace(/\/$/, '') + p.slice(path === '/' ? 0 : path.length))))
  }
  if (name === 'basename' || name === 'dirname') {
    const { rest } = options(args); required(rest)
    return linesOutput(rest.map(path => name === 'basename' ? baseName(path) : (path.replace(/\/+$/, '').includes('/') ? parentPath(path.replace(/\/+$/, '')) : '.')))
  }
  if (name === 'tee') {
    const { opts, rest } = options(args, 'a', '', { append: 'a' })
    for (const path of rest) writeFile(state, path, stdin, opts.a, root)
    return output(stdin)
  }
  return null
}

export function runTextCommand(state, name, args, stdin, root) {
  if (!['cat', 'head', 'tail', 'grep', 'sort', 'uniq', 'wc', 'cut'].includes(name)) return null
  const specifications = {
    cat: ['n', '', {}], head: ['', 'n', { lines: 'n:' }], tail: ['', 'n', { lines: 'n:' }],
    grep: ['Fivnc', '', { 'fixed-strings': 'F', 'ignore-case': 'i', invert: 'v' }],
    sort: ['nru', '', {}], uniq: ['cd', '', {}], wc: ['lwmc', '', {}], cut: ['s', 'df', {}],
  }
  const { opts, rest } = options(args, ...specifications[name])
  const pattern = name === 'grep' ? rest.shift() : undefined
  if (name === 'grep' && pattern === undefined) throw new Error('grep 缺少搜索内容。')
  let predicate
  if (name === 'grep') {
    if (opts.F) predicate = text => (opts.i ? text.toLowerCase() : text).includes(opts.i ? pattern.toLowerCase() : pattern)
    else {
      const literal = pattern.replace(/^\^/, '').replace(/\$$/, '')
      if (/[.*+?[\]{}()|\\^$]/.test(literal)) throw new Error('沙盒仅支持普通文本、^开头和$结尾；匹配特殊符号请使用 grep -F。')
      const expected = opts.i ? literal.toLowerCase() : literal
      predicate = text => {
        const value = opts.i ? text.toLowerCase() : text
        if (pattern.startsWith('^') && pattern.endsWith('$')) return value === expected
        if (pattern.startsWith('^')) return value.startsWith(expected)
        if (pattern.endsWith('$')) return value.endsWith(expected)
        return value.includes(expected)
      }
    }
  }
  const sources = rest.length ? rest.map(path => ({ path, text: path === '-' ? stdin : readFile(state, path, root) })) : [{ path: '', text: stdin }]
  const allText = sources.map(s => s.text).join(''), allLines = textLines(allText)
  if (name === 'cat') return opts.n ? linesOutput(allLines.map((line, i) => `${String(i + 1).padStart(6)}  ${line}`)) : output(allText)
  if (name === 'head' || name === 'tail') {
    const count = positiveNumber(opts.n, 10)
    return linesOutput(sources.flatMap(source => {
      const lines = textLines(source.text), selected = name === 'head' ? lines.slice(0, count) : count ? lines.slice(-count) : []
      return sources.length > 1 ? [`==> ${source.path} <==`, ...selected] : selected
    }))
  }
  if (name === 'grep') {
    let matched = false
    const result = sources.flatMap(source => {
      const found = textLines(source.text).map((line, i) => ({ line, i })).filter(({ line }) => opts.v ? !predicate(line) : predicate(line))
      if (found.length) matched = true
      const prefix = sources.length > 1 ? source.path + ':' : ''
      return opts.c ? [prefix + found.length] : found.map(({ line, i }) => prefix + (opts.n ? `${i + 1}:` : '') + line)
    })
    return linesOutput(result, matched ? 0 : 1)
  }
  if (name === 'sort') {
    let sorted = [...allLines].sort((a, b) => opts.n ? (parseFloat(a) || 0) - (parseFloat(b) || 0) || (a < b ? -1 : a > b ? 1 : 0) : a < b ? -1 : a > b ? 1 : 0)
    if (opts.u) sorted = [...new Set(sorted)]
    if (opts.r) sorted.reverse()
    return linesOutput(sorted)
  }
  if (name === 'uniq') {
    const groups = []
    for (const line of allLines) {
      if (groups.at(-1)?.line === line) groups.at(-1).count++
      else groups.push({ line, count: 1 })
    }
    return linesOutput(groups.filter(g => !opts.d || g.count > 1).map(g => (opts.c ? `${String(g.count).padStart(7)} ` : '') + g.line))
  }
  if (name === 'wc') {
    const selected = Object.keys(opts).length ? 'lwmc'.split('').filter(k => opts[k]) : ['l', 'w', 'c']
    function count(source) {
      const counts = { l: (source.text.match(/\n/g) || []).length, w: source.text.trim() ? source.text.trim().split(/\s+/u).length : 0, m: [...source.text].length, c: byteLength(source.text) }
      return selected.map(k => counts[k]).join(' ') + (source.path ? ` ${source.path}` : '')
    }
    return linesOutput([...sources.map(count), ...(sources.length > 1 ? [count({ path: 'total', text: allText })] : [])])
  }
  if (name === 'cut') {
    if (!opts.f || !/^\d+(?:-\d+)?(?:,\d+(?:-\d+)?)*$/.test(opts.f)) throw new Error('cut 需要 -f 字段号，例如 cut -d: -f1,3 /etc/passwd。')
    const delimiter = opts.d === undefined ? '\t' : opts.d
    if ([...delimiter].length !== 1) throw new Error('cut 分隔符必须是单个字符。')
    const fields = new Set()
    for (const part of opts.f.split(',')) {
      const [start, end = start] = part.split('-').map(Number)
      if (!start || end < start || end > 1000) throw new Error('字段范围必须在 1 至 1000 之间。')
      for (let i = start; i <= end; i++) fields.add(i)
    }
    return linesOutput(allLines.filter(line => !opts.s || line.includes(delimiter)).map(line => !line.includes(delimiter) ? line : line.split(delimiter).filter((_, i) => fields.has(i + 1)).join(delimiter)))
  }
}
