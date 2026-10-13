import { options, positiveNumber } from './shell.js'
import { writeFile } from './filesystem.js'
import { runPentooCommand } from './pentooCommands.js'

const result = (lines = [], code = 0) => ({ stdout: lines.length ? lines.join('\n') + '\n' : '', code })
export const packageSamples = {
  coreutils: ['9.7-sim', 'GNU core file, shell and text utilities', 'base'],
  nmap: ['7.95-sim', 'Network exploration and security auditing', 'blackarch-scanner'],
  curl: ['8.13-sim', 'Transfer data with URLs', 'base'],
  python3: ['3.13-sim', 'Python programming language', 'base'],
  sleuthkit: ['4.12-sim', 'File system forensic tools', 'blackarch-forensic'],
  'bulk-extractor': ['2.1-sim', 'Extract information from forensic images', 'blackarch-forensic'],
  'kali-tools-forensics': ['2026-sim', 'Kali forensic tools metapackage', 'kali'],
  'kali-linux-default': ['2026-sim', 'Kali default tool selection', 'kali'],
  'parrot-tools-forensics': ['2026-sim', 'Parrot forensic tools metapackage', 'parrot'],
}

export function availablePackages(state) {
  return Object.entries(packageSamples).filter(([, p]) => !['kali', 'parrot'].includes(p[2]) || p[2] === state.id)
}

function demandRoot(root) { if (!root) throw new Error('此模拟管理操作需要 sudo 前缀；不会改变真实系统。') }
function serviceName(value = 'ssh') { return value.replace(/\.service$/, '').replace(/^sshd$/, 'ssh') }
function serviceRows(state) {
  return [
    ...(state.services.ssh.active ? [{ proto: 'tcp', address: `${state.address}:22`, process: 'sshd', pid: 744 }] : []),
    ...(state.services.dnsmasq.active ? [{ proto: 'udp', address: '127.0.0.1:53', process: 'dnsmasq', pid: 612 }] : []),
    ...(state.services['lab-web'].active ? [{ proto: 'tcp', address: `${state.address}:8080`, process: 'python3', pid: 904 }] : []),
  ]
}

function localHost(state, host) {
  if (!['localhost', '127.0.0.1', state.address, '192.168.56.101', 'lab-target', '192.168.56.1'].includes(host)) {
    throw new Error('该目标不在内置样本中。仅支持 localhost、当前模拟地址、lab-target / 192.168.56.101 和网关 192.168.56.1；不会访问真实网络。')
  }
  return ['192.168.56.101', 'lab-target'].includes(host) ? 'target' : 'local'
}

export function runSystemCommand(state, name, args, stdin, root) {
  const pentooResult = runPentooCommand(state, name, args, root)
  if (pentooResult) return pentooResult
  if (state.id === 'pentoo' && ['systemctl', 'journalctl'].includes(name)) throw new Error('此 Pentoo 沙盒采用 OpenRC 模型；使用 rc-status、rc-service、rc-update 和样本日志。真实机器应先确认 init 系统。')
  if (['whoami', 'id', 'groups', 'hostname', 'uname', 'date', 'uptime', 'free', 'df', 'lsblk', 'ps', 'pgrep'].includes(name)) {
    const flags = { whoami: '', id: 'ugn', groups: '', hostname: '', uname: 'asrmn', date: 'u', uptime: 'p', free: 'hm', df: 'hTi', lsblk: 'f', ps: 'ef', pgrep: 'l' }
    const positional = name === 'ps' && args[0] === 'aux' ? args.slice(1) : args
    const { opts, rest } = options(positional, flags[name])
    if (name !== 'pgrep' && rest.length) throw new Error(`${name}: 沙盒暂不支持这些参数：${rest.join(' ')}`)
    const user = root ? 'root' : state.user, uid = root ? 0 : 1000
    if (name === 'whoami') return result([user])
    if (name === 'id') return result([opts.u || opts.g ? String(opts.n ? user : uid) : `uid=${uid}(${user}) gid=${uid}(${user}) groups=${uid}(${user})${root ? '' : ',27(sudo)'}`])
    if (name === 'groups') return result([root ? 'root' : `${user} sudo`])
    if (name === 'hostname') return result([`${state.user}-sandbox`])
    if (name === 'uname') return result([opts.a ? `Linux ${state.user}-sandbox 6.12-sim x86_64 GNU/Linux` : [opts.s && 'Linux', opts.n && `${state.user}-sandbox`, opts.r && '6.12-sim', opts.m && 'x86_64'].filter(Boolean).join(' ') || 'Linux'])
    if (name === 'date') return result([new Date(state.startedAt).toISOString(), '模拟时钟固定在本次沙盒创建时间。'])
    if (name === 'uptime') return result(['up 42 minutes (模拟快照), load average: 0.10, 0.06, 0.02'])
    if (name === 'free') return result(['              total   used   free  shared  buff/cache  available', opts.m ? 'Mem:           4096    640   2048      16        1408       3200' : 'Mem:          4.0Gi  640Mi  2.0Gi    16Mi       1.4Gi      3.1Gi', 'Swap:         1.0Gi     0B  1.0Gi'])
    if (name === 'df') return result(opts.i ? ['Filesystem   Inodes IUsed IFree IUse% Mounted on', '/dev/sda1    100000  1000 99000    1% /'] : ['Filesystem Type Size Used Avail Use% Mounted on', '/dev/sda1  ext4  40G  8G   32G  20% /'])
    if (name === 'lsblk') return result(opts.f ? ['NAME FSTYPE LABEL MOUNTPOINTS', 'sda', '  sda1 ext4 sandbox /'] : ['NAME SIZE TYPE MOUNTPOINTS', 'sda   40G disk', '  sda1 40G part /'])
    const processes = [{ user: state.user, pid: 1000, process: 'bash' }, ...serviceRows(state).map(row => ({ ...row, user: row.process === 'python3' ? state.user : 'root' }))]
    if (name === 'pgrep') {
      if (rest.length !== 1) throw new Error('pgrep 需要一个进程名称片段。')
      const matches = processes.filter(p => p.process.includes(rest[0]))
      return result(matches.map(p => `${p.pid}${opts.l ? ' ' + p.process : ''}`), matches.length ? 0 : 1)
    }
    return result(['USER PID COMMAND', ...processes.map(p => `${p.user} ${p.pid} ${p.process}`)])
  }
  if (name === 'ip') {
    const input = args.filter(arg => !['-br', '-brief'].includes(arg))
    const brief = input.length !== args.length
    const object = input[0] || 'address', action = input[1]
    if (input.length > 2 || (action && action !== 'show')) throw new Error('沙盒 ip 支持 address/addr/a、route/r、link，及 show、-br。')
    if (['addr', 'address', 'a'].includes(object)) return result(brief ? ['lo UNKNOWN 127.0.0.1/8', `${state.device} UP ${state.address}/24`] : ['1: lo: <LOOPBACK,UP>', '    inet 127.0.0.1/8 scope host lo', `2: ${state.device}: <BROADCAST,UP>`, `    inet ${state.address}/24 scope global ${state.device}`])
    if (['route', 'r'].includes(object)) return result([`default via 192.168.56.1 dev ${state.device}`, `192.168.56.0/24 dev ${state.device} proto kernel scope link src ${state.address}`])
    if (object === 'link') return result(['1: lo: <LOOPBACK,UP> mtu 65536', `2: ${state.device}: <BROADCAST,UP> mtu 1500`])
    throw new Error('ip: 未支持的对象，输入 help ip 查看范围。')
  }
  if (name === 'ss') {
    const { opts, rest } = options(args, 'tulpna')
    if (rest.length) throw new Error('ss 暂不支持表达式筛选，请使用管道 grep。')
    return result(['Netid State Local Address:Port' + (opts.p ? ' Process' : ''), ...serviceRows(state).filter(row => !(opts.t || opts.u) || (opts.t && row.proto === 'tcp') || (opts.u && row.proto === 'udp')).map(row => `${row.proto} ${row.proto === 'tcp' ? 'LISTEN' : 'UNCONN'} ${row.address}${opts.p ? ` users:(("${row.process}",pid=${row.pid}))` : ''}`)])
  }
  if (name === 'systemctl') {
    const { opts, rest } = options(args, '', '', { 'no-pager': 'noPager', type: 'type:', state: 'state:', now: 'now' })
    const action = rest[0] || 'status', unit = serviceName(rest[1])
    if (rest.length > 2) throw new Error('systemctl 每次操作一个服务。')
    if (opts.type && opts.type !== 'service') throw new Error('模拟器只提供 service 单元。')
    if (opts.state && !['running', 'enabled'].includes(opts.state)) throw new Error('模拟器支持 --state=running 或 enabled。')
    if (['list-units', 'list-unit-files'].includes(action)) return result(Object.entries(state.services).filter(([, s]) => !opts.state || (opts.state === 'running' ? s.active : s.enabled)).map(([key, s]) => `${key}.service ${action === 'list-unit-files' ? (s.enabled ? 'enabled' : 'disabled') : `loaded ${s.active ? 'active running' : 'inactive dead'}`}`))
    if (!Object.hasOwn(state.services, unit)) throw new Error(`Unit ${unit}.service could not be found. 可用：ssh、dnsmasq、lab-web。`)
    const service = state.services[unit]
    if (action === 'status') return result([`${unit}.service - ${service.description}`, `Loaded: loaded (${service.enabled ? 'enabled' : 'disabled'})`, `Active: ${service.active ? 'active (running)' : 'inactive (dead)'}`], service.active ? 0 : 3)
    if (action === 'is-active') return result([service.active ? 'active' : 'inactive'], service.active ? 0 : 3)
    if (!['start', 'stop', 'restart', 'enable', 'disable'].includes(action)) throw new Error('暂不支持此 systemctl 子命令。')
    demandRoot(root)
    if (['start', 'stop', 'restart'].includes(action)) service.active = action !== 'stop'
    else { service.enabled = action === 'enable'; if (opts.now) service.active = service.enabled }
    state.journal.push(`lab systemd: ${action} ${unit}.service`)
    return outputEmpty()
  }
  if (name === 'journalctl') {
    const { opts, rest } = options(args, 'b', 'un', { 'no-pager': 'noPager', unit: 'u:', lines: 'n:' })
    if (rest.length) throw new Error('journalctl: 不支持的位置参数。')
    const count = positiveNumber(opts.n, 20), filtered = state.journal.filter(line => !opts.u || line.includes(serviceName(opts.u)))
    return result(count ? filtered.slice(-count) : [])
  }
  if (name === 'ping') {
    const { opts, rest } = options(args, 'n', 'cW')
    if (rest.length !== 1) throw new Error('示例：ping -c 3 192.168.56.101')
    localHost(state, rest[0])
    const count = positiveNumber(opts.c, 4, 10)
    if (!count) throw new Error('ping 次数必须大于零。')
    if (opts.W) positiveNumber(opts.W, 1, 30)
    return result([`PING ${rest[0]} (离线样本)`, ...Array.from({ length: count }, (_, i) => `64 bytes from ${rest[0]}: icmp_seq=${i + 1} ttl=64 time=0.20 ms`), `${count} packets transmitted, ${count} received, 0% packet loss`])
  }
  if (name === 'nmap') {
    let version = false, target, ports = [22, 80], outputPath
    for (let i = 0; i < args.length; i++) {
      const arg = args[i]
      if (arg === '-sV') version = true
      else if (['-Pn', '-n'].includes(arg)) continue
      else if (arg === '-p' || /^-p\d/.test(arg)) {
        const value = arg.length > 2 ? arg.slice(2) : args[++i]
        if (!/^\d+(,\d+)*$/.test(value || '')) throw new Error('沙盒 -p 支持逗号分隔端口，例如 -p 22,80。')
        ports = [...new Set(value.split(',').map(Number))]
        if (ports.length > 30 || ports.some(port => port < 1 || port > 65535)) throw new Error('最多指定 30 个有效端口。')
      } else if (arg === '-oN') { outputPath = args[++i]; if (!outputPath) throw new Error('-oN 缺少文件名。') }
      else if (arg.startsWith('-') || target) throw new Error('nmap 支持 -sV、-p、-Pn、-n、-oN 和一个内置目标。')
      else target = arg
    }
    if (!target) throw new Error('nmap 缺少内置目标地址。')
    const kind = localHost(state, target)
    const rows = kind === 'target' ? { 22: ['ssh', 'OpenSSH 9.2 (sample)'], 80: ['http', 'nginx 1.22 (sample)'] } : Object.fromEntries(serviceRows(state).filter(row => row.proto === 'tcp' && (!['localhost', '127.0.0.1'].includes(target) || row.address.startsWith('127.0.0.1:'))).map(row => [row.address.split(':')[1], [row.process === 'sshd' ? 'ssh' : 'http', 'sample service']]))
    const lines = [`Nmap simulation report for ${target}`, `PORT STATE SERVICE${version ? ' VERSION' : ''}`, ...ports.map(port => `${port}/tcp ${rows[port] ? `open ${rows[port][0]}${version ? ' ' + rows[port][1] : ''}` : 'closed unknown'}`)]
    if (outputPath) writeFile(state, outputPath, lines.join('\n') + '\n', false, root)
    return result(lines)
  }
  if (name === 'curl') {
    const { opts, rest } = options(args, 'IsSL', 'o', { head: 'I', 'max-time': 'timeout:', output: 'o:' })
    if (rest.length !== 1) throw new Error('示例：curl -I http://192.168.56.101')
    let url
    try { url = new URL(rest[0]) } catch { throw new Error('请输入包含 http:// 的完整内置目标 URL。') }
    if (url.protocol !== 'http:') throw new Error('沙盒仅提供内置 HTTP 样本，不模拟 TLS 或访问其他协议。')
    const kind = localHost(state, url.hostname)
    const port = Number(url.port || 80)
    const reachable = kind === 'target' ? port === 80 : serviceRows(state).some(row => row.proto === 'tcp' && row.address === `${url.hostname}:${port}` && row.process === 'python3')
    if (!reachable) return result([`curl: (7) Failed to connect to ${url.hostname} port ${port}`], 7)
    const found = ['/', '/docs', '/login'].includes(url.pathname)
    const text = opts.I ? `HTTP/1.1 ${found ? '200 OK' : '404 Not Found'}\nServer: lab-http (sample)\nContent-Type: text/html\n` : found ? '<html><body>Security Path offline lab</body></html>\n' : '<html><body>404 Not Found</body></html>\n'
    if (opts.o) { writeFile(state, opts.o, text, false, root); return outputEmpty() }
    return { stdout: text, code: 0 }
  }
  if (['apt', 'apt-cache', 'dpkg', 'pacman', 'parrot-upgrade', 'anonsurf'].includes(name)) return runPackageCommand(state, name, args, root)
  return null
}

const outputEmpty = () => ({ stdout: '', code: 0 })

function runPackageCommand(state, name, args, root) {
  if (state.id === 'pentoo') throw new Error('Pentoo 使用 Portage / emerge；不提供 APT、pacman 或 Parrot 专属命令。')
  if (name === 'pacman' ? state.id !== 'blackarch' : ['apt', 'apt-cache', 'dpkg'].includes(name) && state.id === 'blackarch') throw new Error(`${name} 不属于当前发行版，请使用 ${state.id === 'blackarch' ? 'pacman' : 'apt'}。`)
  if (['parrot-upgrade', 'anonsurf'].includes(name)) {
    if (state.id !== 'parrot') throw new Error('这是 Parrot 专属命令。')
    if (name === 'anonsurf') {
      if (args.join(' ') !== 'status') throw new Error('沙盒只提供 anonsurf status；不启动匿名网络。')
      return result(['AnonSurf is not running.（离线模拟，无匿名网络连接）'])
    }
    demandRoot(root)
    if (args.length) throw new Error('沙盒 parrot-upgrade 不接受附加参数。')
    state.packageRefreshes++
    return result(['Parrot 模拟软件索引已刷新；没有下载或更改真实软件。'])
  }
  const catalog = availablePackages(state), packageMap = Object.fromEntries(catalog)
  function packageInfo(pkg) {
    if (!Object.hasOwn(packageMap, pkg)) throw new Error(`包 ${pkg} 不在离线样本库中，先使用 ${state.id === 'blackarch' ? 'pacman -Ss' : 'apt search'} 查询。`)
    return packageMap[pkg]
  }
  if (name === 'dpkg') {
    if (!['-l', '--list'].includes(args[0]) || args.length > 2) throw new Error('dpkg 支持 -l [包名]。')
    const matches = Object.keys(state.packages).filter(pkg => !args[1] || pkg === args[1])
    return result(['Status Name Version', ...matches.map(pkg => `ii ${pkg} ${state.packages[pkg]}`)], matches.length ? 0 : 1)
  }
  if (name === 'pacman') {
    const operation = args[0], remaining = args.slice(1)
    if (operation === '-V' && !remaining.length) return result(['pacman offline teaching model; not a real installed version'])
    if (['-Sg', '-Sgg'].includes(operation)) {
      if (remaining.length > 1 || remaining[0]?.startsWith('-')) throw new Error('pacman -Sg [组名]')
      const groups = catalog.filter(([, data]) => data[2].startsWith('blackarch'))
      if (remaining[0] || operation === '-Sgg') {
        const selected = groups.filter(([, data]) => !remaining[0] || data[2] === remaining[0])
        return result(selected.map(([pkg, data]) => `${data[2]} ${pkg}`), selected.length ? 0 : 1)
      }
      return result([...new Set(groups.map(([, data]) => data[2]))])
    }
    if (operation === '-Sl') {
      if (remaining.length > 1 || (remaining[0] && remaining[0] !== 'blackarch')) throw new Error('沙盒仅支持 pacman -Sl blackarch。')
      return result(catalog.filter(([, data]) => data[2].startsWith('blackarch')).map(([pkg, data]) => `blackarch ${pkg} ${data[0]}`))
    }
    if (['-Ss', '-Qs'].includes(operation)) {
      const query = remaining.join(' ').toLowerCase()
      const matches = catalog.filter(([pkg, data]) => (operation !== '-Qs' || state.packages[pkg]) && `${pkg} ${data.join(' ')}`.toLowerCase().includes(query))
      return result(matches.flatMap(([pkg, data]) => [`${data[2].startsWith('blackarch') ? 'blackarch' : 'core'}/${pkg} ${data[0]} (${data[2]})`, `    ${data[1]}`]), matches.length ? 0 : 1)
    }
    if (['-Q', '-Qe', '-Qi', '-Si', '-Ql'].includes(operation)) {
      if (remaining.some(arg => arg.startsWith('-'))) throw new Error('不支持此附加 pacman 参数。')
      const packages = remaining.length ? remaining : Object.keys(state.packages)
      return result(packages.flatMap(pkg => {
        const data = packageInfo(pkg)
        if (operation !== '-Si' && !state.packages[pkg]) throw new Error(`${pkg} is not installed`)
        if (operation === '-Ql') return [`${pkg} /usr/bin/${pkg === 'coreutils' ? 'ls' : pkg}`]
        return ['-Qi', '-Si'].includes(operation) ? [`Name: ${pkg}`, `Version: ${data[0]}`, `Description: ${data[1]}`, `Groups: ${data[2]}`] : [`${pkg} ${data[0]}`]
      }))
    }
    if (operation === '-Syu') {
      demandRoot(root)
      const names = remaining.filter(arg => arg !== '--needed')
      for (const pkg of names) {
        if (pkg.startsWith('blackarch-')) {
          const members = catalog.filter(([, data]) => data[2] === pkg)
          if (!members.length) throw new Error('没有此模拟工具组。')
          for (const [member, data] of members) state.packages[member] = data[0]
        } else state.packages[pkg] = packageInfo(pkg)[0]
      }
      state.packageRefreshes++
      return result(['模拟完整同步升级完成；本地包状态已更新。真实系统未发生变化。'])
    }
    throw new Error('pacman 沙盒支持 -Q、-Qe、-Qi、-Ql、-Qs、-Si、-Ss、-Sg、-Sgg、-Sl、-Syu、-V。参数大小写有区别。')
  }
  if (args[0] === '--version' && args.length === 1) return result(['apt offline teaching model; not a real installed version'])
  const { opts, rest } = options(args, 's', '', { 'names-only': 'names', installed: 'installed', simulate: 's' })
  const action = rest.shift()
  if (name === 'apt-cache' && !['search', 'show', 'policy'].includes(action)) throw new Error('apt-cache 支持 search、show、policy。')
  if (action === 'search') {
    const query = rest.join(' ').toLowerCase()
    return result(catalog.filter(([pkg, data]) => (opts.names ? pkg : pkg + ' ' + data[1]).toLowerCase().includes(query)).map(([pkg, data]) => `${pkg} ${data[0]} - ${data[1]}`))
  }
  if (action === 'show' || action === 'policy') {
    if (!rest.length) throw new Error('请指定包名。')
    return result(rest.flatMap(pkg => { const data = packageInfo(pkg); return action === 'show' ? [`Package: ${pkg}`, `Version: ${data[0]}`, `Description: ${data[1]}`] : [`${pkg}:`, `  Installed: ${state.packages[pkg] || '(none)'}`, `  Candidate: ${data[0]}`] }))
  }
  if (action === 'list') return result(catalog.filter(([pkg]) => (!opts.installed || state.packages[pkg]) && (!rest.length || rest.includes(pkg))).map(([pkg, data]) => `${pkg}/offline ${data[0]}${state.packages[pkg] ? ' [installed]' : ''}`))
  if (action === 'update' || action === 'full-upgrade') {
    demandRoot(root)
    if (rest.length) throw new Error('此模拟子命令不接受包名。')
    if (!opts.s) state.packageRefreshes++
    return result([`${opts.s ? '预览' : '完成'}：离线软件包${action === 'update' ? '索引刷新' : '整体升级'}。未连接真实仓库。`])
  }
  if (action === 'install' || action === 'remove') {
    if (!opts.s) demandRoot(root)
    if (!rest.length) throw new Error('请指定包名。')
    for (const pkg of rest) {
      const data = packageInfo(pkg)
      if (['coreutils', 'nmap', 'curl', 'python3'].includes(pkg) && action === 'remove') throw new Error('本练习保留基础工具，请使用 sleuthkit 练习安装与卸载。')
      if (!opts.s) { if (action === 'install') state.packages[pkg] = data[0]; else delete state.packages[pkg] }
    }
    return result([`${opts.s ? '仅预览' : '已更新虚拟包状态'}: ${action} ${rest.join(' ')}。不下载、不执行真实软件。`])
  }
  throw new Error('apt 沙盒支持 search、show、policy、list、update、full-upgrade、install、remove。')
}
