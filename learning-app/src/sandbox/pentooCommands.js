import { options } from './shell.js'

const result = (lines = [], code = 0) => ({ stdout: lines.length ? lines.join('\n') + '\n' : '', code })
// Deliberately small Portage model: previews never compile, install, or resolve real dependencies.
const packages = {
  'sys-apps/coreutils': { key: 'coreutils', description: 'GNU core utilities', use: [] },
  'net-analyzer/nmap': { key: 'nmap', description: 'Network exploration and security auditing', use: ['ssl', 'ncat', 'nping'] },
  'net-misc/curl': { key: 'curl', description: 'Transfer data with URLs', use: ['ssl'] },
  'dev-lang/python': { key: 'python3', description: 'Python programming language', use: ['ssl'] },
  'app-forensics/sleuthkit': { key: 'sleuthkit', description: 'File system forensic tools', use: [] },
}

function requirePentoo(state) {
  if (state.id !== 'pentoo') throw new Error('这是 Pentoo / Gentoo 学习路径的命令；请切换系统。')
}
function requireRoot(root) {
  if (!root) throw new Error('此模拟管理操作需要 sudo 前缀；不会修改真实系统。')
}
function entry(atom) {
  const match = Object.entries(packages).find(([name]) => name === atom || name.split('/')[1] === atom)
  if (!match) throw new Error('包不在离线样本库中；用 emerge --search 关键词 查询，不支持版本约束或完整仓库。')
  return match
}

export function runPentooCommand(state, name, args, root) {
  if (!['emerge', 'equery', 'eselect', 'rc-status', 'rc-service', 'rc-update'].includes(name)) return null
  requirePentoo(state)
  if (name === 'emerge') {
    const { opts, rest } = options(args, 'pvuaDNsS', '', {
      pretend: 'p', verbose: 'v', update: 'u', ask: 'a', deep: 'D', newuse: 'N',
      search: 's', searchdesc: 'S', info: 'info', sync: 'sync',
    })
    const actions = [opts.s || opts.S, opts.info, opts.sync].filter(Boolean)
    if (actions.length > 1 || (actions.length && (opts.p || opts.u || opts.a || opts.D || opts.N))) throw new Error('请分别执行搜索、信息查询、同步或依赖预览，不混用动作。')
    if (opts.info) {
      if (rest.length) throw new Error('沙盒支持不带包名的 emerge --info。')
      return result(['Portage (offline teaching model)', 'Repositories: gentoo, pentoo (samples)', 'Profile: default/linux/amd64/23.0 (sample, not installation advice)', 'USE="ssl" (sample)', '该信息不代表真实 Pentoo 镜像或最新版本。'])
    }
    if (opts.sync) {
      if (rest.length) throw new Error('沙盒只支持 sudo emerge --sync，不接受指定仓库。')
      requireRoot(root)
      state.packageRefreshes++
      return result(['模拟仓库索引已刷新；未访问网络，已安装软件未改变。'])
    }
    if (opts.s || opts.S) {
      if (rest.length !== 1) throw new Error('用法：emerge --search nmap 或 emerge --searchdesc forensic')
      const matches = Object.entries(packages).filter(([atom, data]) => (atom + (opts.S ? ' ' + data.description : '')).toLowerCase().includes(rest[0].toLowerCase()))
      return result(['离线仓库样本（不是完整 Portage 索引）', ...matches.flatMap(([atom, data]) => [
        '* ' + atom, '  Description: ' + data.description, '  Installed: ' + (state.packages[data.key] || '(none)'),
      ]), 'Found ' + matches.length + ' matches.'])
    }
    if (!opts.p) throw new Error('沙盒只模拟 Portage 查询、同步与 --pretend 预览，不实际编译或安装。试试 emerge --pretend --verbose net-analyzer/nmap。')
    if (!rest.length) throw new Error('依赖预览需要一个包名或 @world。')
    if (rest.includes('@world') && (rest.length !== 1 || !opts.u)) throw new Error('@world 预览请使用 emerge -pvuDN @world。')
    const selected = rest[0] === '@world'
      ? Object.entries(packages).filter(([, data]) => state.packages[data.key])
      : rest.map(entry)
    return result(['依赖预览（教学模型，未计算真实依赖图或真实更新）', ...selected.map(([atom, data]) =>
      '[ebuild ' + (state.packages[data.key] ? 'R' : 'N') + ' ] ' + atom + '-sim USE="' + data.use.join(' ') + '"'),
    '仅预览：包数据库、USE 配置和文件均未改变；真实事务以本机结果为准。'])
  }
  if (name === 'equery') {
    const [action, atom] = args
    if (args.length !== 2 || !['list', 'l', 'files', 'f', 'uses', 'u'].includes(action)) throw new Error('沙盒支持 equery list|files|uses 包名（gentoolkit 的查询子集）。')
    const [fullName, data] = entry(atom)
    if (!state.packages[data.key]) return result(['No installed packages matching ' + atom], 1)
    if (['files', 'f'].includes(action)) return result(['/usr/bin/' + (data.key === 'coreutils' ? 'ls' : data.key)])
    if (['uses', 'u'].includes(action)) return result(['Installed USE flags (sample):', ...data.use.map(flag => '+ ' + flag)])
    return result([fullName + '-' + state.packages[data.key]])
  }
  if (name === 'eselect') {
    if (args.length !== 2 || args[1] !== 'list') throw new Error('沙盒只支持 eselect profile|news|repository list；不更换 profile 或启用远程仓库。')
    if (args[0] === 'profile') return result(['Available profile symlink targets (sample):', '[1] default/linux/amd64/23.0 *', '仅为教学样本；不要照抄 profile 编号到真实系统。'])
    if (args[0] === 'news') return result(['News items (offline sample):', '[1] Review repository news before maintenance', '沙盒不拉取新闻；真实最新公告请访问 Gentoo/Pentoo 官方渠道。'])
    if (args[0] === 'repository') return result(['Available repositories (offline sample):', 'gentoo [enabled]', 'pentoo [enabled]', '真实环境需要安装 eselect-repository 模块；此处不会添加源。'])
    throw new Error('未知 eselect 模块；支持 profile、news、repository。')
  }
  if (name === 'rc-status') {
    if (args.length > 1 || (args.length && !['default', '-a', '--all'].includes(args[0]))) throw new Error('沙盒支持 rc-status [default|-a|--all]。')
    return result(['Runlevel: default (OpenRC teaching model)', ...Object.entries(state.services)
      .filter(([, service]) => service.enabled || service.active)
      .map(([unit, service]) => unit + ' [ ' + (service.active ? 'started' : 'stopped') + ' ]')])
  }
  const [action, unit, runlevel] = name === 'rc-service' ? [args[1], args[0]] : args
  if (name === 'rc-update' && (action === 'show' || !action)) {
    if (args.length > 2 || (args[1] && args[1] !== 'default')) throw new Error('沙盒只建模 default runlevel。')
    return result(Object.entries(state.services).filter(([, service]) => service.enabled).map(([key]) => key + ' | default'))
  }
  const key = unit === 'sshd' ? 'ssh' : unit
  if (!Object.hasOwn(state.services, key)) throw new Error('未找到样本服务；可用 sshd、dnsmasq、lab-web。')
  const service = state.services[key]
  if (name === 'rc-service') {
    if (args.length !== 2) throw new Error('用法：rc-service 服务 status|start|stop|restart')
    if (action === 'status') return result(['* status: ' + (service.active ? 'started' : 'stopped')], service.active ? 0 : 3)
    if (!['start', 'stop', 'restart'].includes(action)) throw new Error('未模拟此服务动作。')
    requireRoot(root)
    service.active = action !== 'stop'
    state.journal.push('lab OpenRC: ' + action + ' ' + unit)
    return result(['* ' + unit + ': ' + action + ' [ ok ] (simulation)'])
  }
  if (!['add', 'del'].includes(action) || args.length !== 3 || runlevel !== 'default') throw new Error('用法：sudo rc-update add|del 服务 default')
  requireRoot(root)
  service.enabled = action === 'add'
  return result(['* default runlevel updated (simulation); running state unchanged'])
}
