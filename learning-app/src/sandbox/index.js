import { getDistroCommands } from '../data/commandCatalog.js'
import { expandWord, options, parseShell } from './shell.js'
import { displayPath, expandGlob, FILE_LIMIT, readFile, seedFiles, textLines, writeFile } from './filesystem.js'
import { runFileCommand, runTextCommand } from './fileCommands.js'
import { runSystemCommand, packageSamples } from './systemCommands.js'

export { displayPath }

const sharedCommands = {
  help: 'help [命令]：支持范围；help all：全部命令',
  man: 'man [1|8] 命令；man -k 关键词；中文学习摘要直接输出',
  apropos: 'apropos 关键词：搜索本系统中文手册', whatis: 'whatis 命令...：查询一句话说明',
  which: 'which 命令...', type: 'type [-a|-t] 命令...', command: 'command -v 命令...', compgen: 'compgen -c [前缀]',
  pwd: 'pwd [-L|-P]', cd: 'cd [目录|..|~|-]', ls: 'ls [-laAh1drtFp] [路径...]；一行一个文件', tree: 'tree [-a|-d] [-L 深度] [目录]',
  mkdir: 'mkdir [-p|-v] 目录...', touch: 'touch [-c] 文件...', cp: 'cp [-r|-R|-n|-v] 源... 目标', mv: 'mv [-n|-v] 源... 目标',
  rm: 'rm [-r|-R|-f|-v|-d] 路径...（仅虚拟文件）', rmdir: 'rmdir [-v] 空目录...', chmod: 'chmod 600 文件；chmod u+x 文件；不支持特殊权限位',
  stat: 'stat 路径...', file: 'file 路径...（文本样本）', du: 'du [-s|-h] [路径...]（KiB 估算）',
  find: 'find [路径] [-maxdepth 深度] [-type f|d] [-name "*.txt"] [-print]', basename: 'basename 路径...', dirname: 'dirname 路径...',
  cat: 'cat [-n] [文件...]', head: 'head [-n 行数] [文件...]', tail: 'tail [-n 行数] [文件...]（不支持持续跟踪）',
  grep: 'grep [-Fivnc] 文本 [文件...]；默认仅普通文本、^开头、$结尾；特殊符号用 -F',
  sort: 'sort [-nru] [文件...]', uniq: 'uniq [-c|-d] [文件]（仅相邻去重）', wc: 'wc [-lwmc] [文件...]',
  cut: 'cut [-s] -d 分隔符 -f 字段 [文件...]；字段如 1,3 或 1-3', tee: 'tee [-a] [文件...]',
  echo: 'echo [-n|-e|-E] 文本...', printf: 'printf 格式 [值...]；支持 %s、%%、\\n、\\t',
  env: 'env：查看模拟环境变量', printenv: 'printenv [变量...]', export: 'export NAME=value ...（不支持分词扩展）', unset: 'unset NAME ...',
  history: 'history：本终端真实输入历史；上下方向键回填', clear: 'clear：清屏，不删除虚拟文件',
  true: 'true：退出码 0', false: 'false：退出码 1', sudo: 'sudo 命令...（模拟提权，仍不能改真实系统）',
  whoami: 'whoami', id: 'id [-u|-g] [-n]', groups: 'groups', hostname: 'hostname', uname: 'uname [-asrmn]',
  date: 'date [-u]（固定模拟时间，ISO 格式）', uptime: 'uptime [-p]（模拟快照）', free: 'free [-h|-m]', df: 'df [-h|-T|-i]（固定快照）', lsblk: 'lsblk [-f]',
  ps: 'ps aux；ps -ef（简化进程表）', pgrep: 'pgrep [-l] 进程名称片段（不支持正则）',
  ip: 'ip [-br] address|addr|a|route|r|link [show]', ss: 'ss [-tulpna]（当前模拟监听服务）',
  systemctl: 'systemctl status|is-active|start|stop|restart|enable|disable 服务；list-units/list-unit-files；--now、--no-pager、--type=service、--state=running/enabled',
  journalctl: 'journalctl [-b] [-u 服务] [-n 行数] [--no-pager]（模拟操作日志）',
  ping: 'ping [-c 次数] [-W 秒] [-n] 内置目标；最多 10 次',
  nmap: 'nmap [-sV] [-p 22,80] [-Pn] [-n] [-oN 文件] 内置目标',
  curl: 'curl [-I|-s|-S|-L] [-o 文件] [--max-time 秒] http://内置目标（无真实重定向或网络）',
}
const aptCommands = { apt: 'apt search|show|policy|list|update|full-upgrade|install|remove；-s/--simulate、--names-only、--installed', 'apt-cache': 'apt-cache search|show|policy 包名', dpkg: 'dpkg -l [包名]' }
const archCommands = { pacman: 'pacman -Q/-Qe/-Qi/-Ql/-Qs/-Si/-Ss/-Sg/-Sgg/-Sl/-Syu/-V；-Syu 支持 --needed；保留大小写' }

export function supportedCommands(distroId) {
  if (distroId === 'pentoo') {
    const { systemctl, journalctl, ...common } = sharedCommands
    return { ...common,
      emerge: 'emerge --search/--searchdesc 关键词；--info；--pretend --verbose 包名；-pvuDN @world；sudo emerge --sync（仅模拟索引）',
      equery: 'equery list|files|uses 包名（只读安装样本）',
      eselect: 'eselect profile|news|repository list（只读样本）',
      'rc-status': 'rc-status [default|-a|--all]（OpenRC 模型）',
      'rc-service': 'rc-service 服务 status|start|stop|restart；更改需要 sudo',
      'rc-update': 'rc-update show [default]；sudo rc-update add|del 服务 default',
    }
  }
  return { ...sharedCommands, ...(distroId === 'blackarch' ? archCommands : aptCommands), ...(distroId === 'parrot' ? { 'parrot-upgrade': 'sudo parrot-upgrade', anonsurf: 'anonsurf status（仅离线状态）' } : {}) }
}

export function createSandbox(distro) {
  const user = distro.terminal.user, home = `/home/${user}`
  const cwd = home + distro.terminal.path.replace(/^~/, '')
  const state = {
    id: distro.id, user, home, cwd, previous: null, initialPath: cwd, name: distro.name,
    env: { USER: user, HOME: home, PWD: cwd, SHELL: '/bin/bash', PATH: '/usr/bin:/bin', LANG: 'zh_CN.UTF-8' },
    fs: {}, history: [], code: 0, tick: 0, startedAt: Date.now(), packageRefreshes: 0,
    address: { kali: '192.168.56.10', parrot: '192.168.56.20', blackarch: '192.168.56.30', pentoo: '192.168.56.40' }[distro.id] || '192.168.56.10',
    device: distro.id === 'blackarch' ? 'enp0s3' : 'eth0',
    services: { ssh: { active: true, enabled: true, description: 'OpenSSH server' }, dnsmasq: { active: true, enabled: true, description: 'Local DNS' }, 'lab-web': { active: true, enabled: false, description: 'Lab HTTP server' } },
    journal: distro.id === 'pentoo' ? ['lab OpenRC: started sshd', 'lab OpenRC: started dnsmasq', 'lab OpenRC: started lab-web'] : ['lab systemd: Started ssh.service', 'lab systemd: Started dnsmasq.service', 'lab systemd: Started lab-web.service'],
    packages: Object.fromEntries(['coreutils', 'nmap', 'curl', 'python3'].map(pkg => [pkg, packageSamples[pkg][0]])),
    missionCommand: distro.mission.command,
  }
  seedFiles(state, distro)
  return state
}

function manual(state, args, brief = false) {
  const docs = getDistroCommands(state.id), supported = supportedCommands(state.id)
  let section
  if (/^\d+$/.test(args[0] || '')) section = args.shift()
  const topic = args.join(' ')
  if (!topic) throw new Error('用法：man [章节] 命令，例如 man 1 ls、man 8 pacman。')
  const entries = docs.filter(doc => doc.command === topic || doc.command.startsWith(topic + ' '))
  if (!entries.length && !Object.hasOwn(supported, topic)) throw new Error(`没有 ${topic} 的中文学习摘要。输入 help all 查看可练习命令。`)
  const matching = section ? entries.filter(entry => (entry.source.url.match(/\.(\d)(?=\.|$)/)?.[1] || '1') === section) : entries
  if (section && !matching.length) throw new Error(`第 ${section} 节没有 ${topic} 的学习手册。试试 man ${topic}。`)
  if (brief) return matching.map(doc => `${doc.command} - ${doc.summary}`).join('\n') + '\n'
  const lines = [`${topic.toUpperCase()}${section ? `(${section})` : ''} · 中文学习手册`, '说明：这是应用内学习摘要，不是完整 Linux man 分页器；输出后可直接输入下一条命令。']
  for (const entry of matching) {
    lines.push('', `${entry.command} — ${entry.summary}`, `用法：${entry.syntax}`, '参数：', ...entry.options.map(o => `  ${o.flag}  ${o.description}`), '示例：', ...entry.examples.map(e => `  ${e.code}\n  ${e.explanation}`), `注意：${entry.note}`, `完整参考：${entry.source.url}`)
  }
  lines.push('', '当前沙盒支持：', supported[topic.split(' ')[0]] || '此工具暂只提供手册阅读，不模拟执行。')
  return lines.join('\n') + '\n'
}

function runBuiltIn(state, argv, root) {
  const [name, ...args] = argv, supported = supportedCommands(state.id)
  const out = (stdout = '', code = 0) => ({ stdout, code })
  if (name === 'help') {
    if (args.length && args[0] !== 'all') return out(manual(state, [...args]))
    return out([`当前 ${state.name} 支持 ${Object.keys(supported).length} 个命令入口（仅列明的参数子集）：`, ...Object.values(supported), '', '组合：|、>、>>、<、;、&&、||；引号、$HOME、$USER、$PWD、$?；文件名 * / ? 通配符。', '不支持完整 Bash 脚本、命令替换、后台进程、交互编辑器或真实网络；未支持的参数会报错。', '沙盒文件仅保存在当前终端内存，离开终端、刷新页面或重置后清空。', '试试：man 1 ls；cat access.log | grep 200 | wc -l；sort hosts.txt | uniq -c'].join('\n') + '\n')
  }
  if (name === 'man' && args[0] !== '-k') return out(manual(state, [...args]))
  if (name === 'apropos' || (name === 'man' && args[0] === '-k')) {
    const query = (name === 'man' ? args.slice(1) : args).join(' ').toLowerCase()
    if (!query) throw new Error('请输入中文或英文搜索关键词。')
    const docs = getDistroCommands(state.id).filter(doc => [doc.command, doc.summary, doc.tag, doc.syntax, doc.source.title].join(' ').toLowerCase().includes(query))
    return out(docs.map(doc => `${doc.command} - ${doc.summary}`).join('\n') + '\n', docs.length ? 0 : 1)
  }
  if (name === 'whatis') {
    if (!args.length) throw new Error('用法：whatis ls chmod')
    return out(args.map(arg => manual(state, [arg], true)).join(''))
  }
  if (['which', 'type', 'command', 'compgen'].includes(name)) {
    const { opts, rest } = options(args, name === 'type' ? 'at' : name === 'command' ? 'vV' : name === 'compgen' ? 'c' : '')
    if (name === 'compgen') {
      if (!opts.c || rest.length > 1) throw new Error('用法：compgen -c [前缀]')
      return out(Object.keys(supported).filter(c => c.startsWith(rest[0] || '')).sort().join('\n') + '\n')
    }
    if (!rest.length || (name === 'command' && !opts.v && !opts.V)) throw new Error('请指定要查询的命令，例如 command -v ls。')
    const builtins = ['cd', 'pwd', 'echo', 'printf', 'help', 'history', 'export', 'unset', 'type', 'command', 'true', 'false']
    const found = rest.filter(c => Object.hasOwn(supported, c))
    return out(found.map(c => name === 'type' && opts.t ? (builtins.includes(c) ? 'builtin' : 'file') : name === 'type' || opts.V ? `${c} is ${builtins.includes(c) ? 'a shell builtin' : '/usr/bin/' + c} (simulated)` : builtins.includes(c) && name !== 'which' ? c : '/usr/bin/' + c).join('\n') + (found.length ? '\n' : ''), found.length === rest.length ? 0 : 1)
  }
  if (name === 'echo') {
    let newline = true, escapes = false, i = 0
    while (/^-[neE]+$/.test(args[i] || '')) { for (const flag of args[i++].slice(1)) { if (flag === 'n') newline = false; else escapes = flag === 'e' } }
    let text = args.slice(i).join(' ')
    if (escapes) text = text.replace(/\\([nt\\])/g, (_, c) => ({ n: '\n', t: '\t', '\\': '\\' }[c]))
    return out(text + (newline ? '\n' : ''))
  }
  if (name === 'printf') {
    if (!args.length) throw new Error('printf 缺少格式，例如 printf "%s\\n" hello')
    const [format, ...values] = args
    if (/%(?![%s])/.test(format)) throw new Error('沙盒 printf 仅支持 %s、%%、\\n、\\t。')
    const slots = (format.replace(/%%/g, '').match(/%s/g) || []).length
    const rounds = slots ? Math.max(1, Math.ceil(values.length / slots)) : 1
    let index = 0, text = ''
    for (let i = 0; i < rounds; i++) text += format.replace(/%%|%s|\\[nt\\]/g, token => token === '%%' ? '%' : token === '%s' ? values[index++] || '' : ({ '\\n': '\n', '\\t': '\t', '\\\\': '\\' }[token]))
    return out(text)
  }
  if (['env', 'printenv', 'export', 'unset'].includes(name)) {
    if (name === 'unset') {
      for (const arg of args) { if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(arg)) throw new Error('变量名无效。'); delete state.env[arg] }
      return out()
    }
    if (name === 'export' && args.length) {
      for (const arg of args) {
        const match = arg.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/s)
        if (!match || ['__proto__', 'constructor', 'prototype'].includes(match[1])) throw new Error('使用 export NAME=value，变量名应为字母、数字或下划线。')
        state.env[match[1]] = match[2]
      }
      return out()
    }
    if (name === 'env' && args.length) throw new Error('沙盒 env 仅显示环境变量，不执行程序。')
    if (name === 'printenv' && args.length) {
      const values = args.filter(arg => Object.hasOwn(state.env, arg)).map(arg => state.env[arg])
      return out(values.join('\n') + (values.length ? '\n' : ''), values.length === args.length ? 0 : 1)
    }
    return out(Object.entries(state.env).map(([key, value]) => `${key}=${value}`).join('\n') + '\n')
  }
  if (name === 'history') { if (args.length) throw new Error('history 暂不支持附加参数。'); return out(state.history.map((line, i) => `${String(i + 1).padStart(4)}  ${line}`).join('\n') + '\n') }
  if (name === 'clear') { if (args.length) throw new Error('clear 不接受参数。'); return { ...out(), clear: true } }
  if (name === 'true' || name === 'false') return out('', name === 'true' ? 0 : 1)
  if (name === 'q' && !args.length) return out('手册已直接输出，没有正在运行的分页器；可继续输入命令。\n')
  if (args.includes('--help') || (['nmap', 'man'].includes(name) && args[0] === '-h')) return out(manual(state, [name]))
  return null
}

function runCommand(state, argv, stdin) {
  let root = false
  if (argv[0] === 'sudo') {
    root = true; argv = argv.slice(1)
    if (!argv.length || argv[0].startsWith('-') || argv[0] === 'sudo') throw new Error('沙盒支持 sudo 命令...，不启动真实 root 会话。')
  }
  const [name, ...args] = argv
  const result = runBuiltIn(state, argv, root) || runFileCommand(state, name, args, stdin, root) || runTextCommand(state, name, args, stdin, root) || runSystemCommand(state, name, args, stdin, root)
  if (result) return { ...result, executed: argv }
  const documented = getDistroCommands(state.id).some(entry => entry.command.split(' ')[0] === name)
  return { stdout: '', stderr: documented ? `${name} 暂只支持中文手册阅读；输入 man ${name} 查看说明，help all 查看可执行范围。\n` : `${name}: command not found（沙盒未支持或大小写不正确）。输入 help all 查看可用命令。\n`, code: 127, executed: [] }
}

export function executeSandbox(previous, raw) {
  let state = structuredClone(previous), groups
  const stdout = [], stderr = [], executed = []
  let clear = false
  state.history = [...state.history, raw].slice(-200)
  try { groups = parseShell(raw) } catch (error) { state.code = 2; return { state, lines: [error.message], code: 2, clear: false, missionCompleted: false } }
  for (const group of groups) {
    if ((group.condition === '&&' && state.code !== 0) || (group.condition === '||' && state.code === 0)) continue
    let pipe = ''
    for (const command of group.commands) {
      const working = structuredClone(state)
      try {
        const argv = command.words.flatMap(word => { const value = expandWord(word, working); return word.glob ? expandGlob(working, value) : [value] })
        let input = pipe, redirect
        for (const redirection of command.redirects) {
          const filename = expandWord(redirection.file, working)
          const paths = redirection.file.glob ? expandGlob(working, filename) : [filename]
          if (paths.length !== 1) throw new Error('重定向需要单个明确文件名。')
          if (redirection.op === '<') input = readFile(working, paths[0])
          else { writeFile(working, paths[0], '', redirection.op === '>>'); redirect = { path: paths[0], append: redirection.op === '>>' } }
        }
        const response = runCommand(working, argv, input)
        if (response.stdout.length > FILE_LIMIT) throw new Error('输出超过 64 KiB，请缩小数据范围。')
        if (redirect) writeFile(working, redirect.path, response.stdout, redirect.append)
        pipe = redirect ? '' : response.stdout
        if (response.stderr) stderr.push(response.stderr)
        working.code = response.code
        if (response.clear) { clear = true; stdout.length = 0 }
        if (response.code === 0 && (!['parrot', 'pentoo'].includes(working.id) || (working.services.dnsmasq.active && working.services['lab-web'].active))) executed.push(response.executed)
        if (group.commands.length === 1) state = working
        else {
          // Pipeline stages run with isolated shell variables/cwd, sharing virtual external state.
          for (const key of ['fs', 'tick', 'packages', 'packageRefreshes', 'services', 'journal']) state[key] = working[key]
          state.code = response.code
        }
      } catch (error) {
        stderr.push(error.message + '\n')
        state.code = 1; pipe = ''
      }
    }
    stdout.push(pipe)
  }
  const mission = previous.missionCommand.trim().split(/\s+/)
  const missionCompleted = executed.some(argv => argv?.length === mission.length && argv.every((arg, i) => arg === mission[i]))
  const lines = textLines(stdout.join('') + stderr.join(''))
  return { state, lines: lines.length > 400 ? [...lines.slice(0, 400), '显示已截断至 400 行；请用 head、grep 或重定向缩小结果。'] : lines, code: state.code, clear, missionCompleted }
}

export function completeCommand(state, input) {
  if (/[|;&<>"']/.test(input)) return []
  const parts = input.split(/\s+/), prefix = parts.pop() || ''
  const candidates = !parts.length ? Object.keys(supportedCommands(state.id)).filter(name => name.startsWith(prefix)) : expandGlob(state, prefix + '*').filter(path => path !== prefix + '*').map(path => path + (state.fs[path]?.type === 'dir' ? '/' : ''))
  return candidates.slice(0, 30).sort().map(word => [...parts, /[\s"'\\$`]/.test(word) ? "'" + word.replace(/'/g, "'\\''") + "'" : word].join(' '))
}

export function sandboxExercises(state) {
  return [
    { title: '帮助与导航', steps: [['阅读 ls 的中文参数说明', 'man 1 ls'], ['查看当前位置', 'pwd'], ['列出隐藏文件与权限', 'ls -lah'], ['浏览两层目录', 'tree -L 2']] },
    { title: '创建与读写', steps: [['创建练习目录', 'mkdir -p ~/practice'], ['进入目录，观察提示符变化', 'cd ~/practice'], ['写入两行内容', 'printf "%s\\n" hello linux > notes.txt'], ['追加内容并查看', 'echo security >> notes.txt && cat -n notes.txt'], ['复制、改名和修改权限', 'cp notes.txt copy.txt && mv copy.txt report.txt && chmod 600 report.txt'], ['核对文件属性', 'stat report.txt']] },
    { title: '日志与管道', steps: [['回到本次实验目录', `cd ${state.initialPath}`], ['筛选访问成功的日志并计数', 'cat access.log | grep 200 | wc -l'], ['统计重复主机', 'sort hosts.txt | uniq -c'], ['提取服务名和端口', 'cut -d, -f1,2 services.csv'], ['保存失败访问记录', 'grep 404 access.log | tee reports/errors.txt'], ['搜索生成的报告', 'find reports -type f -name "*.txt"']] },
    { title: '服务与网络', steps: [['查询模拟网卡', 'ip -br address'], ['查看监听进程', 'ss -tulpn'], ['停止虚拟 Web 服务', state.id === 'pentoo' ? 'sudo rc-service lab-web stop' : 'sudo systemctl stop lab-web'], ['核对 8080 端口已消失', 'ss -tulpn'], ['重新启动并核对状态', state.id === 'pentoo' ? 'sudo rc-service lab-web start && rc-status' : 'sudo systemctl start lab-web && journalctl -u lab-web -n 5'], ['探测内置靶机两个端口', 'nmap -sV -p 22,80 192.168.56.101']] },
    state.id === 'blackarch'
      ? { title: 'BlackArch 包管理', steps: [['阅读正确章节的手册', 'man 8 pacman'], ['查询取证组成员', 'pacman -Sg blackarch-forensic'], ['搜索工具包', 'pacman -Ss sleuthkit'], ['模拟完整升级并安装', 'sudo pacman -Syu --needed sleuthkit'], ['核对已安装包', 'pacman -Qi sleuthkit']] }
      : state.id === 'pentoo'
        ? { title: 'Pentoo / Portage 包计划', steps: [['识别环境', 'emerge --info'], ['搜索候选工具', 'emerge --searchdesc forensic'], ['预览而不安装', 'emerge --pretend --verbose app-forensics/sleuthkit'], ['核对已装工具的文件', 'equery files net-analyzer/nmap'], ['预览整体更新', 'emerge -pvuDN @world']] }
        : { title: `${state.id === 'parrot' ? 'Parrot' : 'Kali'} 包管理`, steps: [['查看软件包说明', 'apt show sleuthkit'], ['预览安装，不改变虚拟状态', 'apt -s install sleuthkit'], ['在虚拟数据库中安装', 'sudo apt install sleuthkit'], ['检查安装状态', 'dpkg -l sleuthkit'], ['检查软件源候选版本', 'apt policy sleuthkit']] },
  ]
}
