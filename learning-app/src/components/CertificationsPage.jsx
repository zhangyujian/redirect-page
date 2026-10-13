import { useState } from 'react'
import { ArrowRight, Award, BookOpen, Check, ChevronDown, ClipboardList, Copy, ExternalLink, GraduationCap, Search, ShieldCheck, Target } from 'lucide-react'
import { CERTIFICATION_REVIEWED_AT, certificationReportTemplate, certifications, certificationSkillIds, certificationSkills, certificationSources } from '../data/certifications.js'
import './CertificationsPage.css'

const coverageLabels = { foundation: '站内基础训练', partial: '站内部分覆盖', external: '需外部授权实验' }

function SkillCard({ skillId, checked, onCheck, onOpenCourse, onOpenCommand }) {
  const skill = certificationSkills[skillId]
  return <details className={`cert-skill ${skill.coverage}`}>
    <summary><span className="cert-skill-symbol">{checked ? <Check size={18} /> : <Target size={18} />}</span><span><strong>{skill.title}</strong><small>{coverageLabels[skill.coverage]}</small></span><ChevronDown size={18} /></summary>
    <div className="cert-skill-body"><p className="cert-why">{skill.why}</p><h4>用这个场景训练</h4><p>{skill.scenario}</p><h4>建议练习步骤</h4><ol>{skill.steps.map(step => <li key={step}>{step}</li>)}</ol><div className="cert-deliverable"><ClipboardList size={18} /><div><h4>怎样证明练会了</h4><p>{skill.deliverable}</p></div></div><div className="cert-gap"><strong>还需要补什么？</strong><p>{skill.gap}</p></div><div className="cert-skill-actions">{skill.entry && <button className="primary-button" onClick={() => onOpenCourse(skill.entry.courseId, skill.entry.distroId, skill.entry.caseId)}><BookOpen size={16} />进入站内配套案例<ArrowRight size={16} /></button>}{skill.command && <button className="secondary-button" onClick={() => onOpenCommand(skill.command, skill.entry.distroId)}><Search size={15} />查 {skill.command} 命令</button>}{!skill.entry && <a href={certificationSources.oscpKnowledge.url} target="_blank" rel="noopener noreferrer">查看官方训练范围 <ExternalLink size={14} /></a>}</div><label className="cert-self-assessment"><input type="checkbox" checked={checked} onChange={event => onCheck(skillId, event.target.checked)} /><span>我已完成相应训练，并保留可复核的笔记或报告<small>这是个人自评，不自动解锁课程，也不代表通过认证。</small></span></label></div>
  </details>
}

function ScenarioDrill({ drill }) {
  const [answer, setAnswer] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const correct = answer === drill.answer
  return <article className="cert-drill"><h4>{drill.question}</h4><div className="cert-drill-options" role="group" aria-label={drill.question}>{drill.options.map((option, index) => <button key={option} aria-pressed={answer === index} onClick={() => { setAnswer(index); setSubmitted(false) }}><span>{String.fromCharCode(65 + index)}</span>{option}</button>)}</div><button className="secondary-button" disabled={answer === null} onClick={() => setSubmitted(true)}>检查理解 <Check size={15} /></button>{submitted && <p className={`cert-drill-feedback ${correct ? 'correct' : 'incorrect'}`} role="status"><strong>{correct ? '理解正确' : '需要再想一想'}</strong>{drill.explanation}{!correct && <span>参考选择：{String.fromCharCode(65 + drill.answer)}。可回看上面的相关训练说明。</span>}</p>}</article>
}

export default function CertificationsPage({ certificationId = 'cisp', onSelectCertification, onOpenCourse, onOpenCommand, onNavigate, userId = 'guest' }) {
  const certification = certifications[certificationId] || certifications.cisp
  const storageKey = `security-path-certification-checks-v1-${userId}`
  const [checks, setChecks] = useState(() => {
    try { const saved = JSON.parse(localStorage.getItem(storageKey)); return saved && typeof saved === 'object' && !Array.isArray(saved) ? saved : {} } catch { return {} }
  })
  const [saveStatus, setSaveStatus] = useState('自评清单保存在当前浏览器，不计入课程 XP。')
  const [filter, setFilter] = useState('all')
  const [copyStatus, setCopyStatus] = useState('')
  const ids = certificationSkillIds(certification.id)
  const completed = ids.filter(id => checks[`${certification.id}:${id}`] === true).length
  const external = ids.filter(id => certificationSkills[id].coverage === 'external').length
  const percent = Math.round(completed / ids.length * 100)

  function checkSkill(id, checked) {
    const next = { ...checks, [`${certification.id}:${id}`]: checked }
    setChecks(next)
    try { localStorage.setItem(storageKey, JSON.stringify(next)); setSaveStatus('自评清单已保存到当前浏览器；不计入课程 XP。') }
    catch { setSaveStatus('浏览器暂不能保存，当前自评仅在本次页面中保留。') }
  }

  async function copyTemplate() {
    try { await navigator.clipboard.writeText(certificationReportTemplate(certification.id)); setCopyStatus('复盘模板已复制，可粘贴到学习笔记中。') }
    catch { setCopyStatus('复制未获允许，请展开下方模板选中文字复制。') }
  }

  return <div className="page certifications-page">
    <section className="cert-intro"><span className="overview-eyebrow">CERTIFICATION SKILL MAP</span><h2>向证书出发，先把能力练扎实。</h2><p>找到要练的技能、进入配套案例、检查自己的证据，再补齐完整考试范围。</p><div className="cert-intro-meta"><ShieldCheck size={16} />官方资料核对于 {CERTIFICATION_REVIEWED_AT} · 本站独立编写的学习建议</div></section>
    <nav className="cert-picker" aria-label="选择备考认证">{Object.values(certifications).map(item => <button key={item.id} aria-pressed={certification.id === item.id} onClick={() => { onSelectCertification(item.id); setFilter('all'); setCopyStatus('') }}><Award size={24} /><span><strong>{item.name}</strong><small>{item.subtitle}</small></span>{certification.id === item.id && <Check size={19} />}</button>)}</nav>

    <section className={`cert-overview ${certification.tone}`} aria-label={`${certification.name} 备考概览`}><div><span className="overview-eyebrow">{certification.name} LEARNING PLAN</span><h3>{certification.subtitle}</h3><p>{certification.intro}</p><div className="cert-facts">{certification.facts.map(fact => <span key={fact}><Check size={13} />{fact}</span>)}</div></div><aside><span>个人技能自评</span><strong>{completed}<small> / {ids.length}</small></strong><div role="progressbar" aria-label="备考技能自评完成度" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}><i style={{ width: `${percent}%` }} /></div><p>{external ? `${external} 项需要额外授权实验环境` : '基础训练之外仍需系统教材学习'}<br />自评百分比不是考试通过概率</p></aside></section>

    <details className="cert-requirements"><summary><GraduationCap size={19} /><strong>报考与获证前，还需确认什么？</strong><ChevronDown size={18} /></summary><p>{certification.eligibility}</p><ul>{certification.gaps.map(gap => <li key={gap}>{gap}</li>)}</ul>{certification.id === 'oscp' && <p>正式考试的工具限制与学习阶段不同。考试指南明确限制自动利用、批量漏洞扫描和 AI 聊天工具，Metasploit 也有使用限制；报考前请逐项阅读最新规则。</p>}<p>下面的训练分组和验收建议由本站编写；官方范围、资格与报名安排以各机构实时文件为准。</p></details>

    <div className="cert-map-heading"><div><h3>这些技能，建议逐项练到能解释、能复现</h3><p>点击每一项查看场景、步骤、验收标准和站内入口。不同系统案例会自动切换到对应路径。</p></div><label>查看范围<select value={filter} onChange={event => setFilter(event.target.value)}><option value="all">全部技能</option><option value="onsite">本站可辅助训练</option><option value="external">需外部授权实验</option><option value="pending">尚未自评完成</option></select></label></div>
    <div className="cert-legend"><span className="foundation">站内基础训练</span><span className="partial">站内部分覆盖</span><span className="external">需外部授权实验</span></div>
    <p className="cert-save-status" role="status">{saveStatus}</p>
    <div className="cert-modules">{certification.modules.map((module, index) => {
      const skills = module.skills.filter(id => filter === 'all' || filter === 'onsite' && certificationSkills[id].coverage !== 'external' || filter === 'external' && certificationSkills[id].coverage === 'external' || filter === 'pending' && !checks[`${certification.id}:${id}`])
      if (!skills.length) return null
      return <section key={module.title} className="cert-module"><header><span>{String(index + 1).padStart(2, '0')}</span><h3>{module.title}</h3>{module.weight && <em>官方权重 {module.weight}%</em>}</header>{skills.map(id => <SkillCard key={`${certification.id}:${id}`} skillId={id} checked={checks[`${certification.id}:${id}`] === true} onCheck={checkSkill} onOpenCourse={onOpenCourse} onOpenCommand={onOpenCommand} />)}</section>
    })}</div>
    {(filter === 'external' && external === 0 || filter === 'pending' && completed === ids.length) && <div className="cert-filter-empty"><Check size={22} /><p>{filter === 'external' ? '本路径没有单列外部靶场技能；各技能仍有需要补充的教材范围。' : '这条路线的技能已全部自评。建议再用独立复现验证，而不是只看勾选。'}</p><button className="secondary-button" onClick={() => setFilter('all')}>查看全部技能</button></div>}

    <section className="cert-drills"><div className="overview-section-heading"><div><span className="overview-eyebrow">CHECK YOUR REASONING</span><h3>原创情景自测：检查思路，不背答案</h3></div></div><p>以下题目由本站独立编写，用于复习判断方法，不是官方题库、真题或完整模拟考试。</p>{certification.drills.map(drill => <ScenarioDrill key={`${certification.id}:${drill.id}`} drill={drill} />)}</section>
    <section className="cert-report"><div><ClipboardList size={25} /><div><h3>把“练过”变成“有证据”</h3><p>每完成一个技能，写下范围、操作、观察和判断。复盘模板可直接粘贴到笔记中。</p></div></div><div className="cert-report-actions"><button className="primary-button" onClick={copyTemplate}><Copy size={16} />复制复盘模板</button><button className="secondary-button" onClick={() => onNavigate('notes')}>打开我的笔记<ArrowRight size={16} /></button></div>{copyStatus && <p role="status">{copyStatus}</p>}<details><summary>展开模板预览</summary><pre tabIndex={0}>{certificationReportTemplate(certification.id)}</pre></details></section>
    <section className="cert-official"><h3><BookOpen size={20} />官方范围与报名资料</h3><p>本站课程不会自动获得考试报名资格。把下面的官方页面作为范围和规则核验入口。</p>{certification.sources.map(key => <a key={key} href={certificationSources[key].url} target="_blank" rel="noopener noreferrer"><span>{certificationSources[key].title}</span><ExternalLink size={16} /></a>)}</section>
  </div>
}
