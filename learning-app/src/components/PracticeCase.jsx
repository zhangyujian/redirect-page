import { useId, useState } from 'react'
import { ArrowRight, BookOpen, Check, ChevronDown, ClipboardList, Copy, ExternalLink, Play, RotateCcw, Search, ShieldCheck, Target } from 'lucide-react'
import { filterPracticeCases, practiceCases } from '../data/practiceCases.js'
import { advancePracticeSession, createPracticeSession, formatPracticeReport } from '../data/practiceSession.js'
import './PracticeCase.css'

export function PracticeCaseList({ distro, onOpen }) {
  const [level, setLevel] = useState('all')
  const [query, setQuery] = useState('')
  const cases = practiceCases[distro.id]
  const visibleCases = filterPracticeCases(distro.id, level, query)
  const advancedCount = cases.filter(practice => practice.level === 'advanced').length
  return <section className="practice-case-library" aria-label={distro.name + ' 实战案例'}>
    <div className="case-library-heading">
      <div><span className="section-kicker">PRACTICAL CASES</span><h3><Target />实战案例与解题思路</h3></div>
      <span className="case-count">{cases.length} 个完整案例 · 含 {advancedCount} 个高级实战</span>
    </div>
    <p>先读场景与分析思路，再逐步运行离线示例、核对结果，最后按验收清单复盘。可先预览，不会跳过前置课程或自动增加 XP。</p>
    <div className="case-learning-guide"><strong>高级实战怎么学？</strong><span>明确问题 → 比较假设与证据 → 运行正反例 → 恢复并验收。重点是解释结论，不只是把命令运行一遍。</span></div>
    <div className="case-library-tools">
      <div className="case-level-filter" role="group" aria-label="实战难度筛选">
        {[['all', '全部案例', cases.length], ['foundation', '基础实战', cases.length - advancedCount], ['advanced', '高级实战', advancedCount]].map(([value, label, count]) =>
          <button key={value} aria-pressed={level === value} onClick={() => setLevel(value)}>{label} <span>{count}</span></button>)}
      </div>
      <label className="case-search"><Search /><span className="case-search-label">搜索实战案例</span><input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="搜索主题或命令，例如 HTTP、USE" /></label>
    </div>
    <p className="case-result-count" role="status">当前显示 {visibleCases.length} / {cases.length} 个案例</p>
    <div className="case-preview-grid">
      {visibleCases.map(practice => <article key={practice.id} className={'case-preview ' + (practice.level === 'advanced' ? 'case-advanced-preview' : '')}>
        <div className="case-tags"><span>配套第 {practice.courseId} 课</span><span>{practice.difficulty}</span></div>
        <h4>{practice.title}</h4><p>{practice.summary}</p>
        {practice.level === 'advanced' && <span className="case-analysis-summary">含假设排除、证据解读、停止条件与恢复验收</span>}
        <span className="case-duration">{practice.steps.length} 步详解 · 建议 {practice.duration}</span>
        <button onClick={() => onOpen(practice)} aria-label={'阅读实战：' + practice.title}>{practice.level === 'advanced' ? '进入高级实战分析' : '阅读实战与解决思路'} <ArrowRight /></button>
      </article>)}
    </div>
    {!visibleCases.length && <div className="case-library-empty"><p>没有匹配的案例，试试其他关键词或查看全部。</p><button onClick={() => { setQuery(''); setLevel('all') }}>清除筛选</button></div>}
  </section>
}

export default function PracticeCase({ practice, distro, canStudy, onReadLesson }) {
  const id = useId()
  const [session, setSession] = useState(() => createPracticeSession(distro))
  const [expanded, setExpanded] = useState([0])
  const [checked, setChecked] = useState([])
  const [status, setStatus] = useState('')
  const [resetPending, setResetPending] = useState(false)
  const allExpanded = expanded.length === practice.steps.length
  const finished = session.nextStep === practice.steps.length

  function runStep(index) {
    if (index !== session.nextStep) return
    const next = advancePracticeSession(session, practice)
    setSession(next)
    setExpanded(current => [...new Set([...current, index, Math.min(next.nextStep, practice.steps.length - 1)])])
  }

  function reset() {
    setSession(createPracticeSession(distro))
    setExpanded([0])
    setChecked([])
    setStatus('本案例已重置；课程进度、笔记和其他终端未改变。')
    setResetPending(false)
  }

  async function copy(text, message) {
    try {
      await navigator.clipboard.writeText(text)
      setStatus(message)
    } catch {
      setStatus('浏览器未允许复制，请选中下方文字复制。')
    }
  }

  return <article className="practice-case-reader">
    <header className="case-introduction">
      <div className="case-tags"><span>配套第 {practice.courseId} 课</span><span>{practice.difficulty}</span><span>建议 {practice.duration}</span></div>
      <h2>{practice.title}</h2><p>{practice.summary}</p>
      <nav className="case-contents" aria-label="实战内容导航">
        {[['scenario', '场景与目标'], ['thinking', '解决思路'], ...(practice.analysis ? [['analysis', '高级分析']] : []), ['steps', '逐步操作'], ['troubleshooting', '遇错怎么查'], ['review', '验收与复盘']].map(([anchor, label]) =>
          <a href={'#' + id + '-' + anchor} key={anchor}>{label}</a>)}
      </nav>
    </header>
    <section id={id + '-scenario'} className="case-block">
      <h3><Target />实战背景与要解决的问题</h3><p>{practice.scenario}</p>
      <h4>本次交付目标</h4><p>{practice.goal}</p>
      <h4>开始前先准备</h4><ul>{practice.prerequisites.map(item => <li key={item}>{item}</li>)}</ul>
      <div className="case-safety"><ShieldCheck /><p><strong>操作范围</strong>{practice.scope}</p></div>
      {!canStudy && <p className="case-prerequisite">当前为案例预览。课程阅读与测验仍需先完成前置课程，不会通过预览解锁。</p>}
    </section>
    <section id={id + '-thinking'} className="case-block">
      <h3><BookOpen />先想清楚：为什么按这个顺序解决</h3>
      <ol className="case-reasoning">{practice.thinking.map(item => <li key={item.title}><h4>{item.title}</h4><p>{item.body}</p></li>)}</ol>
    </section>
    {practice.analysis && <section id={id + '-analysis'} className="case-block case-advanced-analysis" aria-label="高级分析与证据判断">
      <h3><Search />高级分析：用什么证据支持或排除假设？</h3>
      <p>{practice.analysis.focus}</p>
      <p className="case-analysis-note">以下是教学样本的参考推理，不是对真实设备的自动检测结论。先提出自己的假设，再展开对照；步骤输出仍需逐项核验。</p>
      {practice.analysis.hypotheses.map(item => <details className="case-diagnostic" key={item.title}>
        <summary>{item.title}</summary><div className="case-hypothesis">
          <h4>要看哪些证据</h4><p>{item.evidence}</p>
          <h4>可以得出什么，不能推出什么</h4><p>{item.interpretation}</p>
          <h4>接下来怎样缩小范围</h4><p>{item.next}</p>
        </div>
      </details>)}
      <div className="case-stop-conditions"><h4><ShieldCheck />这些情况应先停止操作</h4><ul>{practice.analysis.stopConditions.map(item => <li key={item}>{item}</li>)}</ul></div>
    </section>}
    <section id={id + '-steps'} className="case-block">
      <div className="case-section-heading"><h3><Play />逐步操作与输出解读</h3><button onClick={() => setExpanded(allExpanded ? [] : practice.steps.map((_, index) => index))}>{allExpanded ? '收起所有步骤' : '展开所有步骤'}</button></div>
      <div className="case-session-info">
        <strong>独立离线环境 · 已演练 {session.nextStep} / {practice.steps.length} 步</strong>
        <p>按顺序运行，前一步的文件和状态会保留给下一步。输出是教学样本，不联网；返回课程、切换案例、关闭或刷新后清空，不保存为云端进度，也不计 XP。</p>
        <button onClick={() => setResetPending(true)}><RotateCcw />重新演练本案例</button>
        {resetPending && <div className="case-reset-confirm" role="alert">
          <p>确认清空本案例的临时文件、输出和验收勾选？不会删除课程进度或笔记。</p>
          <button onClick={() => setResetPending(false)}>取消</button><button onClick={reset}>确认重置本案例</button>
        </div>}
      </div>
      {status && <p role="status" className="case-copy-status">{status}</p>}
      <div className="case-step-list">{practice.steps.map((step, index) => {
        const open = expanded.includes(index)
        const result = session.results[index]
        const done = index < session.nextStep
        return <section key={step.title} className={'case-step ' + (open ? 'is-open' : '')}>
          <h4><button aria-expanded={open} aria-controls={id + '-step-' + index} onClick={() => setExpanded(current => current.includes(index) ? current.filter(value => value !== index) : [...current, index])}>
            <span className="case-step-number">{done ? <Check /> : String(index + 1).padStart(2, '0')}</span><span>{step.title}</span><ChevronDown />
          </button></h4>
          <div className="case-step-body" id={id + '-step-' + index} hidden={!open}>
            <h5>为什么先做这一步</h5><p>{step.why}</p>
            <div className="case-code-heading"><strong>本步命令</strong><button aria-label={'复制第 ' + (index + 1) + ' 步命令'} onClick={() => copy(step.command, '已复制第 ' + (index + 1) + ' 步命令。')}><Copy />复制</button></div>
            <pre tabIndex={0}><code>{step.command}</code></pre>
            <h5>预期现象</h5><p>{step.expected}</p>
            <h5>逐项解读</h5><ol>{step.explanation.map(item => <li key={item}>{item}</li>)}</ol>
            <div className="case-decision"><strong>如何判断下一步</strong><p>{step.next}</p></div>
            <button className="case-run-button" disabled={index !== session.nextStep} onClick={() => runStep(index)} aria-label={'运行第 ' + (index + 1) + ' 步（离线）'}>
              {done ? <Check /> : <Play />}{done ? '本步已演练' : index > session.nextStep ? '先运行前面的步骤' : result ? '重试本步（离线）' : '运行本步（离线）'}
            </button>
            {result && <div className={'case-step-result ' + (result.accepted ? '' : 'unexpected')} role="status">
              <strong>{result.accepted ? '退出码符合预期，请继续核对输出内容' : '结果未符合预期，步骤未推进'} · 实际 {result.code} / 预期 {step.expectedCode}</strong>
              <pre tabIndex={0}><code>{result.lines.join('\n') || '（没有文本输出）'}</code></pre>
            </div>}
          </div>
        </section>
      })}</div>
      {finished && <p className="case-finished" role="status"><Check />离线步骤已运行完。请核对下方验收项并复盘；这不等于已完成真实环境测试。</p>}
    </section>
    <section id={id + '-troubleshooting'} className="case-block">
      <h3><ShieldCheck />结果不一样时，沿着这些线索排查</h3>
      {practice.troubleshooting.map(item => <details className="case-diagnostic" key={item.symptom}>
        <summary>{item.symptom}</summary><div><h4>可能原因</h4><p>{item.cause}</p><h4>排查与处理思路</h4><p>{item.fix}</p></div>
      </details>)}
    </section>
    <section id={id + '-review'} className="case-block">
      <h3><ClipboardList />验收清单与复盘</h3><p>先对照实际输出，再勾选自己已经理解的项目。勾选只用于本次自查，不会自动完成课程。</p>
      <div className="case-checklist">{practice.acceptance.map((item, index) => <label key={item}>
        <input type="checkbox" checked={checked.includes(index)} onChange={() => setChecked(current => current.includes(index) ? current.filter(value => value !== index) : [...current, index])} /><span>{item}</span>
      </label>)}</div>
      <details className="case-diagnostic"><summary>参考复盘模板（按实际观察修改）</summary><pre tabIndex={0}><code>{practice.report}</code></pre></details>
      <h4>换一个条件，你会怎样判断？</h4><p>{practice.reflection.question}</p>
      <details className="case-diagnostic"><summary>查看分析与参考答案</summary><p>{practice.reflection.answer}</p></details>
      <button onClick={() => copy(formatPracticeReport(practice, session), '已复制本次实际输出和复盘模板；未执行步骤已明确标注。')}><Copy />复制本次演练记录</button>
      <p className="case-copy-status" role="status">{status}</p>
      <h4>迁移到真实自有虚拟机时</h4><p>{practice.transfer}</p>
    </section>
    <section className="case-block case-sources">
      <h3><BookOpen />继续学习与官方依据</h3><p>本站编写的中文案例，校对日期 {practice.reviewedAt}。不是官方逐字翻译；模拟数据不代表当前真实版本，实际参数与兼容性请核对原文。</p>
      {practice.resources.map(resource => <a key={resource.url} href={resource.url} target="_blank" rel="noopener noreferrer"><span><strong>{resource.title}</strong><small>{resource.summary}</small></span><ExternalLink /></a>)}
    </section>
    <div className="case-reader-footer"><button onClick={onReadLesson}>{canStudy ? '返回本课学习' : '返回路径，先学前置课程'}<ArrowRight /></button></div>
  </article>
}
