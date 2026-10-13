import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BarChart3,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Clock3,
  Code2,
  Command,
  ExternalLink,
  FolderOpen,
  GraduationCap,
  Home,
  LayoutDashboard,
  LockKeyhole,
  Menu,
  Network,
  NotebookPen,
  Pause,
  Play,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  TerminalSquare,
  Timer,
  Trophy,
  UserRound,
  X,
  Zap,
} from 'lucide-react'
import { isSupabaseConfigured, loadLearningProgress, saveLearningProgress, supabase } from './supabase'
import CommandsPage from './components/CommandsPage'
import DistroLogo from './components/DistroLogo'
import TerminalLab from './components/TerminalLab'
import CourseChapter, { CourseReview } from './components/CourseChapter'
import PracticeCase, { PracticeCaseList } from './components/PracticeCase'
import { getDistroCommands } from './data/commandCatalog'
import { courseGuides } from './data/courseGuides'
import { courseChapters, courseDetails } from './data/courseDetails'
import { getCoursePracticeCases, getPracticeCase } from './data/practiceCases'
import LearningOverview from './components/LearningOverview'
import CertificationsPage from './components/CertificationsPage'
import { certifications } from './data/certifications'
import { learningRouteUrl, readLearningRoute, recommendedLesson } from './data/learningNavigation'

export const distroCatalog = {
  kali: {
    id: 'kali',
    name: 'Kali Linux',
    shortName: 'Kali',
    mark: 'K',
    theme: 'kali',
    base: 'Debian Testing',
    packageManager: 'APT',
    focus: '通用安全测试与取证基础',
    audience: '适合从标准安全工作流开始的学习者',
    greeting: '继续建立你的 Linux 基础。今天，用一个真实场景理解服务发现。',
    lessons: [
      { id: 1, phase: '起步', title: '认识 Kali Linux', description: '了解系统定位、使用边界与实验环境。', duration: '约 30 分钟', lessons: 4, icon: GraduationCap, color: 'violet' },
      { id: 2, phase: '基础', title: 'Kali 命令行生存指南', description: '掌握文件、权限、管道与进程管理。', duration: '约 30 分钟', lessons: 4, icon: TerminalSquare, color: 'cyan' },
      { id: 3, phase: '侦察', title: '网络与服务发现', description: '在授权靶场中理解主机、端口和服务。', duration: '约 30 分钟', lessons: 4, icon: Network, color: 'blue' },
      { id: 4, phase: '防御', title: '日志分析与系统加固', description: '从日志中发现异常并修复基础配置。', duration: '约 30 分钟', lessons: 4, icon: ShieldCheck, color: 'green' },
    ],
    mission: {
      id: '01', title: '发现靶机服务', description: '在安全沙盒中使用服务版本探测，找出靶机开放的两个端口。',
      target: '192.168.56.101', hint: '先输入 cat mission.txt，再根据提示完成任务。', command: 'nmap -sV 192.168.56.101',
      requiredCourseId: 3, knowledge: ['理解端口状态', '使用 -sV 进行服务版本探测', '区分探测结果与漏洞证据'],
      objectives: ['读取任务说明', '扫描目标服务', '找出两个开放端口'],
      success: '你已经识别出 SSH 与 HTTP 服务。',
    },
    terminal: {
      user: 'kali', path: '~/lab',
      responses: {
        'cat mission.txt': ['MISSION 01 // SERVICE DISCOVERY', '目标：确认内置靶机 192.168.56.101 开放的服务。', '提示：使用 nmap -sV <目标地址>'],
        'nmap -sV 192.168.56.101': ['Starting Nmap 7.95 ( https://nmap.org )', 'Nmap scan report for lab-target (192.168.56.101)', 'PORT   STATE SERVICE VERSION', '22/tcp open  ssh     OpenSSH 9.2', '80/tcp open  http    nginx 1.22', 'Service detection performed. Host is up.'],
      },
    },
  },
  parrot: {
    id: 'parrot',
    name: 'Parrot Security OS',
    shortName: 'Parrot',
    mark: 'P',
    theme: 'parrot',
    base: 'Debian Stable',
    packageManager: 'APT',
    focus: '隐私保护、开发与防御分析',
    audience: '适合重视日常使用、隐私与安全开发的学习者',
    greeting: '从一个更注重隐私的工作台开始，学习系统审计与安全开发习惯。',
    lessons: [
      { id: 1, phase: '认识', title: '认识 Parrot Security OS', description: '理解 Security、Home 等使用场景与安全边界。', duration: '约 30 分钟', lessons: 4, icon: GraduationCap, color: 'cyan' },
      { id: 2, phase: '隐私', title: '隐私与身份保护基础', description: '学习元数据、浏览隔离和最小信息暴露原则。', duration: '约 30 分钟', lessons: 4, icon: ShieldCheck, color: 'green' },
      { id: 3, phase: '审计', title: '本机服务与暴露面审计', description: '检查监听服务、进程和基础防火墙状态。', duration: '约 30 分钟', lessons: 4, icon: Network, color: 'blue' },
      { id: 4, phase: '开发', title: '安全开发工作区', description: '隔离依赖、保护密钥并建立可复现的开发环境。', duration: '约 30 分钟', lessons: 4, icon: Code2, color: 'violet' },
    ],
    mission: {
      id: '01', title: '审计本机暴露面', description: '检查模拟工作站的监听服务，确认哪些端口只绑定在本机。',
      target: 'parrot-workstation', hint: '先读取任务，再使用 ss -tulpn 查看监听地址。', command: 'ss -tulpn',
      requiredCourseId: 3, knowledge: ['理解 127.0.0.1 与实验网卡绑定', '使用 ss 查看监听套接字', '关联端口、进程与暴露范围'],
      objectives: ['读取审计说明', '列出监听服务', '确认本机限定端口'],
      success: '你确认了 DNS 服务仅监听本机，HTTP 测试服务监听在实验网卡。',
    },
    terminal: {
      user: 'parrot', path: '~/audit',
      responses: {
        'cat mission.txt': ['MISSION 01 // LOCAL EXPOSURE AUDIT', '目标：查看工作站监听端口并判断绑定范围。', '提示：使用 ss -tulpn'],
        'ss -tulpn': ['Netid State  Local Address:Port  Process', 'udp   UNCONN 127.0.0.1:53       users:(("dnsmasq",pid=612))', 'tcp   LISTEN 192.168.56.20:8080 users:(("python3",pid=904))', '结论：53 端口仅本机可见；8080 端口对实验网络开放。'],
      },
    },
  },
  blackarch: {
    id: 'blackarch',
    name: 'BlackArch Linux',
    shortName: 'BlackArch',
    mark: 'B',
    theme: 'blackarch',
    base: 'Arch Linux',
    packageManager: 'pacman',
    focus: 'Arch 系统管理与安全工具生态',
    audience: '适合已有 Linux 基础、希望理解工具分类的学习者',
    greeting: '先掌握 Arch 的包管理与维护节奏，再进入庞大的安全工具分类体系。',
    lessons: [
      { id: 1, phase: '准备', title: '认识 BlackArch Linux', description: '理解完整镜像、仓库叠加与学习环境选择。', duration: '约 30 分钟', lessons: 4, icon: GraduationCap, color: 'violet' },
      { id: 2, phase: 'Arch', title: 'pacman 与滚动更新基础', description: '掌握同步升级、包查询与配置文件处理。', duration: '约 30 分钟', lessons: 4, icon: TerminalSquare, color: 'cyan' },
      { id: 3, phase: '生态', title: 'BlackArch 工具分类导航', description: '按审计、取证、网络和防御类别选择工具。', duration: '约 30 分钟', lessons: 4, icon: Command, color: 'blue' },
      { id: 4, phase: '维护', title: '快照、回滚与实验室维护', description: '为滚动发行版建立更新前检查和恢复流程。', duration: '约 30 分钟', lessons: 4, icon: ShieldCheck, color: 'green' },
    ],
    mission: {
      id: '01', title: '定位取证工具组', description: '使用模拟仓库搜索，找到 BlackArch 中适合文件取证的工具分类。',
      target: 'blackarch-repository', hint: '读取任务后，使用 pacman -Ss blackarch-forensic 搜索分类。', command: 'pacman -Ss blackarch-forensic',
      requiredCourseId: 3, knowledge: ['理解 BlackArch 工具分类', '使用 pacman -Ss 搜索仓库', '从包描述判断工具用途'],
      objectives: ['读取仓库任务', '搜索取证工具组', '识别两个示例包'],
      success: '你找到了 blackarch-forensic 分类，并识别出 sleuthkit 与 bulk-extractor。',
    },
    terminal: {
      user: 'blackarch', path: '~/workspace',
      responses: {
        'cat mission.txt': ['MISSION 01 // PACKAGE DISCOVERY', '目标：在模拟仓库中查找文件取证工具分类。', '提示：使用 pacman -Ss blackarch-forensic'],
        'pacman -Ss blackarch-forensic': ['blackarch/sleuthkit 4.12.1-1 [blackarch-forensic]', '    File system and media management forensic tools', 'blackarch/bulk-extractor 2.1.1-2 [blackarch-forensic]', '    Extract useful information without parsing file systems', '找到 2 个示例包。'],
      },
    },
  },
  pentoo: {
    id: 'pentoo', name: 'Pentoo Linux', shortName: 'Pentoo', mark: 'P', theme: 'pentoo',
    base: 'Gentoo Linux', packageManager: 'Portage / emerge',
    focus: 'Gentoo 定制、软件包与授权安全审计',
    audience: '适合愿意学习 Gentoo 包管理、构建选项与恢复流程的学习者',
    greeting: '从 Gentoo 基础出发，先读懂包计划和系统状态，再开始范围明确的安全实验。',
    lessons: [
      { id: 1, phase: '准备', title: '认识 Pentoo 与隔离实验室', description: '理解 Live 环境、Gentoo 基础与 Pentoo overlay。', duration: '约 30 分钟', lessons: 4, icon: GraduationCap, color: 'violet' },
      { id: 2, phase: 'Gentoo', title: 'Portage、USE 与依赖计划', description: '区分仓库同步、查询、预览和实际安装。', duration: '约 35 分钟', lessons: 4, icon: TerminalSquare, color: 'cyan' },
      { id: 3, phase: '审计', title: 'OpenRC 服务与暴露面审计', description: '关联服务状态、监听端口与最小变更验证。', duration: '约 35 分钟', lessons: 4, icon: Network, color: 'blue' },
      { id: 4, phase: '维护', title: '配置审查与恢复计划', description: '保留配置证据，审阅更新计划并验证恢复条件。', duration: '约 35 分钟', lessons: 4, icon: ShieldCheck, color: 'green' },
    ],
    mission: {
      id: '01', title: '审计 Pentoo 实验服务', description: '在 Pentoo 离线模型中核对监听地址、端口和进程，区分本机与实验网络暴露。',
      target: '192.168.56.40', hint: '先 cat mission.txt，再使用第 3 课讲解的 ss -tulpn。', command: 'ss -tulpn',
      requiredCourseId: 3, knowledge: ['区分服务运行与自启动', '使用 ss -tulpn 关联地址和进程', '理解回环地址与实验网卡的范围'],
      objectives: ['阅读授权范围', '核对服务监听', '记录本机与实验网络边界'],
      success: '已列出 Pentoo 样本的服务监听；请结合课程说明记录绑定地址，不把监听等同于公网可达。',
    },
    terminal: { user: 'pentoo', path: '~/lab', responses: {
      'cat mission.txt': ['PENTOO // LOCAL EXPOSURE AUDIT', '只检查离线 Pentoo 样本，地址 192.168.56.40。', '用 ss -tulpn 区分回环 DNS、SSH 和 lab-web 监听；无需访问真实网络。'],
    } },
  },
}

const CHALLENGE_FEED_URL = `${import.meta.env.BASE_URL}data/challenge-feed.json`
const CHALLENGE_FEED_STORAGE_KEY = 'security-path-challenge-feed'
const CHALLENGE_FEED_STATUS_KEY = 'security-path-challenge-feed-status'
const CHALLENGE_REFRESH_INTERVAL = 6 * 60 * 60 * 1000


function getCourseSections(distro, lesson) {
  const detail = courseDetails[distro.id][lesson.id]
  const icons = { overview: BookOpen, concepts: Sparkles, workflow: ShieldCheck }
  return courseChapters.map(chapter => ({ ...chapter, icon: icons[chapter.id], ...detail.sections[chapter.id] }))
}

const navItems = [
  { id: 'dashboard', label: '学习总览', icon: LayoutDashboard },
  { id: 'distros', label: '发行版中心', icon: FolderOpen },
  { id: 'courses', label: '课程路径', icon: GraduationCap },
  { id: 'certifications', label: '认证备考', icon: Award },
  { id: 'practice', label: '靶场练习', icon: Target },
  { id: 'commands', label: '命令手册', icon: Command },
  { id: 'notes', label: '我的笔记', icon: NotebookPen },
]

function readSaved(key, fallback) {
  try {
    const value = localStorage.getItem(key)
    return value === null ? fallback : JSON.parse(value)
  } catch {
    return fallback
  }
}

function writeSaved(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); return true }
  catch { return false }
}

function normalizeCommand(command) {
  return String(command || '').trim().toLowerCase().replace(/\s+/g, ' ')
}

function getChallengeFeedUrl() {
  const configured = import.meta.env.VITE_CHALLENGE_FEED_URL
  if (configured) return configured
  try {
    return localStorage.getItem('security-path-challenge-feed-url') || CHALLENGE_FEED_URL
  } catch {
    return CHALLENGE_FEED_URL
  }
}

function expandStarterQuestionSet(distroId, questions) {
  if (!Array.isArray(questions) || !questions.length || questions.length >= 3) return questions
  const source = questions[0]
  const variants = [
    { suffix: '基础复核', focus: '按课程步骤完成一次基础复核，并记录关键输出。' },
    { suffix: '结果记录', focus: '完成同一项检查后，把结果和判断依据写入学习笔记。' },
  ]
  return [source, ...variants.map((variant, index) => ({
    ...source,
    uid: `${source.uid}-${index + 2}`,
    id: String(Number(source.id || 2) + index + 1).padStart(2, '0'),
    title: `${source.title} · ${variant.suffix}`,
    description: `${source.description} ${variant.focus}`,
    hint: `${source.hint} 重点：${variant.focus}`,
    updatedAt: source.updatedAt || 'local',
  }))]
}

function normalizeChallengeFeed(feed) {
  if (!feed || typeof feed !== 'object' || !feed.questions || typeof feed.questions !== 'object') return null
  return {
    version: String(feed.version || 'local'),
    updatedAt: String(feed.updatedAt || ''),
    title: String(feed.title || 'Security Path 练习题库'),
    source: String(feed.source || '题库更新源'),
    questions: Object.fromEntries(Object.entries(feed.questions).map(([distroId, questions]) => [distroId, expandStarterQuestionSet(distroId, questions)])),
  }
}

function getLatestFeedQuestion(feed, distroId) {
  const questions = getFeedQuestions(feed, distroId)
  return questions[0] || null
}

function getFeedQuestions(feed, distroId) {
  const questions = feed?.questions?.[distroId]
  if (!Array.isArray(questions) || !questions.length) return []
  return [...questions].sort((a, b) => String(b.updatedAt || feed.updatedAt || '').localeCompare(String(a.updatedAt || feed.updatedAt || '')))
}

function sanitizeFeedQuestion(feed, distroId, candidate = null) {
  const question = candidate || getLatestFeedQuestion(feed, distroId)
  const base = distroCatalog[distroId]
  const requiredCourseId = base?.mission?.requiredCourseId
  const courseCommand = courseGuides[distroId]?.[requiredCourseId]?.command
  if (!question || !base || !courseCommand) return null
  if (Number(question.requiredCourseId) !== requiredCourseId) return null
  if (normalizeCommand(question.command) !== normalizeCommand(courseCommand)) return null

  const terminalResponses = question.terminalResponses && typeof question.terminalResponses === 'object' ? question.terminalResponses : {}
  const normalizedResponseKeys = Object.keys(terminalResponses).map(normalizeCommand)
  if (!normalizedResponseKeys.includes('cat mission.txt') || !normalizedResponseKeys.includes(normalizeCommand(question.command))) return null

  const requiredStrings = ['uid', 'id', 'title', 'description', 'target', 'hint', 'command', 'success']
  if (requiredStrings.some((key) => !question[key])) return null
  if (![question.knowledge, question.objectives].every((value) => Array.isArray(value) && value.length >= 3)) return null

  return {
    uid: String(question.uid),
    id: String(question.id),
    title: String(question.title),
    description: String(question.description),
    target: String(question.target),
    hint: String(question.hint),
    command: String(question.command),
    requiredCourseId,
    difficulty: String(question.difficulty || '初级'),
    knowledge: question.knowledge.map(String),
    objectives: question.objectives.slice(0, 3).map(String),
    success: String(question.success),
    sourceLinks: Array.isArray(question.sourceLinks) ? question.sourceLinks.filter((item) => item?.title && item?.url).map((item) => ({ title: String(item.title), url: String(item.url) })) : [],
    updatedAt: String(question.updatedAt || feed.updatedAt || ''),
    feedVersion: feed.version,
    feedSource: feed.source,
    fromFeed: true,
    terminalResponses,
  }
}

function getAvailableFeedQuestions(feed, distroId) {
  return getFeedQuestions(feed, distroId).map((question) => sanitizeFeedQuestion(feed, distroId, question)).filter(Boolean)
}

function applyChallengeFeedToDistro(baseDistro, feed, questionIndex = 0) {
  const questions = getAvailableFeedQuestions(feed, baseDistro.id)
  const question = questions[questionIndex % Math.max(questions.length, 1)] || sanitizeFeedQuestion(feed, baseDistro.id)
  if (!question) return baseDistro
  const { terminalResponses, ...mission } = question
  return {
    ...baseDistro,
    mission: { ...baseDistro.mission, ...mission },
    terminal: { ...baseDistro.terminal, responses: { ...baseDistro.terminal.responses, ...terminalResponses } },
  }
}

function getMissionKey(mission) {
  return mission?.uid || `builtin-${mission?.id || '01'}`
}

function isMissionCompleted(completionMap, distroId, missionKey) {
  const entry = completionMap?.[distroId]
  if (entry && typeof entry === 'object') return Boolean(entry[missionKey])
  if (typeof entry === 'boolean') return missionKey.startsWith('builtin-') ? entry : false
  return false
}

function setMissionCompleted(current, distroId, missionKey, value) {
  const entry = current?.[distroId]
  const previous = entry && typeof entry === 'object' ? entry : (entry ? { 'builtin-01': true } : {})
  return { ...current, [distroId]: { ...previous, [missionKey]: Boolean(value) } }
}

function hasAnyMissionCompletion(completionMap, distroId) {
  const entry = completionMap?.[distroId]
  if (entry && typeof entry === 'object') return Object.values(entry).some(Boolean)
  return Boolean(entry)
}

function Modal({ title, eyebrow, onClose, children, wide = false, className = '' }) {
  const dialogRef = useRef(null)
  useEffect(() => {
    const previousFocus = document.activeElement
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialogRef.current?.querySelector('button')?.focus()
    function closeOnEscape(event) {
      const dialogs = document.querySelectorAll('[role="dialog"]')
      if (dialogs[dialogs.length - 1] !== dialogRef.current) return
      if (event.key === 'Escape') { event.stopPropagation(); closeRef.current() }
      if (event.key !== 'Tab') return
      const controls = [...dialogRef.current.querySelectorAll('button:not(:disabled), a[href], input, textarea, select, summary, [tabindex="0"]')].filter(element => element.getClientRects().length)
      const first = controls[0]
      const last = controls[controls.length - 1]
      if (event.shiftKey && (document.activeElement === first || !dialogRef.current.contains(document.activeElement))) { event.preventDefault(); last?.focus() }
      else if (!event.shiftKey && (document.activeElement === last || !dialogRef.current.contains(document.activeElement))) { event.preventDefault(); first?.focus() }
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      window.removeEventListener('keydown', closeOnEscape)
      document.body.style.overflow = previousOverflow
      if (previousFocus?.isConnected) previousFocus.focus()
    }
  }, [])
  const closeRef = useRef(onClose)
  closeRef.current = onClose

  return (
    <div className="modal-layer" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section ref={dialogRef} className={`modal-card ${wide ? 'wide' : ''} ${className}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head">
          <div>{eyebrow && <span className="section-kicker">{eyebrow}</span>}<h2>{title}</h2></div>
          <button className="modal-close" onClick={onClose} aria-label="关闭弹窗"><X size={19} /></button>
        </div>
        {children}
      </section>
    </div>
  )
}

function getCourseState(courseProgress, courseId) {
  return courseProgress[courseId] || { sections: [], quizPassed: false, completed: false }
}

function calculateLearningProgress(distro, courseProgress) {
  const sectionCount = distro.lessons.length * 3
  const quizCount = distro.lessons.length
  const completedSections = distro.lessons.reduce((sum, lesson) => sum + getCourseState(courseProgress, lesson.id).sections.length, 0)
  const passedQuizzes = distro.lessons.filter((lesson) => getCourseState(courseProgress, lesson.id).quizPassed).length
  const done = completedSections + passedQuizzes
  const total = sectionCount + quizCount
  return { done, total, percent: Math.round((done / total) * 100), completedCourses: passedQuizzes }
}

function calculateLearnerStats(distro, courseProgress, completionMap) {
  const completedCourses = distro.lessons.filter((lesson) => getCourseState(courseProgress, lesson.id).completed).length
  const entry = completionMap[distro.id]
  const missions = typeof entry === 'object' && entry ? Object.values(entry).filter(Boolean).length : entry ? 1 : 0
  const xp = completedCourses * 180 + missions * 120
  const level = Math.floor(xp / 500) + 1
  const levelStart = (level - 1) * 500
  const levelProgress = Math.min(100, Math.round(((xp - levelStart) / 500) * 100))
  return { xp, level, levelProgress, missions, completedCourses }
}

function GlobalSearch({ onClose, onNavigate, onSelectDistro, onOpenCommand, onOpenCourse, onSelectCertification }) {
  const [query, setQuery] = useState('')
  const inputRef = useRef(null)
  useEffect(() => inputRef.current?.focus(), [])

  const results = useMemo(() => {
    const pages = navItems.map((item) => ({ type: '页面', title: item.label, description: '打开学习空间', target: item.id, icon: item.icon }))
    const distroItems = Object.values(distroCatalog).map((distro) => ({ type: '发行版', title: distro.name, description: distro.focus, target: 'dashboard', distroId: distro.id, icon: FolderOpen }))
    const courseItems = Object.values(distroCatalog).flatMap((distro) => distro.lessons.map((item) => ({ type: distro.shortName, title: item.title, description: item.description, target: 'courses', distroId: distro.id, courseId: item.id, icon: item.icon })))
    const commandItems = Object.values(distroCatalog).flatMap((distro) => getDistroCommands(distro).map((item) => ({ type: distro.shortName, title: item.command, description: item.summary, target: 'commands', distroId: distro.id, commandQuery: item.command, icon: Command })))
    const certificateItems = Object.values(certifications).map(item => ({ type: '认证', title: item.name, description: item.subtitle, target: 'certifications', certificationId: item.id, icon: Award }))
    const source = [...pages, ...certificateItems, ...distroItems, ...courseItems, ...commandItems]
    const term = query.trim().toLowerCase()
    return (term ? source.filter((item) => `${item.title} ${item.description} ${item.type}`.toLowerCase().includes(term)) : source.slice(0, 7)).slice(0, 9)
  }, [query])

  function openResult(item) {
    if (item.certificationId) { onSelectCertification(item.certificationId); onClose(); return }
    if (item.courseId) { onOpenCourse(item.courseId, item.distroId); onClose(); return }
    if (item.distroId) onSelectDistro(item.distroId)
    if (item.target === 'commands') onOpenCommand(item.commandQuery || '')
    onNavigate(item.target)
    onClose()
  }

  return (
    <Modal title="搜索学习内容" eyebrow="QUICK SEARCH" onClose={onClose} wide>
      <div className="global-search-box"><Search /><input ref={inputRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索课程、命令或页面" /><kbd>ESC</kbd></div>
      <div className="search-results">
        {results.map((item, index) => {
          const Icon = item.icon
          return <button key={`${item.type}-${item.title}-${index}`} onClick={() => openResult(item)}>
            <span className="search-result-icon"><Icon size={18} /></span>
            <span><strong>{item.title}</strong><small>{item.description}</small></span>
            <em>{item.type}</em><ArrowRight size={16} />
          </button>
        })}
        {!results.length && <div className="search-empty"><Search /><strong>没有匹配内容</strong><span>试试“网络”“权限”或“笔记”。</span></div>}
      </div>
      <div className="search-hint"><span>点击结果直接前往</span><span><kbd>Ctrl</kbd> + <kbd>K</kbd> 随时打开</span></div>
    </Modal>
  )
}

function HelpPanel({ onClose, onNavigate }) {
  return (
    <Modal title="学习帮助" eyebrow="START HERE" onClose={onClose}>
      <div className="help-grid">
        <button onClick={() => { onNavigate('distros'); onClose() }}><FolderOpen /><span><strong>选择学习发行版</strong><small>比较 Kali、Parrot、BlackArch 与 Pentoo 的定位和先修要求。</small></span><ArrowRight /></button>
        <button onClick={() => { onNavigate('courses'); onClose() }}><GraduationCap /><span><strong>如何开始学习</strong><small>按顺序完成课程路径，先掌握命令行基础。</small></span><ArrowRight /></button>
        <button onClick={() => { onNavigate('practice'); onClose() }}><Target /><span><strong>如何使用靶场</strong><small>训练响应完全模拟，不会连接真实设备。</small></span><ArrowRight /></button>
        <button onClick={() => { onNavigate('commands'); onClose() }}><Command /><span><strong>查找命令</strong><small>按用途、分类或命令名称快速筛选。</small></span><ArrowRight /></button>
      </div>
      <div className="ethics-note"><ShieldCheck /><div><strong>安全学习原则</strong><p>只在自己的设备、隔离虚拟机或获得明确书面授权的环境中练习。课程示例中的地址均为模拟靶场数据。</p></div></div>
    </Modal>
  )
}

function ProfilePanel({ onClose, studyMinutes, learnerStats, onSignOut, syncStatus }) {
  return (
    <Modal title="Linux 学员" eyebrow="LEARNER PROFILE" onClose={onClose}>
      <div className="profile-summary">
        <div className="profile-avatar-large">L</div>
        <div><strong>Lv. {learnerStats.level} · {learnerStats.level === 1 ? '新学员' : '探索者'}</strong><span>距离下一级还需 {500 - (learnerStats.xp % 500)} XP</span></div>
        <div className="profile-xp">{learnerStats.xp.toLocaleString()} <small>XP</small></div>
      </div>
      <div className="profile-progress"><span style={{ width: `${learnerStats.levelProgress}%` }} /></div>
      <div className="profile-metrics">
        <div><GraduationCap /><strong>{learnerStats.completedCourses} 门</strong><span>课程通过</span></div>
        <div><Clock3 /><strong>{studyMinutes} 分钟</strong><span>已记录学习</span></div>
        <div><Target /><strong>{learnerStats.missions} 项</strong><span>靶场完成</span></div>
      </div>
      <div className="profile-tip"><Sparkles /><span>保持每天完成一个小目标，比一次学习很久更容易形成稳定技能。</span></div>
      <div className="profile-account-actions"><p role="status">{syncStatus.title}。{syncStatus.description}</p><button className="secondary-button" onClick={onSignOut}>退出当前账户</button></div>
    </Modal>
  )
}

function AuthPanel({ onClose, onSignedIn }) {
  const [mode, setMode] = useState('sign-in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [canResend, setCanResend] = useState(false)
  const [resending, setResending] = useState(false)
  const [busy, setBusy] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setBusy(true)
    setMessage('')
    setCanResend(false)
    let result
    try {
      result = mode === 'sign-in'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password })
    } catch (error) {
      setBusy(false)
      return setMessage(error.message || '暂时无法连接账户服务。')
    }
    setBusy(false)
    if (result.error) {
      const unconfirmed = result.error.message.toLowerCase().includes('email not confirmed')
      setCanResend(unconfirmed)
      return setMessage(unconfirmed ? '邮箱还未验证，请先查收验证邮件。' : result.error.message)
    }
    if (mode === 'sign-up' && !result.data.session) return setMessage('注册成功，请先查收邮箱完成验证。')
    onSignedIn(result.data.user)
    onClose()
  }

  async function resendConfirmation() {
    setResending(true)
    const { error } = await supabase.auth.resend({ type: 'signup', email })
    setResending(false)
    setMessage(error ? error.message : '验证邮件已重新发送，请检查收件箱和垃圾邮件。')
  }

  return <Modal title={mode === 'sign-in' ? '登录学习账户' : '创建学习账户'} eyebrow="CLOUD PROGRESS" onClose={onClose}>
    <form className="auth-form" onSubmit={submit}>
      <p>登录后，课程进度、靶场记录和学习时长会跟随你的账户同步。</p>
      <label>邮箱<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required placeholder="you@example.com" /></label>
      <label>密码<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={6} placeholder="至少 6 位密码" /></label>
      {message && <div className="auth-message">{message}</div>}
      {canResend && <button type="button" className="auth-resend" onClick={resendConfirmation} disabled={resending}>{resending ? '发送中…' : '重新发送验证邮件'}</button>}
      <button className="primary-button auth-submit" disabled={busy}>{busy ? '处理中…' : mode === 'sign-in' ? '登录并同步' : '注册账户'}</button>
      <button type="button" className="text-button auth-switch" onClick={() => { setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in'); setMessage('') }}>{mode === 'sign-in' ? '还没有账户？立即注册' : '已有账户？返回登录'}</button>
    </form>
  </Modal>
}

function Sidebar({ active, onChange, mobileOpen, onClose, onHelp, onProfile, distro, onDistroSelect, learnerStats, questionCount }) {
  const [switcherOpen, setSwitcherOpen] = useState(false)
  const [compact, setCompact] = useState(() => window.matchMedia('(max-width: 1050px)').matches)
  useEffect(() => {
    const media = window.matchMedia('(max-width: 1050px)')
    const update = () => setCompact(media.matches)
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])
  return (
    <aside inert={compact && !mobileOpen} aria-hidden={compact && !mobileOpen ? true : undefined} className={`sidebar distro-${distro.theme} ${mobileOpen ? 'is-open' : ''}`}>
      <div className="brand">
        <div className="brand-mark">S</div>
        <div>
          <div className="brand-name">SECURITY <span>PATH</span></div>
          <small>LEARN · PRACTICE · DEFEND</small>
        </div>
        <button className="sidebar-close" onClick={onClose} aria-label="关闭菜单"><X size={20} /></button>
      </div>

      <div className="distro-switcher-wrap">
        <button className="distro-switcher" onClick={() => setSwitcherOpen((value) => !value)} aria-expanded={switcherOpen}>
          <DistroLogo distro={distro} />
          <span><small>当前学习系统</small><strong>{distro.shortName}</strong></span>
          <ChevronRight className={switcherOpen ? 'rotated' : ''} size={16} />
        </button>
        {switcherOpen && <div className="distro-switcher-menu">
          {Object.values(distroCatalog).map((item) => <button className={item.id === distro.id ? 'active' : ''} key={item.id} onClick={() => { onDistroSelect(item.id); setSwitcherOpen(false); onClose() }}>
            <DistroLogo distro={item} /><span><strong>{item.shortName}</strong><small>{item.focus}</small></span>{item.id === distro.id && <Check />}
          </button>)}
        </div>}
      </div>

      <div className="nav-label">学习空间</div>
      <nav className="main-nav">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.id}
              className={active === item.id ? 'active' : ''}
              aria-current={active === item.id ? 'page' : undefined}
              onClick={() => { onChange(item.id); onClose() }}
            >
              <Icon size={19} />
              <span>{item.label}</span>
              {item.id === 'practice' && <span className="nav-badge">{questionCount}</span>}
            </button>
          )
        })}
      </nav>

      <div className="sidebar-spacer" />
      <div className="ethics-card">
        <LockKeyhole size={19} />
        <div>
          <strong>先授权，再动手</strong>
          <p>仅在自有设备或明确授权的靶场中练习。</p>
        </div>
      </div>
      <button className="help-link" onClick={onHelp}><CircleHelp size={18} /> 学习帮助</button>
      <button className="profile-card" onClick={onProfile}>
        <div className="avatar">L</div>
        <div><strong>Linux 学员</strong><span>Lv. {learnerStats.level} · {learnerStats.level === 1 ? '新学员' : '探索者'}</span></div>
        <ChevronRight size={17} />
      </button>
    </aside>
  )
}

function Topbar({ title, onMenu, onSearch, onProfile, distro, learnerStats, user }) {
  return (
    <header className="topbar">
      <button className="menu-button" onClick={onMenu} aria-label="打开菜单"><Menu size={21} /></button>
      <div>
        <div className="eyebrow">{distro.name.toUpperCase()} LEARNING SYSTEM</div>
        <h1>{title}</h1>
      </div>
      <nav className="external-nav" aria-label="站点导航">
        <a href="/tutorial.html" className="external-nav-link" aria-label="返回教程"><BookOpen size={16} /> <span>返回教程</span></a>
        <a href="/" className="external-nav-link" aria-label="返回主页"><Home size={16} /> <span>返回主页</span></a>
      </nav>
      <div className="topbar-actions">
        <button className="icon-button" onClick={onSearch} aria-label="搜索"><Search size={20} /></button>
        <button className="level-pill" onClick={onProfile} aria-label="查看经验值"><Zap size={16} /> {learnerStats.xp.toLocaleString()} XP</button>
        <button className="account-button" onClick={onProfile} aria-label={user ? '查看我的账户' : '登录学习账户'}><UserRound size={17} /><span>{user ? '我的账户' : '登录 / 注册'}</span></button>
      </div>
    </header>
  )
}


function FocusPanel({ goal, onClose, onRecord, distro, lesson = distro.lessons[0] }) {
  const [secondsLeft, setSecondsLeft] = useState(goal * 60)
  const [running, setRunning] = useState(false)
  const [recorded, setRecorded] = useState(false)

  useEffect(() => {
    if (!running || secondsLeft <= 0) return undefined
    const timer = window.setInterval(() => setSecondsLeft((value) => Math.max(0, value - 1)), 1000)
    return () => window.clearInterval(timer)
  }, [running, secondsLeft])

  useEffect(() => {
    if (secondsLeft === 0 && !recorded) {
      setRunning(false)
      setRecorded(true)
      onRecord(goal)
    }
  }, [secondsLeft, recorded, goal, onRecord])

  const elapsed = goal * 60 - secondsLeft
  const progress = Math.round((elapsed / (goal * 60)) * 100)
  const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, '0')
  const seconds = String(secondsLeft % 60).padStart(2, '0')

  function resetTimer() {
    setRunning(false)
    setRecorded(false)
    setSecondsLeft(goal * 60)
  }

  function recordQuickSession() {
    onRecord(5)
    setRecorded(true)
    setRunning(false)
  }

  return (
    <Modal title={`${distro.shortName} 专注学习`} eyebrow="FOCUS SESSION" onClose={onClose}>
      <div className="focus-panel">
        <div className="focus-timer" style={{ '--focus-progress': `${progress * 3.6}deg` }}>
          <div><strong>{minutes}:{seconds}</strong><span>{recorded ? '本次学习已记录' : `目标 ${goal} 分钟`}</span></div>
        </div>
        <div className="focus-topic"><TerminalSquare /><div><strong>本节：{lesson.title}</strong><span>{lesson.description}</span></div></div>
        <div className="focus-checklist">
          <span><CheckCircle2 /> 先阅读命令说明</span>
          <span><TerminalSquare /> 再在配套案例验证操作</span>
          <span><NotebookPen /> 最后写下一条学习笔记</span>
        </div>
        <div className="focus-actions">
          <button className="secondary-button" onClick={resetTimer}><RotateCcw size={16} /> 重置</button>
          <button className="primary-button" onClick={() => setRunning((value) => !value)} disabled={secondsLeft === 0}>
            {running ? <><Pause size={16} fill="currentColor" /> 暂停</> : <><Play size={16} fill="currentColor" /> {elapsed ? '继续' : '开始专注'}</>}
          </button>
        </div>
        <button className="quick-record" onClick={recordQuickSession} disabled={recorded}><Zap size={15} /> {recorded ? '学习记录已更新' : '手动记录一次 5 分钟学习'}</button>
      </div>
    </Modal>
  )
}

function Dashboard({ completed, onNavigate, onOpenCourse, onSelectDistro, onSelectCertification, dailyGoal, setDailyGoal, studyMinutes, setStudyMinutes, distro, courseProgress, learnerStats, syncStatus, onAccount }) {
  const [focusOpen, setFocusOpen] = useState(false)
  const [goalOpen, setGoalOpen] = useState(false)
  const learningProgress = calculateLearningProgress(distro, courseProgress)

  function recordStudy(minutes) {
    setStudyMinutes(value => value + minutes)
  }

  return <>
    <LearningOverview distro={distro} catalog={distroCatalog} courseProgress={courseProgress} learningProgress={learningProgress} completed={completed} learnerStats={learnerStats} studyMinutes={studyMinutes} dailyGoal={dailyGoal} onNavigate={onNavigate} onOpenCourse={onOpenCourse} onSelectDistro={onSelectDistro} onSelectCertification={onSelectCertification} onFocus={() => setFocusOpen(true)} onGoal={() => setGoalOpen(true)} syncStatus={syncStatus} onAccount={onAccount} />
    {focusOpen && <FocusPanel goal={dailyGoal} distro={distro} lesson={recommendedLesson(distro.lessons, courseProgress)} onClose={() => setFocusOpen(false)} onRecord={recordStudy} />}
    {goalOpen && <Modal title="设置学习目标" eyebrow="STUDY GOAL" onClose={() => setGoalOpen(false)}>
      <div className="goal-options"><p>选择一个容易坚持的学习时长。已记录的时长包含专注计时、手动记录和课程完成估算。</p><div>{[10, 20, 30, 45].map(value => <button className={dailyGoal === value ? 'active' : ''} key={value} onClick={() => setDailyGoal(value)}><Timer /><strong>{value}</strong><span>分钟</span>{dailyGoal === value && <Check />}</button>)}</div><button className="primary-button goal-save" onClick={() => setGoalOpen(false)}>保存目标</button></div>
    </Modal>}
  </>
}

function DistroCenter({ currentDistro, onSelectDistro, onNavigate, completionMap }) {
  return (
    <div className="page distro-center-page">
      <section className="page-intro distro-intro">
        <div><span className="section-kicker">SECURITY LINUX COLLECTION</span><h2>选择你的安全 Linux 路径</h2><p>各系统共享 Linux 基础，但在定位、包管理和日常工作流上各有侧重。</p></div>
        <div className="collection-count"><strong>{Object.keys(distroCatalog).length}</strong><span>套学习路径</span></div>
      </section>
      <div className="distro-cards">
        {Object.values(distroCatalog).map((distro) => {
          const isCurrent = distro.id === currentDistro.id
          const missionDone = hasAnyMissionCompletion(completionMap, distro.id)
          return <article className={`distro-card ${distro.theme} ${isCurrent ? 'current' : ''}`} key={distro.id}>
            <div className="distro-card-head"><DistroLogo distro={distro} className="distro-logo" /><div>{isCurrent && <em>当前路径</em>}<h3>{distro.name}</h3><p>{distro.focus}</p></div></div>
            <div className="distro-facts"><span><small>系统基础</small><strong>{distro.base}</strong></span><span><small>包管理</small><strong>{distro.packageManager}</strong></span></div>
            <p className="distro-audience">{distro.audience}</p>
            <div className="distro-course-preview">{distro.lessons.slice(0, 3).map((lesson) => <span key={lesson.id}><CheckCircle2 /> {lesson.title}</span>)}</div>
            <div className="distro-card-footer"><span className={missionDone ? 'complete' : ''}>{missionDone ? <><Check /> 已完成挑战</> : <><Target /> 挑战待完成</>}</span><button onClick={() => { onSelectDistro(distro.id); onNavigate('dashboard') }}>{isCurrent ? '返回总览' : '选择此路径'} <ArrowRight /></button></div>
          </article>
        })}
      </div>
      <section className="compare-panel">
        <div><span className="section-kicker">HOW TO CHOOSE</span><h3>不知道从哪一套开始？</h3></div>
        <div className="compare-points">{Object.values(distroCatalog).map(distro => <span key={distro.id}><strong>{distro.shortName}</strong> {distro.focus}</span>)}</div>
      </section>
    </div>
  )
}

export function CourseWorkspace({ distro, lesson, courseState, onUpdate, onClose, onPractice, initialView = 'lesson', initialCaseId, canStudy = true }) {
  const sections = getCourseSections(distro, lesson)
  const [view, setView] = useState(canStudy ? initialView : 'case')
  const courseCases = getCoursePracticeCases(distro.id, lesson.id)
  const [caseId, setCaseId] = useState(initialCaseId)
  const practice = getPracticeCase(distro.id, lesson.id, caseId) || courseCases[0]
  const firstIncomplete = sections.findIndex((section) => !courseState.sections.includes(section.id))
  const [step, setStep] = useState(firstIncomplete === -1 ? (courseState.quizPassed ? sections.length + 1 : sections.length) : firstIncomplete)
  const [answer, setAnswer] = useState(null)
  const [feedback, setFeedback] = useState(null)
  const [readingSize, setReadingSize] = useState(() => readSaved('security-path-reading-size', 'standard'))
  const [shareStatus, setShareStatus] = useState('')
  const readerRef = useRef(null)
  const guide = courseGuides[distro.id][lesson.id]
  const detail = courseDetails[distro.id][lesson.id]
  const completedCount = courseState.sections.length + (courseState.quizPassed ? 1 : 0)
  const progress = Math.round((completedCount / (sections.length + 1)) * 100)
  const isQuiz = step === sections.length
  const isComplete = step > sections.length
  const currentSection = sections[step]

  useEffect(() => {
    readerRef.current?.scrollTo({ top: 0 })
  }, [step, view, caseId, courseState.completed])

  function openCase(practiceId) {
    setCaseId(practiceId)
    setView('case')
  }

  function changeReadingSize(size) {
    setReadingSize(size)
    try { localStorage.setItem('security-path-reading-size', JSON.stringify(size)) } catch { /* Reading stays available without browser storage. */ }
  }

  async function shareCourse() {
    const route = { page: 'courses', distroId: distro.id, courseId: lesson.id, caseId: view === 'case' ? practice.id : null }
    const link = new URL(learningRouteUrl(route, window.location.href), window.location.origin).href
    try { await navigator.clipboard.writeText(link); setShareStatus('课程链接已复制，打开后可直接进入本课。') }
    catch { setShareStatus('浏览器未允许复制，可以直接复制地址栏的课程链接。') }
  }

  function updateCourse(patch) {
    if (!canStudy) return
    onUpdate(lesson.id, { ...courseState, ...patch })
  }

  function completeCurrentAndContinue() {
    if (!currentSection) return
    const nextSections = courseState.sections.includes(currentSection.id) ? courseState.sections : [...courseState.sections, currentSection.id]
    updateCourse({ sections: nextSections })
    setStep((value) => value + 1)
  }

  function submitQuiz() {
    if (answer === null) return
    if (answer === guide.quiz.answer) {
      setFeedback('correct')
      updateCourse({ quizPassed: true, completed: true })
    } else {
      setFeedback('incorrect')
    }
  }

  function openStep(index) {
    if (!canStudy) return
    const canOpen = index === 0 || index <= courseState.sections.length || courseState.completed
    if (canOpen) {
      setView('lesson')
      setStep(index)
      setFeedback(null)
      setAnswer(null)
    }
  }

  return (
    <Modal title={lesson.title} eyebrow={`${distro.shortName.toUpperCase()} COURSE ${String(lesson.id).padStart(2, '0')}`} onClose={onClose} className="course-workspace-modal">
      <div className="course-workspace">
        <aside className="course-sidebar">
          <div className="course-progress-summary"><div><strong>{progress}%</strong><span>课程进度</span></div><i><b style={{ width: `${progress}%` }} /></i></div>
          <div className="chapter-nav">
            {sections.map((section, index) => {
              const Icon = section.icon
              const done = courseState.sections.includes(section.id)
              const available = canStudy && (index === 0 || index <= courseState.sections.length || courseState.completed)
              return <button key={section.id} className={view === 'lesson' && step === index ? 'active' : ''} disabled={!available} onClick={() => openStep(index)}>
                <span className={done ? 'done' : ''}>{done ? <Check /> : <Icon />}</span><span><strong>{section.title}</strong><small>{section.duration}</small></span>
              </button>
            })}
            <button className={view === 'lesson' && (isQuiz || isComplete) ? 'active' : ''} disabled={!canStudy || courseState.sections.length < sections.length} onClick={() => openStep(sections.length)}>
              <span className={courseState.quizPassed ? 'done' : ''}>{courseState.quizPassed ? <Check /> : <Trophy />}</span><span><strong>结课测验</strong><small>约 2 分钟</small></span>
            </button>
            {courseCases.map(item => <button key={item.id} aria-label={'切换实战：' + item.title} className={'case-chapter-link ' + (view === 'case' && practice.id === item.id ? 'active' : '')} onClick={() => openCase(item.id)}>
              <span><Target /></span><span><strong>{item.title}</strong><small>{item.level === 'advanced' ? '高级实战' : '基础实战'} · {item.steps.length} 步 · 可预览</small></span>
            </button>)}
          </div>
          <div className="course-sidebar-note"><ShieldCheck /><span>命令示例仅在自有设备或授权实验环境中练习。</span></div>
        </aside>

        <div className={`course-reader ${readingSize === 'large' ? 'reader-large' : ''}`} ref={readerRef}>
          <div className="reader-utilities"><button onClick={shareCourse}><ExternalLink size={14} />复制课程链接</button><div className="reader-font-buttons" role="group" aria-label="课程阅读字号"><button aria-pressed={readingSize === 'standard'} onClick={() => changeReadingSize('standard')}>标准字号</button><button aria-pressed={readingSize === 'large'} onClick={() => changeReadingSize('large')}>大字阅读</button></div></div>
          {shareStatus && <p className="reader-share-status" role="status">{shareStatus}</p>}
          {view === 'case' && <PracticeCase key={practice.id} practice={practice} distro={distro} canStudy={canStudy} onReadLesson={canStudy ? () => setView('lesson') : onClose} />}
          {view === 'lesson' && currentSection && !isQuiz && !isComplete && <>
            <div className="reader-meta"><span>章节 {step + 1} / {sections.length}</span><span><Clock3 /> {currentSection.duration}</span></div>
            <h2>{currentSection.title}</h2>
            <div className="case-related-courses" aria-label="本课配套实战">
              <p>本课配套 {courseCases.length} 个实战案例，基础与高级分析均可预览：</p>
              {courseCases.map(item => <button key={item.id} className="case-course-entry" onClick={() => openCase(item.id)}><Target />{item.title}<ArrowRight /></button>)}
            </div>
            <CourseChapter key={`${distro.id}-${lesson.id}-${currentSection.id}`} section={currentSection} resources={detail.resources} reviewedAt={detail.reviewedAt} distro={distro} mission={lesson.id === distro.mission.requiredCourseId ? distro.mission : null} />
            <div className="reader-actions">
              <button className="secondary-button" disabled={step === 0} onClick={() => setStep((value) => value - 1)}><ArrowLeft /> 上一节</button>
              <button className="primary-button" onClick={completeCurrentAndContinue}>{courseState.sections.includes(currentSection.id) ? '下一节' : '完成并继续'} <ArrowRight /></button>
            </div>
          </>}

          {view === 'lesson' && isQuiz && !courseState.completed && <div className="course-quiz">
            <div className="quiz-icon"><CircleHelp /></div>
            <span className="section-kicker">FINAL CHECK</span>
            <h2>结课知识检查</h2>
            <p>{guide.quiz.question}</p>
            <div className="quiz-options">{guide.quiz.options.map((option, index) => <button className={answer === index ? 'selected' : ''} key={option} onClick={() => { setAnswer(index); setFeedback(null) }}><span>{String.fromCharCode(65 + index)}</span>{option}{answer === index && <Check />}</button>)}</div>
            {feedback && <div className={`quiz-feedback ${feedback}`}><strong>{feedback === 'correct' ? '回答正确' : '再想一想'}</strong><span>{guide.quiz.explanation}</span></div>}
            <div className="reader-actions"><button className="secondary-button" onClick={() => setStep(sections.length - 1)}><ArrowLeft /> 回看章节</button><button className="primary-button" disabled={answer === null} onClick={submitQuiz}>提交答案 <ArrowRight /></button></div>
          </div>}

          {view === 'lesson' && (isComplete || (isQuiz && courseState.completed)) && <div className="course-complete-view">
            <div className="completion-emblem"><Trophy /></div><span className="section-kicker">COURSE COMPLETE</span><h2>课程完成</h2><p>你已完成“{lesson.title}”的全部核心章节和知识检查。</p>
            <div className="completion-stats"><span><CheckCircle2 /><strong>3</strong><small>章节完成</small></span><span><Trophy /><strong>100%</strong><small>测验通过</small></span><span><Zap /><strong>+180</strong><small>课程 XP</small></span></div>
            <div className="completion-actions"><button className="secondary-button" onClick={() => setStep(0)}>重新阅读</button>{lesson.id === 3 ? <button className="primary-button" onClick={() => { onClose(); onPractice() }}>进入配套靶场 <Target /></button> : <button className="primary-button" onClick={onClose}>返回课程路径 <ArrowRight /></button>}</div>
            <CourseReview sections={sections} quiz={guide.quiz} onOpen={openStep} />
            <button className="case-course-entry" onClick={() => setView('case')}><Target />继续学习本课实战案例 <ArrowRight /></button>
          </div>}
        </div>
      </div>
    </Modal>
  )
}

export function Courses({ completed, onPractice, distro, courseProgress, onCourseUpdate, courseRequest, onCourseRequest }) {
  const [localRequest, setLocalRequest] = useState(null)
  const [filter, setFilter] = useState('all')
  const request = courseRequest === undefined ? localRequest : courseRequest
  const selectedCourse = distro.lessons.find(lesson => lesson.id === request?.courseId) || null
  const selectedCaseId = request?.caseId || null
  const courseView = selectedCaseId ? 'case' : 'lesson'
  const nextLesson = recommendedLesson(distro.lessons, courseProgress)
  const learningProgress = calculateLearningProgress(distro, courseProgress)
  const selectedIndex = selectedCourse ? distro.lessons.findIndex(lesson => lesson.id === selectedCourse.id) : -1
  const canStudy = selectedIndex <= 0 || getCourseState(courseProgress, distro.lessons[selectedIndex - 1].id).completed

  function openCourse(lesson, view = 'lesson', caseId = null) {
    const nextRequest = lesson ? { courseId: lesson.id, caseId: view === 'case' ? caseId : null } : null
    if (onCourseRequest) onCourseRequest(nextRequest)
    else setLocalRequest(nextRequest)
  }
  const visibleLessons = distro.lessons.filter((lesson, index) => {
    const state = getCourseState(courseProgress, lesson.id)
    const unlocked = index === 0 || getCourseState(courseProgress, distro.lessons[index - 1].id).completed
    if (filter === 'completed') return state.completed
    if (filter === 'active') return unlocked && !state.completed
    return true
  })
  return (
    <div className="page">
      <section className="page-intro">
        <div><span className="section-kicker">{distro.shortName.toUpperCase()} LEARNING PATH</span><h2>{distro.name} 学习路径</h2><p>{distro.audience}。从系统基础开始，在隔离环境中逐步建立能力。</p></div>
        <div className="path-score"><BarChart3/><div><strong>{learningProgress.percent}%</strong><span>{learningProgress.completedCourses} / {distro.lessons.length} 门课程</span></div></div>
      </section>
      <section className="course-resume-strip" aria-label="推荐继续的课程"><Play size={22} /><div><strong>{learningProgress.completedCourses === distro.lessons.length ? '回顾第一课，巩固基础' : `下一课：${nextLesson.title}`}</strong><p>先完成下面的核心课程，再从页面下方选择配套实战。每个案例都有详细思路和逐步演练。</p></div><button className="primary-button" onClick={() => openCourse(nextLesson)}>{learningProgress.completedCourses === distro.lessons.length ? '复习课程' : '开始 / 继续学习'}<ArrowRight size={16} /></button></section>
      <section className="course-toolbar">
        <div><span className="section-kicker">YOUR CURRICULUM</span><h3>课程进度</h3><p>每门课程包含 3 个核心章节和 1 次结课测验。</p></div>
        <div className="course-filter"><button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>全部</button><button className={filter === 'active' ? 'active' : ''} onClick={() => setFilter('active')}>可学习</button><button className={filter === 'completed' ? 'active' : ''} onClick={() => setFilter('completed')}>已完成</button></div>
      </section>
      <div className="path-line">
        {visibleLessons.map((lesson) => {
          const index = distro.lessons.findIndex((item) => item.id === lesson.id)
          const Icon = lesson.icon
          const state = getCourseState(courseProgress, lesson.id)
          const locked = index > 0 && !getCourseState(courseProgress, distro.lessons[index - 1].id).completed
          const sectionProgress = Math.round(((state.sections.length + (state.quizPassed ? 1 : 0)) / 4) * 100)
          return (
            <article className={`course-card ${locked ? 'is-locked' : ''}`} key={lesson.id}>
              <div className="course-number">0{lesson.id}</div>
              <div className={`course-icon ${lesson.color}`}><Icon/></div>
              {lesson.id === distro.mission.requiredCourseId && <div className="linked-lab-badge"><Target /> 关联靶场</div>}
              <div className="course-status">{state.completed ? <><CheckCircle2/> 已完成</> : state.sections.length ? <><Play/> 学习中</> : locked ? <><LockKeyhole/> 完成前置课程后解锁</> : <><Sparkles/> 可以开始</>}</div>
              <h3>{lesson.title}</h3>
              <p>{lesson.description}</p>
              <div className="course-meta"><span><BookOpen/> 3 个核心章节</span><span><Clock3/> {lesson.duration}</span></div>
              <div className="course-card-progress"><span><b style={{ width: `${sectionProgress}%` }} /></span><small>{sectionProgress}%</small></div>
              <button disabled={locked} onClick={() => openCourse(lesson)}>{state.completed ? '复习课程' : state.sections.length ? '继续学习' : locked ? '尚未解锁' : '开始课程'} <ArrowRight/></button>
            </article>
          )
        })}
      </div>
      {!visibleLessons.length && <div className="course-empty"><BookOpen /><h3>这里暂时没有课程</h3><p>调整上方筛选条件查看其他课程。</p></div>}
      <PracticeCaseList distro={distro} onOpen={practice => openCourse(distro.lessons.find(lesson => lesson.id === practice.courseId), 'case', practice.id)} />
      {selectedCourse && <CourseWorkspace key={distro.id + '-' + selectedCourse.id + '-' + courseView + '-' + (selectedCaseId || '')} distro={distro} lesson={selectedCourse} courseState={getCourseState(courseProgress, selectedCourse.id)} onUpdate={onCourseUpdate} onClose={() => openCourse(null)} onPractice={onPractice} initialView={courseView} initialCaseId={selectedCaseId} canStudy={canStudy} />}
    </div>
  )
}

function QuestionUpdateCard({ distro, status, onRefresh, questionCount }) {
  const checking = status?.state === 'checking'
  const stateText = {
    checking: '正在检查',
    updated: '已自动更新',
    cached: '使用缓存题库',
    fallback: '使用内置题库',
    idle: '等待检查',
  }[status?.state || 'idle']

  return (
    <section className={`question-update-card ${status?.state || 'idle'}`}>
      <button className="update-pulse" onClick={onRefresh} disabled={checking} aria-label="刷新题库"><RotateCcw /></button>
      <div className="update-copy">
        <span className="section-kicker">AUTO QUESTION UPDATE</span>
        <h3>{distro.mission.fromFeed ? '当前为最新题库题目' : '当前为内置题目'}</h3>
        <p>{status?.message || '应用会在启动时自动检查题库更新，只有课程已覆盖的题目才会生效。'}</p>
        <div className="update-meta">
          <span>可用题目：{questionCount || 0} 道</span>
          <span>状态：{stateText}</span>
          <span>版本：{distro.mission.feedVersion || status?.version || '内置'}</span>
          <span>更新时间：{distro.mission.updatedAt || status?.lastChecked || '未检查'}</span>
        </div>
      </div>
      <button onClick={onRefresh} disabled={checking}>{checking ? '检查中' : '检查更新'} <RotateCcw /></button>
    </section>
  )
}

function Practice({ completed, setCompleted, distro, courseProgress, onNavigate, updateStatus, onRefreshQuestions, availableQuestions, onSelectQuestion }) {
  const mission = distro.mission
  const requiredCourse = distro.lessons.find((lesson) => lesson.id === mission.requiredCourseId)
  const prerequisiteComplete = getCourseState(courseProgress, mission.requiredCourseId).completed
  return (
    <div className="page">
      <section className="page-intro compact">
        <div><span className="section-kicker">{distro.shortName.toUpperCase()} SAFE SANDBOX</span><h2>{distro.shortName} 靶场练习</h2><p>所有响应均为浏览器内模拟数据，不连接真实目标。</p></div>
        <div className="sandbox-badge"><span/> 环境运行中</div>
      </section>
      <QuestionUpdateCard distro={distro} status={updateStatus} onRefresh={onRefreshQuestions} questionCount={availableQuestions.length} />
      {availableQuestions.length > 1 && <div className="question-picker"><strong>选择练习题</strong><div>{availableQuestions.map((question, index) => <button className={question.uid === distro.mission.uid ? 'active' : ''} key={question.uid} onClick={() => onSelectQuestion(index)}><span>题目 {question.id}</span><strong>{question.title}</strong><small>{question.difficulty}</small></button>)}</div></div>}
      {!prerequisiteComplete ? <section className="practice-prerequisite">
        <div className="prerequisite-icon"><LockKeyhole /></div>
        <span className="section-kicker">COURSE PREREQUISITE</span>
        <h3>先完成“{requiredCourse.title}”</h3>
        <p>这道靶场题只考查课程中已经讲解的内容。完成对应课程与结课测验后，模拟终端会自动解锁。</p>
        <div className="prerequisite-knowledge">
          <strong>靶场所需知识</strong>
          {mission.knowledge.map((item) => <span key={item}><CheckCircle2 /> {item}</span>)}
        </div>
        <button className="primary-button" onClick={() => onNavigate('courses')}>前往课程路径 <ArrowRight /></button>
      </section> : <>
      <div className="practice-layout">
        <div className="mission-panel">
          <div className="mission-panel-head"><div><span>MISSION {mission.id}</span><h3>{mission.title}</h3></div><div className="difficulty">{mission.difficulty || '初级'}</div></div>
          <p>{mission.description}</p>
          <div className="mission-course-link"><BookOpen /><div><span>题目来源</span><strong>课程 {String(requiredCourse.id).padStart(2, '0')} · {requiredCourse.title}</strong></div></div>
          <div className="knowledge-tags">{mission.knowledge.map((item) => <span key={item}>{item}</span>)}</div>
          {mission.sourceLinks?.length > 0 && <div className="question-source-links">{mission.sourceLinks.map((item) => <a key={item.url} href={item.url} target="_blank" rel="noreferrer">{item.title}<ExternalLink /></a>)}</div>}
          <div className="objective-list">
            <div className="done"><Check/> {mission.objectives[0]}</div>
            <div className={completed ? 'done' : ''}>{completed ? <Check/> : <span>2</span>} {mission.objectives[1]}</div>
            <div className={completed ? 'done' : ''}>{completed ? <Check/> : <span>3</span>} {mission.objectives[2]}</div>
          </div>
          <div className="hint-box"><Sparkles/><div><strong>提示</strong><span>{mission.hint}</span></div></div>
          <div className="target-box"><span>训练目标</span><strong>{mission.target}</strong><small>仅存在于当前模拟器中</small></div>
        </div>
        <TerminalLab key={`${distro.id}-${mission.uid || mission.id}`} distro={distro} onMissionComplete={() => setCompleted(true)} />
      </div>
      {completed && <div className="success-banner"><div><Trophy/><span><strong>挑战完成 · +120 XP</strong>{mission.success}</span></div><button onClick={() => setCompleted(false)}>重新练习</button></div>}
      </>}
    </div>
  )
}

function NotesPage({ distro }) {
  const storageKey = `security-path-notes-v2-${distro.id}`
  const [notes, setNotes] = useState(() => readSaved(storageKey, [{ id: 'note-1', title: '新建学习笔记', content: '', updatedAt: Date.now() }]))
  const [activeNoteId, setActiveNoteId] = useState(() => notes[0]?.id || 'note-1')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [saveError, setSaveError] = useState(false)
  const noteItemsRef = useRef(null)
  const activeNote = notes.find((note) => note.id === activeNoteId) || notes[0]
  useEffect(() => { setSaveError(!writeSaved(storageKey, notes)) }, [storageKey, notes])

  function createNote() {
    const note = { id: `note-${Date.now()}`, title: '新建学习笔记', content: '', updatedAt: Date.now() }
    setNotes((current) => [note, ...current])
    setActiveNoteId(note.id)
    noteItemsRef.current?.scrollTo({ top: 0, left: 0 })
  }

  function updateActiveNote(content) {
    setNotes((current) => current.map((note) => note.id === activeNote.id ? { ...note, content, updatedAt: Date.now() } : note))
  }

  function updateActiveNoteTitle(title) {
    setNotes((current) => current.map((note) => note.id === activeNote.id ? { ...note, title, updatedAt: Date.now() } : note))
  }

  function deleteNote() {
    if (!deleteTarget) return
    if (notes.length === 1) {
      const note = { id: deleteTarget.id, title: '', content: '', updatedAt: Date.now() }
      setNotes([note])
      setActiveNoteId(note.id)
    } else {
      const remaining = notes.filter((note) => note.id !== deleteTarget.id)
      setNotes(remaining)
      if (deleteTarget.id === activeNoteId) setActiveNoteId(remaining[0].id)
    }
    setDeleteTarget(null)
  }

  return (
    <div className="page notes-page">
      <section className="page-intro compact">
        <div><span className="section-kicker">{distro.shortName.toUpperCase()} LEARNING NOTES</span><h2>{distro.shortName} 学习笔记</h2><p>记录命令、思路和每次练习后的复盘。</p></div>
        <div className="save-state" role="status"><CheckCircle2/> {saveError ? '本机保存受限' : '已自动保存'}</div>
      </section>
      <div className="notes-layout">
        <div className="notes-list">
          <button className="new-note" onClick={createNote}><NotebookPen/> 新建笔记</button>
          <p className="notes-list-hint">共 {notes.length} 篇笔记 · 上下滑动列表选择笔记</p>
          <div ref={noteItemsRef} className="note-items" role="group" aria-label="选择学习笔记">{notes.map((note) => <div className={`note-item-wrap ${note.id === activeNote.id ? 'active' : ''}`} key={note.id}><button className="note-item" onClick={() => setActiveNoteId(note.id)} aria-pressed={note.id === activeNote.id}><span>{new Date(note.updatedAt).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}</span><strong>{note.title.trim() || '未命名笔记'}</strong><small>{note.content ? '已编辑' : '空白笔记'}</small></button><button className="delete-note" onClick={(event) => { event.stopPropagation(); setDeleteTarget(note) }} aria-label={`删除${note.title.trim() || '未命名笔记'}`} title="删除笔记"><X size={18} /></button></div>)}</div>
        </div>
        <div className="editor-wrap">
          <div className="editor-toolbar"><input className="note-title-input" value={activeNote.title} onChange={(event) => updateActiveNoteTitle(event.target.value)} placeholder="输入笔记名称" aria-label="笔记名称" /><span>{saveError ? '保存失败，请复制备份' : 'MARKDOWN · 自动保存'}</span></div>
          <textarea value={activeNote.content} onChange={(event) => updateActiveNote(event.target.value)} spellCheck="false" aria-label="学习笔记" placeholder={`从这里开始记录你的 ${distro.shortName} 学习内容...`} />
        </div>
      </div>
      {deleteTarget && <Modal title="确认删除笔记" eyebrow="DELETE NOTE" onClose={() => setDeleteTarget(null)}><div className="confirm-dialog"><p>确定要删除“{deleteTarget.title.trim() || '未命名笔记'}”吗？删除后内容将无法恢复。</p><div className="modal-actions"><button className="secondary-button" onClick={() => setDeleteTarget(null)}>取消</button><button className="danger-button" onClick={deleteNote}>确认删除</button></div></div></Modal>}
    </div>
  )
}

function App() {
  const [route, setRoute] = useState(() => readLearningRoute(window.location.search, readSaved('security-path-distro', 'kali')))
  const active = route.page
  const selectedDistro = route.distroId
  const [commandQuery, setCommandQuery] = useState({ value: '', request: 0 })
  const [mobileOpen, setMobileOpen] = useState(false)
  const [panel, setPanel] = useState(null)
  const [completionMap, setCompletionMap] = useState(() => readSaved('security-path-missions', { kali: readSaved('kali-path-mission-01', false) }))
  const [courseProgressMap, setCourseProgressMap] = useState(() => readSaved('security-path-course-progress', {}))
  const [challengeFeed, setChallengeFeed] = useState(() => normalizeChallengeFeed(readSaved(CHALLENGE_FEED_STORAGE_KEY, null)))
  const [challengeIndexMap, setChallengeIndexMap] = useState(() => readSaved('security-path-challenge-index', {}))
  const [challengeStatus, setChallengeStatus] = useState(() => readSaved(CHALLENGE_FEED_STATUS_KEY, { state: 'idle', message: '等待自动检查题库更新。', lastChecked: '', version: '' }))
  const [dailyGoal, setDailyGoal] = useState(() => readSaved('kali-path-daily-goal', 20))
  const [studyMinutes, setStudyMinutes] = useState(() => readSaved('security-path-study-minutes-v2', 0))
  const [user, setUser] = useState(null)
  const [progressLoaded, setProgressLoaded] = useState(false)
  const [syncState, setSyncState] = useState('guest')
  const [localSaveFailed, setLocalSaveFailed] = useState(false)
  const [syncRetry, setSyncRetry] = useState(0)
  const [saveRetry, setSaveRetry] = useState(0)
  const saveQueueRef = useRef(Promise.resolve())
  const accountOwnerRef = useRef(null)
  const loadedAccountRef = useRef(null)
  const restoringGuestRef = useRef(false)
  const guestProgressRef = useRef({ selected_distro: selectedDistro, completion_map: completionMap, course_progress_map: courseProgressMap, study_minutes: studyMinutes, daily_goal: dailyGoal })
  const syncStatuses = {
    guest: { title: '课程进度保存在当前浏览器', description: '登录后可同步课程、靶场和学习时长；笔记仅保存在本机。' },
    loading: { title: '正在读取云端进度', description: '稍等片刻，加载完成后会显示账户记录。' },
    saving: { title: '正在同步学习记录', description: '本机记录已保存，云端同步中。' },
    saved: { title: '学习进度已同步', description: '课程、靶场和学习时长跟随账户；笔记仍保存在本机。' },
    error: { title: '云端暂时无法同步', description: '当前记录仍在本机，连接恢复后可点击上方“重试同步”。' },
  }
  const syncStatus = localSaveFailed ? { state: 'error', title: '当前浏览器不允许本机保存', description: '请保持页面开启并备份学习记录；登录后可尝试同步课程。' } : { state: syncState, ...syncStatuses[syncState] }
  const routeInitialized = useRef(false)
  const challengeFeedRef = useRef(challengeFeed)
  const baseDistro = distroCatalog[selectedDistro] || distroCatalog.kali
  const availableQuestions = useMemo(() => getAvailableFeedQuestions(challengeFeed, baseDistro.id), [baseDistro.id, challengeFeed])
  const selectedQuestionIndex = challengeIndexMap[baseDistro.id] || 0
  const distro = useMemo(() => applyChallengeFeedToDistro(baseDistro, challengeFeed, selectedQuestionIndex), [baseDistro, challengeFeed, selectedQuestionIndex])
  const missionKey = getMissionKey(distro.mission)
  const completed = isMissionCompleted(completionMap, distro.id, missionKey)
  const courseProgress = courseProgressMap[distro.id] || {}
  const learnerStats = calculateLearnerStats(distro, courseProgress, completionMap)

  function setActive(page) { setRoute(current => ({ ...current, page, courseId: null, caseId: null })) }
  function setSelectedDistro(distroId) { setRoute(current => ({ ...current, distroId: distroCatalog[distroId] ? distroId : 'kali', courseId: null, caseId: null })) }
  function openCourse(courseId, distroId = selectedDistro, caseId = null) { setRoute({ page: 'courses', distroId, courseId, caseId }) }
  function selectCertification(certificationId) { setRoute(current => ({ ...current, page: 'certifications', certificationId, courseId: null, caseId: null })) }

  useEffect(() => {
    const nextUrl = learningRouteUrl(route, window.location.href)
    const currentUrl = window.location.pathname + window.location.search
    if (nextUrl !== currentUrl) window.history[routeInitialized.current ? 'pushState' : 'replaceState'](null, '', nextUrl)
    routeInitialized.current = true
    document.title = `${navItems.find(item => item.id === active)?.label || '学习总览'} · ${distro.name} | Security Path`
  }, [route, active, distro.name])

  useEffect(() => {
    function restoreRoute() { setRoute(readLearningRoute(window.location.search, readSaved('security-path-distro', 'kali'))) }
    window.addEventListener('popstate', restoreRoute)
    return () => window.removeEventListener('popstate', restoreRoute)
  }, [])

  useEffect(() => {
    if (!supabase) { setProgressLoaded(true); return undefined }
    let active = true
    supabase.auth.getSession().then(({ data }) => { if (active) setUser(data.session?.user || null) }).catch(() => { if (active) setUser(null) })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user || null))
    return () => { active = false; listener.subscription.unsubscribe() }
  }, [])

  useEffect(() => {
    function applyProgress(record, restoreDistro = false) {
      if (restoreDistro) setSelectedDistro(record.selected_distro || 'kali')
      setCompletionMap(record.completion_map || {})
      setCourseProgressMap(record.course_progress_map || {})
      setStudyMinutes(record.study_minutes || 0)
      setDailyGoal(record.daily_goal || 20)
    }
    if (!user) {
      loadedAccountRef.current = null
      if (accountOwnerRef.current) {
        restoringGuestRef.current = true
        accountOwnerRef.current = null
        applyProgress(guestProgressRef.current, true)
      }
      setProgressLoaded(true); setSyncState('guest'); return undefined
    }
    accountOwnerRef.current = user.id
    loadedAccountRef.current = null
    let active = true
    setProgressLoaded(false)
    setSyncState('loading')
    loadLearningProgress(user.id).then((remote) => {
      if (!active) return
      applyProgress(remote || readSaved(`security-path-account-cache-${user.id}`, {}) || {})
      loadedAccountRef.current = user.id
      setProgressLoaded(true)
      setSyncState('saved')
    }).catch(() => {
      if (!active) return
      applyProgress(readSaved(`security-path-account-cache-${user.id}`, {}) || {})
      loadedAccountRef.current = user.id
      setSyncState('error'); setProgressLoaded(false)
    })
    return () => { active = false }
  }, [user?.id, syncRetry])

  useEffect(() => {
    if (!user || !progressLoaded || loadedAccountRef.current !== user.id) return
    let current = true
    setSyncState('saving')
    const timer = window.setTimeout(() => {
      saveQueueRef.current = saveQueueRef.current.catch(() => {}).then(() => saveLearningProgress(user.id, { selected_distro: selectedDistro, completion_map: completionMap, course_progress_map: courseProgressMap, study_minutes: studyMinutes, daily_goal: dailyGoal }))
      saveQueueRef.current
        .then(() => { if (current) setSyncState('saved') })
        .catch(() => { if (current) setSyncState('error') })
    }, 600)
    return () => { current = false; window.clearTimeout(timer) }
  }, [user?.id, progressLoaded, selectedDistro, completionMap, courseProgressMap, studyMinutes, dailyGoal, saveRetry])

  function setCompleted(value) {
    setCompletionMap((current) => {
      const previous = isMissionCompleted(current, distro.id, missionKey)
      const nextValue = typeof value === 'function' ? value(previous) : value
      return setMissionCompleted(current, distro.id, missionKey, nextValue)
    })
  }

  function selectChallenge(index) {
    setChallengeIndexMap((current) => ({ ...current, [baseDistro.id]: index }))
  }

  async function refreshChallengeFeed(manual = false) {
    const source = getChallengeFeedUrl()
    const checkedAt = new Date().toISOString().slice(0, 10)
    setChallengeStatus((current) => ({ ...current, state: 'checking', message: manual ? '正在手动检查最新题库。' : '正在自动检查最新题库。', source }))
    try {
      const url = new URL(source, window.location.origin)
      url.searchParams.set('_', String(Date.now()))
      const response = await fetch(url.toString(), { cache: 'no-store' })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const nextFeed = normalizeChallengeFeed(await response.json())
      if (!nextFeed) throw new Error('Invalid challenge feed')
      setChallengeFeed(nextFeed)
      setChallengeStatus({ state: 'updated', message: `已加载 ${nextFeed.title}，不匹配课程内容的题目会被自动忽略。`, source, lastChecked: checkedAt, version: nextFeed.version })
    } catch (error) {
      const hasCache = Boolean(challengeFeedRef.current)
      setChallengeStatus({ state: hasCache ? 'cached' : 'fallback', message: hasCache ? '更新源暂时不可用，正在使用上次缓存题库。' : '更新源暂时不可用，正在使用内置题目。', source, lastChecked: checkedAt, version: challengeFeedRef.current?.version || '' })
    }
  }

  useEffect(() => { challengeFeedRef.current = challengeFeed }, [challengeFeed])
  useEffect(() => {
    if (restoringGuestRef.current) { restoringGuestRef.current = false; return }
    if (user && loadedAccountRef.current !== user.id) return
    if (user && !progressLoaded && syncState !== 'error') return
    const record = { selected_distro: selectedDistro, completion_map: completionMap, course_progress_map: courseProgressMap, study_minutes: studyMinutes, daily_goal: dailyGoal }
    const entries = [['security-path-challenge-index', challengeIndexMap], [CHALLENGE_FEED_STATUS_KEY, challengeStatus]]
    if (user) entries.push([`security-path-account-cache-${user.id}`, record])
    else {
      guestProgressRef.current = record
      entries.push(['security-path-distro', selectedDistro], ['security-path-missions', completionMap], ['security-path-course-progress', courseProgressMap], ['kali-path-daily-goal', dailyGoal], ['security-path-study-minutes-v2', studyMinutes])
    }
    if (challengeFeed) entries.push([CHALLENGE_FEED_STORAGE_KEY, challengeFeed])
    const results = entries.map(([key, value]) => writeSaved(key, value))
    setLocalSaveFailed(results.some(saved => !saved))
  }, [selectedDistro, completionMap, challengeIndexMap, courseProgressMap, challengeStatus, dailyGoal, studyMinutes, challengeFeed, user?.id, progressLoaded, syncState])
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }) }, [active])
  useEffect(() => {
    refreshChallengeFeed(false)
    const timer = window.setInterval(() => refreshChallengeFeed(false), CHALLENGE_REFRESH_INTERVAL)
    return () => window.clearInterval(timer)
  }, [])
  useEffect(() => {
    function openSearch(event) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setPanel('search')
      }
    }
    window.addEventListener('keydown', openSearch)
    return () => window.removeEventListener('keydown', openSearch)
  }, [])

  function updateCourseProgress(courseId, nextState) {
    const previous = getCourseState(courseProgress, courseId)
    setCourseProgressMap((current) => ({ ...current, [distro.id]: { ...(current[distro.id] || {}), [courseId]: nextState } }))
    if (!previous.completed && nextState.completed) setStudyMinutes((value) => value + 15)
  }

  function openCommand(query = '') {
    setCommandQuery((current) => ({ value: query, request: current.request + 1 }))
  }

  const title = navItems.find((item) => item.id === active)?.label || '学习总览'
  const pages = {
    dashboard: <Dashboard key={distro.id} completed={completed} onNavigate={setActive} onOpenCourse={openCourse} onSelectDistro={setSelectedDistro} onSelectCertification={selectCertification} dailyGoal={dailyGoal} setDailyGoal={setDailyGoal} studyMinutes={studyMinutes} setStudyMinutes={setStudyMinutes} distro={distro} courseProgress={courseProgress} learnerStats={learnerStats} syncStatus={syncStatus} onAccount={() => setPanel('profile')} />,
    distros: <DistroCenter currentDistro={distro} onSelectDistro={setSelectedDistro} onNavigate={setActive} completionMap={completionMap} />,
    courses: <Courses key={distro.id} completed={completed} onPractice={() => setActive('practice')} distro={distro} courseProgress={courseProgress} onCourseUpdate={updateCourseProgress} courseRequest={route.courseId ? { courseId: route.courseId, caseId: route.caseId } : null} onCourseRequest={request => setRoute(current => ({ ...current, courseId: request?.courseId || null, caseId: request?.caseId || null }))} />,
    certifications: <CertificationsPage key={user?.id || 'guest'} userId={user?.id} certificationId={route.certificationId || 'cisp'} onSelectCertification={selectCertification} onOpenCourse={openCourse} onOpenCommand={(query, distroId) => { setSelectedDistro(distroId); openCommand(query); setActive('commands') }} onNavigate={setActive} />,
    practice: <Practice completed={completed} setCompleted={setCompleted} distro={distro} courseProgress={courseProgress} onNavigate={setActive} updateStatus={challengeStatus} onRefreshQuestions={() => refreshChallengeFeed(true)} availableQuestions={availableQuestions} onSelectQuestion={selectChallenge} />,
    commands: <CommandsPage key={`${distro.id}:${commandQuery.request}`} distro={distro} onSelectDistro={(id) => { setSelectedDistro(id); openCommand() }} initialQuery={commandQuery.value} />,
    notes: <NotesPage key={distro.id} distro={distro} />,
  }

  return (
    <div className={`app-shell theme-${distro.theme}`}>
      <a className="app-skip-link" href="#learning-content">跳到学习内容</a>
      <Sidebar active={active} onChange={(next) => { setActive(next); if (next === 'commands') openCommand() }} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} onHelp={() => setPanel('help')} onProfile={() => setPanel('profile')} distro={distro} onDistroSelect={setSelectedDistro} learnerStats={learnerStats} questionCount={Math.max(availableQuestions.length, 1)} />
      {mobileOpen && <button className="sidebar-overlay" onClick={() => setMobileOpen(false)} aria-label="关闭菜单遮罩" />}
      <main className="main-content" id="learning-content" tabIndex={-1}>
        <Topbar title={title} onMenu={() => setMobileOpen(true)} onSearch={() => setPanel('search')} onProfile={() => setPanel('profile')} distro={distro} learnerStats={learnerStats} user={user} />
        {user && syncState === 'error' && <div className="cloud-sync-warning" role="status"><span>{syncStatus.title}。当前显示本机账户缓存。</span><button onClick={() => progressLoaded ? setSaveRetry(value => value + 1) : setSyncRetry(value => value + 1)}>重试同步</button></div>}
        {user && syncState === 'loading' ? <div className="page cloud-loading" role="status"><ShieldCheck /><h2>正在读取账户的学习进度</h2><p>加载完成后将恢复你的课程与靶场记录。</p></div> : pages[active]}
        <footer><span>SECURITY PATH // {distro.shortName.toUpperCase()} // LEARN RESPONSIBLY</span><span>课程内容仅用于合法授权环境</span></footer>
      </main>
      <nav className="mobile-learning-nav" aria-label="快捷学习导航">{navItems.filter(item => item.id !== 'distros').map(item => <button key={item.id} aria-label={item.label} aria-current={active === item.id ? 'page' : undefined} onClick={() => { setActive(item.id); if (item.id === 'commands') openCommand() }}><item.icon size={20} /><span>{{ dashboard: '总览', courses: '课程', certifications: '认证', practice: '靶场', commands: '手册', notes: '笔记' }[item.id]}</span></button>)}</nav>
      {panel === 'search' && <GlobalSearch onClose={() => setPanel(null)} onNavigate={setActive} onSelectDistro={setSelectedDistro} onOpenCommand={openCommand} onOpenCourse={openCourse} onSelectCertification={selectCertification} />}
      {panel === 'help' && <HelpPanel onClose={() => setPanel(null)} onNavigate={setActive} />}
      {panel === 'profile' && (user
        ? <ProfilePanel onClose={() => setPanel(null)} studyMinutes={studyMinutes} learnerStats={learnerStats} syncStatus={syncStatus} onSignOut={async () => { const { error } = await supabase.auth.signOut(); if (error) { setSyncState('error'); return }; setPanel(null) }} />
        : <AuthPanel onClose={() => setPanel(null)} onSignedIn={setUser} />)}
    </div>
  )
}

export default App
