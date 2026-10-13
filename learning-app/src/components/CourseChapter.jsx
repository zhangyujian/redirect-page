import { useId, useState } from 'react'
import { ArrowRight, BookOpen, Check, ChevronDown, CircleHelp, Copy, ExternalLink, Play, ShieldCheck, TerminalSquare } from 'lucide-react'
import { createSandbox, executeSandbox } from '../sandbox/index.js'
import './CourseChapter.css'

function CourseExample({ example, distro }) {
  const [result, setResult] = useState(null)
  const [copyStatus, setCopyStatus] = useState('')
  const isCommand = example.kind === 'command'
  const canRun = isCommand && example.environment === 'sandbox'

  function runExample() {
    if (!canRun) return
    // Each demonstration gets a fresh virtual state; it never changes learner progress.
    try {
      const response = executeSandbox(createSandbox(distro), example.code)
      setResult({ code: response.code, text: response.lines.join('\n') || '命令完成，没有文本输出。' })
    } catch {
      setResult({ code: 1, text: '示例未能完成，请重新运行；这不会影响你的学习记录。' })
    }
  }

  async function copyExample() {
    try {
      await navigator.clipboard.writeText(example.code)
      setCopyStatus('已复制')
    } catch {
      setCopyStatus('浏览器未允许复制，可在下方选中内容。')
    }
  }

  return <section className="lesson-example" aria-label={isCommand ? '命令示例与输出解读' : '学习记录示例'}>
    <div className="lesson-block-heading">
      <h3>{isCommand ? <TerminalSquare /> : <BookOpen />}{isCommand ? '跟着示例理解操作' : '一份学习记录示例'}</h3>
      <button className="lesson-small-button" onClick={copyExample}><Copy />{isCommand ? '复制命令' : '复制记录'}</button>
    </div>
    {copyStatus && <p className="lesson-status" role="status">{copyStatus}</p>}
    {isCommand && <>
      <span className={`lesson-environment ${canRun ? '' : 'virtual-machine'}`}>{canRun ? '可在离线沙盒演示' : '需在自有虚拟机操作'}</span>
      <p>{example.setup}</p>
    </>}
    <pre tabIndex={0} aria-label={isCommand ? '示例命令' : '示例记录'}><code>{example.code}</code></pre>
    {isCommand ? <>
      <h4>参考输出（节选或说明）</h4>
      <pre className="lesson-reference-output" tabIndex={0}><code>{example.output}</code></pre>
      <h4>逐项解读</h4>
      <ol>{example.explanation.map(item => <li key={item}>{item}</li>)}</ol>
      {canRun ? <div className="lesson-demo">
        <button className="secondary-button" onClick={runExample}><Play />{result ? '重新运行离线示例' : '运行离线示例'}</button>
        <p>每次从独立的初始环境运行；不联网、不修改你的电脑或现有终端，也不自动完成课程。</p>
        {result && <div className={`lesson-demo-result ${result.code ? 'has-error' : ''}`} role="status">
          <strong>{result.code ? '示例未完成' : '本次沙盒输出'} · 退出码 {result.code}</strong>
          <pre tabIndex={0}><code>{result.text}</code></pre>
        </div>}
      </div> : <p className="lesson-vm-note"><ShieldCheck />本应用不执行此命令。请先准备自己的可恢复虚拟机，按上面的前置条件操作，勿在不可信代码上试验。</p>}
    </> : <p>{example.explanation}</p>}
  </section>
}

export function CourseReview({ sections, quiz, onOpen }) {
  return <section className="lesson-review">
    <h3>复习要点与解析</h3>
    <p>详细讲解已补充，已有完成记录保留。可以重新阅读，不会重复计入课程 XP。</p>
    {sections.map((section, index) => <div className="lesson-review-item" key={section.id}>
      <div><strong>{index + 1}. {section.title}</strong><button aria-label={`重新阅读：${section.title}`} onClick={() => onOpen(index)}>阅读详解 <ArrowRight /></button></div>
      <p>{section.check.question}</p>
      <details><summary>查看参考答案</summary><p>{section.check.answer}</p></details>
    </div>)}
    <details className="lesson-quiz-review"><summary>回顾结课测验解析</summary><p>{quiz.question}</p><strong>参考答案：{quiz.options[quiz.answer]}</strong><p>{quiz.explanation}</p></details>
  </section>
}

export default function CourseChapter({ section, resources, reviewedAt, distro, mission }) {
  const id = useId()
  const [expanded, setExpanded] = useState([0])
  const allExpanded = expanded.length === section.topics.length

  function toggleTopic(index) {
    setExpanded(current => current.includes(index) ? current.filter(value => value !== index) : [...current, index])
  }

  return <div className="lesson-detail">
    <p className="lesson-intro">{section.intro}</p>
    <div className="lesson-reading-guide"><BookOpen /><p><strong>建议这样学</strong>展开知识点并完成小任务，阅读示例与输出解读，回答自检题，最后点击底部“完成并继续”。阅读时间仅供参考。</p></div>
    <div className="lesson-topic-heading"><h3>本节 {section.topics.length} 个知识点</h3><button onClick={() => setExpanded(allExpanded ? [] : section.topics.map((_, index) => index))}>{allExpanded ? '收起全部' : '展开全部'}</button></div>
    <div className="lesson-topic-list">
      {section.topics.map((topic, index) => {
        const open = expanded.includes(index)
        const panelId = `${id}-topic-${index}`
        return <section className={`lesson-topic ${open ? 'is-open' : ''}`} key={topic.title}>
          <h3><button onClick={() => toggleTopic(index)} aria-expanded={open} aria-controls={panelId}>
            <span className="lesson-topic-number">{String(index + 1).padStart(2, '0')}</span><span>{topic.title}</span><ChevronDown />
          </button></h3>
          <div id={panelId} className="lesson-topic-body" hidden={!open}>
            <p>{topic.explanation}</p>
            <div className="lesson-task"><h4>动手做 / 想一想</h4><p>{topic.task}</p></div>
            <div className="lesson-verification"><h4><Check />怎样判断已掌握</h4><p>{topic.verification}</p></div>
          </div>
        </section>
      })}
    </div>
    <CourseExample example={section.example} distro={distro} />
    <section className="lesson-pitfall"><h3><ShieldCheck />容易弄错的地方</h3><p>{section.pitfall}</p></section>
    <section className="lesson-self-check"><h3><CircleHelp />学完先自检</h3><p>{section.check.question}</p><details><summary>查看参考答案与解析</summary><p>{section.check.answer}</p></details><small>先用自己的话回答，再展开核对；自检不替代结课测验。</small></section>
    {section.id === 'workflow' && mission && <section className="lesson-mission"><h3>接下来可以练什么？</h3><p>通过本课结课测验后，可进入配套靶场“{mission.title}”。先读任务说明，再结合本节讲解练习：</p><code>{mission.command}</code><p>{mission.knowledge.join('；')}。</p></section>}
    <section className="lesson-resources">
      <h3><BookOpen />继续阅读：中文导读与官方资料</h3>
      <p className="lesson-source-note">本页内容校对于 {reviewedAt}。下方为本站编写的中文导读，非官方全文翻译；版本与参数请结合官方最新原文核对。</p>
      {resources.map(resource => <details className="lesson-source" key={resource.url}>
        <summary><span>{resource.title}<small>{resource.source} · 中文导读</small></span><ChevronDown /></summary>
        <div className="lesson-source-body"><p>{resource.summary}</p><ul>{resource.points.map(item => <li key={item}>{item}</li>)}</ul><a href={resource.url} target="_blank" rel="noopener noreferrer">查看官方原文 <ExternalLink /></a></div>
      </details>)}
    </section>
  </div>
}
