// Parse a deliberately small shell language. Nothing is passed to eval or a host shell.
export function parseShell(raw) {
  if (raw.length > 4096) throw new Error('命令过长：每次最多输入 4096 个字符。')
  const tokens = []
  let parts = [], quote = '', started = false, glob = false, tilde = false
  function add(value, expand = true) {
    const last = parts.at(-1)
    if (last?.expand === expand) last.value += value
    else parts.push({ value, expand })
    started = true
  }
  function flush() {
    if (started) tokens.push({ parts, glob, tilde })
    parts = []; started = false; glob = false; tilde = false
  }
  for (let i = 0; i < raw.length; i++) {
    const c = raw[i]
    if (quote === "'") {
      if (c === "'") quote = ''
      else add(c, false)
    } else if (c === '\\' && (quote !== '"' || ['$', '`', '"', '\\'].includes(raw[i + 1]))) {
      if (++i === raw.length) throw new Error('反斜杠后缺少字符。')
      add(raw[i], false)
    } else if (c === '`' || (c === '$' && raw[i + 1] === '(')) {
      throw new Error('沙盒不执行命令替换、脚本或外部程序；请逐条输入练习命令。')
    } else if (quote === '"') {
      if (c === '"') quote = ''
      else add(c)
    } else if (c === '"' || c === "'") {
      quote = c; started = true
    } else if (/\s/.test(c)) flush()
    else if ('|&;<>'.includes(c)) {
      if ('<>'.includes(c) && started && parts.every(p => /^\d+$/.test(p.value))) throw new Error('暂不支持文件描述符重定向，请使用 >、>> 或 <。')
      flush()
      let op = c
      if (['||', '&&', '>>', '<<'].includes(c + raw[i + 1])) op += raw[++i]
      if (op === '&' || op === '<<') throw new Error('暂不支持后台任务或 here-document。')
      tokens.push(op)
    } else if ('()'.includes(c)) throw new Error('暂不支持子 Shell 和分组；可使用 ;、&&、||。')
    else {
      if (!started && c === '~') tilde = true
      if (c === '*' || c === '?') glob = true
      add(c)
    }
  }
  if (quote) throw new Error('引号未闭合，请补上配对的引号。')
  flush()
  const groups = []
  let group = { condition: ';', commands: [] }, command = { words: [], redirects: [] }
  function finishCommand() {
    if (!command.words.length) throw new Error('运算符前后需要命令。')
    group.commands.push(command)
    command = { words: [], redirects: [] }
  }
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]
    if (typeof token !== 'string') command.words.push(token)
    else if (['>', '>>', '<'].includes(token)) {
      const file = tokens[++i]
      if (!file || typeof file === 'string') throw new Error('重定向符号后需要文件名。')
      command.redirects.push({ op: token, file })
    } else {
      finishCommand()
      if (token !== '|') {
        groups.push(group)
        group = { condition: token, commands: [] }
      }
    }
  }
  if (command.words.length || command.redirects.length) finishCommand()
  else if (tokens.length && tokens.at(-1) !== ';') throw new Error('命令不能以此运算符结束。')
  if (group.commands.length) groups.push(group)
  if (groups.reduce((n, g) => n + g.commands.length, 0) > 32) throw new Error('一次最多组合 32 条命令。')
  return groups
}

export function expandWord(token, state) {
  let value = token.parts.map(part => part.expand
    ? part.value.replace(/\$\?|\$\{([A-Za-z_][A-Za-z0-9_]*)\}|\$([A-Za-z_][A-Za-z0-9_]*)/g,
      (match, bracket, name) => match === '$?' ? String(state.code) : (Object.hasOwn(state.env, bracket || name) ? state.env[bracket || name] : ''))
    : part.value).join('')
  if (token.tilde && (value === '~' || value.startsWith('~/'))) value = state.home + value.slice(1)
  return value
}

export function options(args, flags = '', valued = '', long = {}) {
  const opts = {}, rest = []
  let ended = false
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (ended || arg === '-' || !arg.startsWith('-')) { rest.push(arg); continue }
    if (arg === '--') { ended = true; continue }
    if (arg.startsWith('--')) {
      const [key, ...inline] = arg.slice(2).split('=')
      if (!Object.hasOwn(long, key)) throw new Error(`暂不支持参数 --${key}，输入 help 命令名 查看沙盒支持范围。`)
      const target = long[key]
      if (target.endsWith(':')) {
        const value = inline.length ? inline.join('=') : args[++i]
        if (value === undefined) throw new Error(`--${key} 缺少参数值。`)
        opts[target.slice(0, -1)] = value
      } else {
        if (inline.length) throw new Error(`--${key} 不需要参数值。`)
        opts[target] = true
      }
      continue
    }
    for (let j = 1; j < arg.length; j++) {
      const flag = arg[j]
      if (valued.includes(flag)) {
        const value = arg.slice(j + 1) || args[++i]
        if (value === undefined) throw new Error(`-${flag} 缺少参数值。`)
        opts[flag] = value; break
      }
      if (!flags.includes(flag)) throw new Error(`暂不支持参数 -${flag}，输入 help 命令名 查看沙盒支持范围。`)
      opts[flag] = true
    }
  }
  return { opts, rest }
}

export function positiveNumber(value, fallback, maximum = 1000) {
  if (value === undefined) return fallback
  if (!/^\d+$/.test(value) || Number(value) > maximum) throw new Error(`请输入 0 至 ${maximum} 的整数。`)
  return Number(value)
}
