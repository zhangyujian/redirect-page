import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowRight, BookOpen, RotateCcw } from 'lucide-react'
import { completeCommand, createSandbox, displayPath, executeSandbox, sandboxExercises, supportedCommands } from '../sandbox/index.js'
import './TerminalLab.css'

export default function TerminalLab({ onMissionComplete, distro }) {
  const [sandbox, setSandbox] = useState(() => createSandbox(distro))
  const [history, setHistory] = useState([{ type: 'system', lines: [`Security Path Sandbox // ${distro.name}`, '输入 help 查看范围；man 1 ls 阅读中文说明。文件、网络与服务均为离线模拟。'] }])
  const [input, setInput] = useState('')
  const [showGuide, setShowGuide] = useState(false)
  const [activeExercise, setActiveExercise] = useState(0)
  const [completedSteps, setCompletedSteps] = useState([])
  const [confirmReset, setConfirmReset] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const bodyRef = useRef(null), inputRef = useRef(null), historyPosition = useRef(null), draft = useRef('')
  const exercises = useMemo(() => sandboxExercises(sandbox), [sandbox.initialPath, sandbox.id])
  const commandCount = Object.keys(supportedCommands(distro.id)).length

  useEffect(() => { bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: 'smooth' }) }, [history])

  function fill(command) {
    setInput(command); setSuggestions([]); historyPosition.current = null
    inputRef.current?.focus()
  }

  function run(raw) {
    if (!raw.trim()) return
    const path = displayPath(sandbox)
    const result = executeSandbox(sandbox, raw)
    setSandbox(result.state)
    setHistory(items => [...(result.clear ? [] : items), ...(!result.clear ? [{ type: 'command', value: raw, path }] : []), ...(result.lines.length ? [{ type: result.code ? 'error' : 'output', lines: result.lines }] : [])].slice(-160))
    setInput(''); setSuggestions([]); historyPosition.current = null
    if (result.code === 0) setCompletedSteps(steps => [...new Set([...steps, raw.trim()])])
    if (result.missionCompleted) onMissionComplete?.()
    inputRef.current?.focus()
  }

  function onKeyDown(event) {
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault()
      const commands = sandbox.history
      if (!commands.length) return
      if (historyPosition.current === null) { draft.current = input; historyPosition.current = commands.length }
      historyPosition.current = Math.max(0, Math.min(commands.length, historyPosition.current + (event.key === 'ArrowUp' ? -1 : 1)))
      setInput(historyPosition.current === commands.length ? draft.current : commands[historyPosition.current])
    } else if (event.key === 'Tab') {
      event.preventDefault()
      const matches = completeCommand(sandbox, input)
      if (matches.length === 1) fill(matches[0])
      else setSuggestions(matches)
    } else if (event.ctrlKey && event.key.toLowerCase() === 'l') {
      event.preventDefault(); setHistory([])
    } else if (event.ctrlKey && event.key.toLowerCase() === 'c') {
      event.preventDefault(); setInput(''); setSuggestions([]); historyPosition.current = null
    }
  }

  function reset() {
    setSandbox(createSandbox(distro))
    setHistory([{ type: 'system', lines: ['沙盒已重置，初始样本已恢复。不会清除课程进度或学习笔记。'] }])
    setCompletedSteps([]); setConfirmReset(false); fill('')
  }

  return <div className="terminal-shell interactive-sandbox">
    <div className="terminal-bar">
      <div className="window-dots"><span /><span /><span /></div>
      <span>{sandbox.user}@path: {displayPath(sandbox)}</span>
      <div className="sandbox-status"><span /> 离线沙盒</div>
    </div>
    <div className="sandbox-toolbar">
      <span>{commandCount} 个命令入口 · 支持范围见帮助</span>
      <div>
        <button type="button" onClick={() => setShowGuide(!showGuide)} aria-expanded={showGuide}><BookOpen size={16} />{showGuide ? '收起练习' : '分步练习'}</button>
        <button type="button" onClick={() => run('help all')}>命令列表</button>
        <button type="button" onClick={() => setConfirmReset(true)}><RotateCcw size={15} />重置</button>
      </div>
    </div>
    {confirmReset && <div className="sandbox-reset" role="alert">
      <p>确认重置当前沙盒？虚拟文件、服务状态和终端历史会清空，课程进度与学习笔记不受影响。</p>
      <button type="button" onClick={reset}>确认重置</button><button type="button" onClick={() => setConfirmReset(false)}>取消</button>
    </div>}
    {showGuide && <section className="sandbox-guide" aria-label="沙盒分步练习">
      <div className="sandbox-exercise-tabs">{exercises.map((exercise, index) => <button type="button" key={exercise.title} className={index === activeExercise ? 'selected' : ''} aria-pressed={index === activeExercise} onClick={() => setActiveExercise(index)}>{exercise.title}</button>)}</div>
      <p>按顺序点击命令填入，再按 Enter 执行；完成标记仅表示该步骤成功运行，不计入课程成绩。</p>
      <ol>{exercises[activeExercise].steps.map(([description, command], index) => <li key={command}>
        <span className={completedSteps.includes(command) ? 'step-done' : ''}>{completedSteps.includes(command) ? '完成' : index + 1}</span>
        <button type="button" onClick={() => fill(command)} title="填入命令，不立即执行"><strong>{description}</strong><code>{command}</code></button>
      </li>)}</ol>
    </section>}
    <div className="terminal-body" ref={bodyRef} role="region" aria-label="沙盒终端输出" tabIndex={0}>
      {history.map((item, index) => item.type === 'command'
        ? <div className="terminal-line" key={index}><span className="prompt">{sandbox.user}@path</span><span className="colon">:</span><span className="path">{item.path}</span><span className="dollar">$</span> {item.value}</div>
        : <div className={item.type === 'system' ? 'terminal-system' : `terminal-output ${item.type === 'error' ? 'terminal-error' : ''}`} key={index}>{item.lines.map((line, lineIndex) => <div key={lineIndex}>{line || '\u00a0'}</div>)}</div>)}
      <form className="terminal-input-line" onSubmit={event => { event.preventDefault(); run(input) }}>
        <span className="prompt">{sandbox.user}@path</span><span className="colon">:</span><span className="path">{displayPath(sandbox)}</span><span className="dollar">$</span>
        <input ref={inputRef} value={input} onChange={event => { setInput(event.target.value); setSuggestions([]); historyPosition.current = null }} onKeyDown={onKeyDown} aria-label="模拟终端命令" autoComplete="off" autoCapitalize="none" autoCorrect="off" enterKeyHint="send" spellCheck="false" maxLength={4096} />
        <button type="submit" aria-label="运行命令"><ArrowRight size={18} /></button>
      </form>
      {suggestions.length > 0 && <div className="sandbox-completions" aria-label="命令补全建议">{suggestions.map(command => <button key={command} onClick={() => fill(command)}>{command}</button>)}</div>}
    </div>
    <div className="sandbox-footer">Enter 执行 · ↑↓ 历史 · Tab 补全 · Ctrl+L 清屏。文件仅在当前终端暂存，离开或刷新后重置。</div>
  </div>
}
