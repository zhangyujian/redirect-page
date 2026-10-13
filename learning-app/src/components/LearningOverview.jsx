import { ArrowRight, BookOpen, Check, CheckCircle2, ChevronRight, Clock3, Command, GraduationCap, LockKeyhole, NotebookPen, Play, Settings, ShieldCheck, Target } from 'lucide-react'
import DistroLogo from './DistroLogo'
import { courseIsUnlocked, recommendedLesson } from '../data/learningNavigation.js'
import { practiceCases } from '../data/practiceCases.js'
import { getDistroCommands } from '../data/commandCatalog.js'

export default function LearningOverview({ distro, catalog, courseProgress, learningProgress, completed, learnerStats, studyMinutes, dailyGoal, onNavigate, onOpenCourse, onSelectDistro, onSelectCertification, onFocus, onGoal, syncStatus, onAccount, children }) {
  const next = recommendedLesson(distro.lessons, courseProgress)
  const nextState = courseProgress[next.id] || { sections: [] }
  const allDone = learningProgress.completedCourses === distro.lessons.length
  const started = learningProgress.done > 0
  const missionReady = Boolean(courseProgress[distro.mission.requiredCourseId]?.completed)
  const goalProgress = Math.min(100, Math.round(studyMinutes / dailyGoal * 100))
  const nextSection = nextState.sections.length >= 3 ? '结课测验' : ['场景与学习目标', '核心知识', '安全工作流'][nextState.sections.length]
  const metrics = [
    { icon: BookOpen, value: `${learningProgress.done - learningProgress.completedCourses} / 12`, label: '核心章节', note: '每一步都来自你的完成记录' },
    { icon: GraduationCap, value: `${learningProgress.completedCourses} / 4`, label: '课程测验通过', note: '按顺序学习，逐课解锁' },
    { icon: Target, value: String(learnerStats.missions), label: '靶场任务完成', note: '当前系统独立记录' },
  ]

  return <div className="page learning-overview">
    <div className="overview-welcome"><div><span className="overview-eyebrow">YOUR LEARNING WORKSPACE</span><h2>{allDone ? '基础已打好，继续探索。' : started ? '接着上次的进度，继续。' : '从第一课开始，把知识练成能力。'}</h2><p>读懂原理，动手验证，再用自己的话复盘。每一次完成，都让下一步更清楚。</p></div><span className="overview-local-badge"><ShieldCheck size={16} />个人学习空间</span></div>

    <section className="overview-start" aria-label="推荐下一步">
      <div className="overview-start-copy">
        <div className="overview-path-label"><DistroLogo distro={distro} /><span>{distro.name}<small>当前学习路径 · {distro.packageManager}</small></span><button onClick={() => onNavigate('distros')}>切换路径 <ChevronRight size={14} /></button></div>
        <span className="overview-eyebrow">{allDone ? '回顾与巩固' : started ? '你的下一步' : '推荐起点 · 零基础也能开始'}</span>
        <h3>{next.title}</h3><p>{next.description}</p>
        <div className="overview-course-meta"><span><Clock3 size={16} />{next.duration}</span><span><BookOpen size={16} />3 节内容 + 1 次测验</span></div>
        <div className="overview-start-actions"><button className="primary-button" onClick={() => onOpenCourse(next.id)}><Play size={17} fill="currentColor" />{allDone ? '复习第一课' : nextState.sections.length ? '继续学习' : '开始学习'}<ArrowRight size={17} /></button><button className="overview-text-button" onClick={() => onNavigate('courses')}>查看完整课程路径 <ArrowRight size={15} /></button></div>
        <div className="overview-resume-note"><span className="overview-status-dot" />{allDone ? '所有基础课程已完成，可从实战案例继续深入。' : `进入后从「${nextSection}」继续，已完成章节会保留。`}</div>
      </div>
      <aside className="overview-path-map" aria-label="四课学习路线">
        <div className="overview-map-heading"><strong>你的能力路线</strong><span>{learningProgress.percent}% 完成</span></div>
        <div className="overview-map-progress" role="progressbar" aria-label="学习路径完成度" aria-valuemin={0} aria-valuemax={100} aria-valuenow={learningProgress.percent}><span style={{ width: `${learningProgress.percent}%` }} /></div>
        {distro.lessons.map((lesson, index) => {
          const done = Boolean(courseProgress[lesson.id]?.completed)
          const unlocked = courseIsUnlocked(distro.lessons, courseProgress, lesson.id)
          return <button key={lesson.id} className={`overview-map-step ${done ? 'done' : lesson.id === next.id ? 'current' : ''}`} onClick={() => onOpenCourse(lesson.id)} disabled={!unlocked} aria-label={`${lesson.title}，${done ? '已完成' : unlocked ? '可学习' : '完成前置课程后解锁'}`}><span className="overview-step-icon">{done ? <Check size={15} /> : !unlocked ? <LockKeyhole size={14} /> : String(index + 1).padStart(2, '0')}</span><span><small>{lesson.phase} · 第 {index + 1} 课</small><strong>{lesson.title}</strong></span>{unlocked && <ChevronRight size={16} />}</button>
        })}
      </aside>
    </section>

    <section className="overview-metrics" aria-label="真实学习进度">{metrics.map(({ icon: Icon, value, label, note }) => <div key={label}><span className="overview-metric-icon"><Icon size={21} /></span><div><span>{label}</span><strong>{value}</strong><small>{note}</small></div></div>)}</section>

    <div className="overview-content-grid">
      <section className="overview-tools"><div className="overview-section-heading"><div><span className="overview-eyebrow">LEARN BY DOING</span><h3>学习、练习、复盘，一步连起来</h3></div></div><div className="overview-tool-grid">
        {[
          { icon: Target, page: 'practice', title: '配套靶场', detail: missionReady ? '用本课命令完成目标明确的任务。' : '先学前置课程，再用同一套知识验证。', tag: missionReady ? '已解锁' : '第 3 课后解锁', tone: 'cyan' },
          { icon: Command, page: 'commands', title: '中文命令手册', detail: '查询用途、参数、示例和系统差异。', tag: `${getDistroCommands(distro).length} 条命令`, tone: 'violet' },
          { icon: NotebookPen, page: 'notes', title: '我的学习笔记', detail: '记下命令、证据和结论，方便复习。', tag: '自动保存到本机', tone: 'green' },
        ].map(({ icon: Icon, page, title, detail, tag, tone }) => <button key={page} className={`overview-tool ${tone}`} onClick={() => onNavigate(page)}><span className="overview-tool-icon"><Icon size={23} /></span><strong>{title}</strong><p>{detail}</p><span className="overview-tool-bottom"><small>{tag}</small><ArrowRight size={18} /></span></button>)}
      </div><div className="overview-case-entry"><div><Target size={21} /><span><strong>想把知识用起来？</strong><small>{practiceCases[distro.id].length} 个基础与高级实战，含步骤和证据解读</small></span></div><button onClick={() => onNavigate('courses')}>浏览实战 <ArrowRight size={16} /></button></div></section>

      <aside className="overview-study-plan"><div className="overview-section-heading"><h3>留一点时间给学习</h3><button aria-label="调整学习目标" onClick={onGoal}><Settings size={18} /></button></div><p>不必一次学很多，完成一个小节也算前进。</p><div className="overview-goal"><strong>{studyMinutes}<small> / {dailyGoal} 分钟</small></strong><span>已记录学习</span></div><div className="overview-goal-track"><span style={{ width: `${goalProgress}%` }} /></div><button className="secondary-button" onClick={onFocus}><Clock3 size={16} />开启专注计时 <ArrowRight size={16} /></button><small className="overview-time-note">时长包含专注计时、手动记录与课程完成估算；不作为活跃天数统计。</small></aside>
    </div>

    <section className="overview-certifications" aria-label="认证备考入口"><div className="overview-section-heading"><div><span className="overview-eyebrow">BUILD SKILLS FOR YOUR NEXT STEP</span><h3>有考证目标？从技能地图开始</h3></div><button className="overview-text-button" onClick={() => onNavigate('certifications')}>查看备考路线<ArrowRight size={15} /></button></div><div>{[['cisp', 'CISP', '保障、管理与工程'], ['cissp', 'CISSP', '八个知识域与管理判断'], ['oscp', 'OSCP+', '枚举、验证与综合实战']].map(([id, name, text]) => <button key={id} onClick={() => onSelectCertification(id)}><GraduationCap size={22} /><span><strong>{name}</strong><small>{text}</small></span><ArrowRight size={17} /></button>)}</div></section>
    <section className="overview-distros" aria-label="选择学习系统"><div className="overview-section-heading"><div><span className="overview-eyebrow">FOUR SYSTEMS, YOUR PACE</span><h3>四个系统，各有方向</h3></div><span>进度按系统分别记录</span></div><div className="overview-distro-grid">{Object.values(catalog).map(item => <button key={item.id} className={item.id === distro.id ? 'selected' : ''} aria-pressed={item.id === distro.id} onClick={() => onSelectDistro(item.id)}><DistroLogo distro={item} /><strong>{item.shortName}</strong><p>{item.focus}</p><span>{item.id === distro.id ? <><CheckCircle2 size={14} />正在学习</> : <>选择路径 <ArrowRight size={14} /></>}</span></button>)}</div></section>

    <details className="overview-help"><summary><BookOpen size={18} /><strong>第一次使用？查看完整学习流程</strong><ChevronRight size={17} /></summary><ol><li><strong>选择系统</strong>：刚入门可以从 Kali 开始，也可以按兴趣选择其他路径。</li><li><strong>完成课程</strong>：阅读三个章节，点击“完成并继续”，通过测验后解锁下一课。</li><li><strong>动手验证</strong>：课程中的示例和实战可先预览，配套靶场在学完前置课后开放。</li><li><strong>记下结论</strong>：用命令手册查缺补漏，把现象、证据和自己的解释记录在笔记中。</li></ol></details>

    {children}
    <div className={`overview-save-notice ${syncStatus.state}`} role="status"><ShieldCheck size={17} /><span><strong>{syncStatus.title}</strong>{syncStatus.description}</span><button onClick={onAccount}>{syncStatus.state === 'guest' ? '登录同步课程' : '查看账户'}<ArrowRight size={15} /></button></div>
  </div>
}
