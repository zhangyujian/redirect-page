import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { BookOpen, Check, ChevronDown, Copy, ExternalLink, Search, ShieldCheck, X } from 'lucide-react'
import { COMMAND_CATEGORIES, COMMAND_REVIEWED_AT, COMMAND_SYSTEMS, filterCommands, getDistroCommands } from '../data/commandCatalog'
import DistroLogo from './DistroLogo'
import './CommandsPage.css'

const PAGE_SIZE = 12
const scopeFilters = [
  { id: 'all', label: '全部内容' },
  { id: 'shared', label: '通用与安全工具' },
  { id: 'system', label: '系统与包管理' },
]

function CommandExample({ example, name, number = 1 }) {
  const [copyState, setCopyState] = useState('idle')
  const resetTimer = useRef(null)
  useEffect(() => () => window.clearTimeout(resetTimer.current), [])

  async function copyExample() {
    window.clearTimeout(resetTimer.current)
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable')
      await navigator.clipboard.writeText(example.code)
      setCopyState('success')
    } catch {
      setCopyState('error')
    }
    resetTimer.current = window.setTimeout(() => setCopyState('idle'), 3500)
  }

  return (
    <div className="manual-example">
      <div className="manual-example-code">
        <pre><code>{example.code}</code></pre>
        <button type="button" onClick={copyExample} aria-label={`复制 ${name} 示例 ${number}`}>
          {copyState === 'success' ? <Check size={16} /> : <Copy size={16} />}
          <span>{copyState === 'success' ? '已复制' : '复制'}</span>
        </button>
      </div>
      <p>{example.explanation}</p>
      <span className={`manual-copy-state ${copyState === 'error' ? 'error' : ''}`} role="status" aria-live="polite">
        {copyState === 'error' ? '浏览器未允许复制，请选中上方命令手动复制。' : copyState === 'success' ? '命令已复制；页面不会自动执行。' : ''}
      </span>
    </div>
  )
}

function CommandEntry({ entry }) {
  const titleId = useId()
  return (
    <article className="manual-entry" aria-labelledby={titleId}>
      <div className="manual-entry-meta">
        <span>{entry.tag}</span>
        {entry.risk && <span className={`manual-risk ${entry.risk}`}>
          {entry.risk === 'destructive' ? '删除风险' : entry.risk === 'network' ? '仅限授权目标' : '会改变状态'}
        </span>}
      </div>
      <h3 id={titleId}><code>{entry.command}</code></h3>
      <p className="manual-entry-summary">{entry.summary}</p>
      <CommandExample example={entry.examples[0]} name={entry.command} />
      <details className="manual-entry-details">
        <summary><BookOpen size={17} /><span>详细说明与参数</span><ChevronDown size={17} /></summary>
        <div className="manual-entry-body">
          <h4>使用语法</h4>
          <pre className="manual-syntax"><code>{entry.syntax}</code></pre>
          <h4>常用参数 / 操作</h4>
          <dl className="manual-options">
            {entry.options.map((option) => <div key={option.flag}><dt><code>{option.flag}</code></dt><dd>{option.description}</dd></div>)}
          </dl>
          {entry.examples.length > 1 && <><h4>更多示例</h4>{entry.examples.slice(1).map((example, index) => <CommandExample key={example.code} example={example} name={entry.command} number={index + 2} />)}</>}
          <div className="manual-caution"><ShieldCheck size={18} /><div><h4>注意事项</h4><p>{entry.note}</p></div></div>
          <dl className="manual-requirements">
            <div><dt>运行权限</dt><dd>{entry.permission}</dd></div>
            <div><dt>适用系统</dt><dd>{COMMAND_SYSTEMS.filter((system) => entry.distros.includes(system.id)).map((system) => system.shortName).join('、')}</dd></div>
            <div><dt>安装与环境</dt><dd>{entry.availability}</dd></div>
          </dl>
          <a className="manual-source-link" href={entry.source.url} target="_blank" rel="noopener noreferrer">
            {entry.source.title}<ExternalLink size={15} /><span>原文</span>
          </a>
        </div>
      </details>
    </article>
  )
}

export default function CommandsPage({ distro, onSelectDistro, initialQuery = '' }) {
  const [filters, setFilters] = useState({ query: initialQuery, category: 'all', scope: 'all' })
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const searchId = useId()
  const categoryId = useId()
  const system = COMMAND_SYSTEMS.find((item) => item.id === distro.id) || COMMAND_SYSTEMS[0]
  const commands = useMemo(() => getDistroCommands(system.id), [system.id])
  const searched = useMemo(() => filterCommands(commands, { query: filters.query, scope: filters.scope }), [commands, filters.query, filters.scope])
  const filtered = useMemo(() => filterCommands(commands, filters), [commands, filters])
  const categoryCounts = useMemo(() => Object.fromEntries(COMMAND_CATEGORIES.map((category) => [category.id, searched.filter((entry) => entry.category === category.id).length])), [searched])
  const systemCount = commands.filter((entry) => entry.scope === 'system').length
  const shown = filtered.slice(0, visibleCount)

  function changeFilter(key, value) {
    setFilters((current) => ({ ...current, [key]: value }))
    setVisibleCount(PAGE_SIZE)
  }

  function resetFilters() {
    setFilters({ query: '', category: 'all', scope: 'all' })
    setVisibleCount(PAGE_SIZE)
  }

  return (
    <div className="page command-manual">
      <section className="manual-intro">
        <div>
          <span className="section-kicker">COMMAND REFERENCE / 中文详解</span>
          <h2>安全 Linux 命令手册</h2>
          <p>从认识命令到读懂参数，按场景查找 Kali、Parrot、BlackArch 与 Pentoo 的用法。</p>
        </div>
        <div className="manual-totals"><strong>{commands.length}<span>条</span></strong><span>当前系统命令 / 子命令</span><span>{COMMAND_CATEGORIES.length} 个学习分类</span></div>
      </section>

      <div className="manual-system-tabs" role="group" aria-label="选择命令手册系统">
        {COMMAND_SYSTEMS.map((item) => <button type="button" key={item.id} className={item.id === system.id ? 'selected' : ''} aria-pressed={item.id === system.id} onClick={() => item.id !== system.id && onSelectDistro(item.id)}>
          <DistroLogo distro={item} /><span><strong>{item.name}</strong><small>{item.manager} · {getDistroCommands(item.id).length} 条内容</small></span>{item.id === system.id && <Check size={18} />}
        </button>)}
      </div>

      <section className="manual-system-note" aria-label="当前系统使用说明">
        <div><h3>{system.name} · 先确认系统，再复制命令</h3><p>{system.description}</p><p>系统更新参考：<code>{system.update}</code>。执行前请阅读“系统与包管理”中的说明并备份。</p></div>
        <span>{systemCount} 条系统相关内容</span>
      </section>

      <div className="manual-guide"><BookOpen size={21} /><p><strong>使用顺序：</strong>选系统 → 选分类或搜索 → 展开详细说明 → 确认权限与目标 → 在自己的实验环境练习。这里不会自动执行命令。</p></div>

      <section className="manual-controls" aria-label="筛选命令">
        <label htmlFor={searchId}>搜索命令、用途、参数或示例</label>
        <div className="manual-search"><Search size={20} /><input id={searchId} type="search" value={filters.query} onChange={(event) => changeFilter('query', event.target.value)} placeholder="例如：chmod、监听端口、pacman、-sV" autoComplete="off" />{filters.query && <button type="button" aria-label="清空命令搜索" onClick={() => changeFilter('query', '')}><X size={18} /></button>}</div>
        <div className="manual-scopes" role="group" aria-label="命令适用范围">
          {scopeFilters.map((scope) => <button type="button" key={scope.id} aria-pressed={filters.scope === scope.id} onClick={() => changeFilter('scope', scope.id)}>{scope.label}</button>)}
        </div>
        <div className="manual-mobile-category"><label htmlFor={categoryId}>选择分类</label><select id={categoryId} value={filters.category} onChange={(event) => changeFilter('category', event.target.value)}><option value="all">全部分类（{searched.length}）</option>{COMMAND_CATEGORIES.map((category) => <option key={category.id} value={category.id}>{category.label}（{categoryCounts[category.id]}）</option>)}</select></div>
      </section>

      <div className="manual-layout">
        <nav className="manual-categories" aria-label="命令分类">
          <h3>按场景学习</h3>
          <button type="button" aria-pressed={filters.category === 'all'} onClick={() => changeFilter('category', 'all')}>全部分类<span>{searched.length}</span></button>
          {COMMAND_CATEGORIES.map((category) => <button type="button" key={category.id} aria-pressed={filters.category === category.id} onClick={() => changeFilter('category', category.id)}>{category.label}<span>{categoryCounts[category.id]}</span></button>)}
        </nav>
        <section className="manual-results" aria-label="命令查询结果">
          <div className="manual-result-heading"><h3>{filters.category === 'all' ? '命令目录' : COMMAND_CATEGORIES.find((item) => item.id === filters.category)?.label}</h3><p role="status">共 {filtered.length} 条匹配，已显示 {shown.length} 条</p></div>
          <div className="manual-grid">{shown.map((entry) => <CommandEntry key={entry.id} entry={entry} />)}</div>
          {!filtered.length && <div className="manual-empty"><Search size={32} /><h3>没有匹配的命令</h3><p>可以尝试命令名或用途关键词；APT 对应 Kali / Parrot，pacman 对应 BlackArch，Portage / emerge 对应 Pentoo。</p><button type="button" onClick={resetFilters}>清除全部筛选</button></div>}
          {filtered.length > visibleCount && <button type="button" className="manual-load-more" onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}>加载更多（还有 {filtered.length - shown.length} 条）<ChevronDown size={18} /></button>}
        </section>
      </div>

      <section className="manual-reference" aria-label="完整命令与官方资料">
        <h3>继续查阅：官方完整索引与本机手册</h3>
        <p>本页是持续维护的核心命令学习手册，不等于发行版所有可安装程序的全集。命令和参数会随软件包、镜像、Shell 与版本变化；找不到的内容可继续查阅下方官方目录。</p>
        <div className="manual-reference-links">{system.links.map((link) => <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer">{link.title}<ExternalLink size={16} /></a>)}</div>
        <details className="manual-discovery"><summary>如何查看自己系统的完整可用命令？<ChevronDown size={17} /></summary>
          <p>在自己的 Linux 终端运行下列只读查询。软件包名单与可执行命令名单不是同一个概念。</p>
          <CommandExample name="本机命令枚举" example={{ code: "bash -lc 'compgen -c | sort -u'", explanation: '枚举新 Bash 会话可解析的命令；结果随 PATH、已安装软件和 Shell 配置变化。' }} />
          <CommandExample name="查看软件包提供的文件" example={{ code: system.id === 'pentoo' ? 'equery files net-analyzer/nmap' : system.id === 'blackarch' ? 'pacman -Ql nmap' : 'dpkg-query -L nmap', explanation: '查看已安装包提供的程序与文档。Pentoo 的 equery 由 gentoolkit 提供；将示例包换成你要查询的包。' }} />
          <CommandExample name="查看本机手册" example={{ code: 'man nmap', explanation: '本机手册对应已安装版本；不知道命令名时先用 apropos 搜功能关键词。' }} />
        </details>
        <p className="manual-reviewed">资料核对：{COMMAND_REVIEWED_AT}。这是文档核对日期，不是软件版本号；官方原文可能为英文，条目说明已用中文整理。</p>
      </section>
    </div>
  )
}
