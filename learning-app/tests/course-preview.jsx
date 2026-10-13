import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { CourseWorkspace, distroCatalog } from '../src/App.jsx'
import { courseChapters } from '../src/data/courseDetails.js'
import '../src/styles.css'

const params = new URLSearchParams(location.search)

function CourseFixture() {
  const distro = distroCatalog[params.get('distro')] || distroCatalog.kali
  const lesson = distro.lessons.find(item => item.id === Number(params.get('course'))) || distro.lessons[0]
  const step = Math.min(4, Math.max(0, Number(params.get('step')) || 0))
  const [state, setState] = useState({ sections: courseChapters.slice(0, step).map(item => item.id), completed: step === 4, quizPassed: step === 4 })
  const [open, setOpen] = useState(true)
  return open ? <CourseWorkspace distro={distro} lesson={lesson} courseState={state} onUpdate={(_, update) => setState(update)} onClose={() => setOpen(false)} onPractice={() => setOpen(false)} /> : <button onClick={() => setOpen(true)}>重新打开测试课程</button>
}

function Preview() {
  const [distro, setDistro] = useState('kali')
  const [course, setCourse] = useState('1')
  const [step, setStep] = useState('0')
  const [width, setWidth] = useState('390')
  const query = new URLSearchParams({ frame: '1', distro, course, step })
  return <main style={{ margin: '24px auto', padding: 16, maxWidth: 1180 }}>
    <h1>课程阅读组件验证</h1>
    <p>独立测试进度，不连接学习账号、不保存到正式学习记录。</p>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18, marginBottom: 20 }}>
      <label>测试系统 <select value={distro} onChange={event => setDistro(event.target.value)}>{Object.keys(distroCatalog).map(id => <option key={id}>{id}</option>)}</select></label>
      <label>测试课程 <select value={course} onChange={event => setCourse(event.target.value)}>{distroCatalog[distro].lessons.map(lesson => <option value={lesson.id} key={lesson.id}>{lesson.title}</option>)}</select></label>
      <label>起始章节 <select value={step} onChange={event => setStep(event.target.value)}>{[...courseChapters.map(chapter => chapter.title), '结课测验', '已完成'].map((title, index) => <option value={index} key={title}>{title}</option>)}</select></label>
      <label>预览宽度 <select value={width} onChange={event => setWidth(event.target.value)}><option value="390">手机 390px</option><option value="320">小屏 320px</option><option value="1100">桌面 1100px</option></select></label>
    </div>
    <iframe title="课程测试预览" src={`./course-preview.html?${query}`} style={{ width: Number(width), maxWidth: '100%', height: 844, border: '1px solid #294053', display: 'block', margin: 'auto' }} />
  </main>
}

createRoot(document.getElementById('root')).render(params.has('frame') ? <CourseFixture /> : <Preview />)
