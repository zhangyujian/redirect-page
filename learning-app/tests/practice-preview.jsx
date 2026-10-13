import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Courses, distroCatalog } from '../src/App.jsx'
import '../src/styles.css'

const params = new URLSearchParams(location.search)

function Fixture() {
  const distro = distroCatalog[params.get('distro')] || distroCatalog.kali
  const initial = params.has('complete') ? Object.fromEntries(distro.lessons.map(lesson => [lesson.id, { sections: ['overview', 'concepts', 'workflow'], completed: true, quizPassed: true }])) : {}
  const [progress, setProgress] = useState(initial)
  return <><output aria-label="测试课程记录">{JSON.stringify(progress)}</output><Courses completed={false} distro={distro} courseProgress={progress} onCourseUpdate={(id, state) => setProgress(current => ({ ...current, [id]: state }))} onPractice={() => {}} /></>
}

function Preview() {
  const [distro, setDistro] = useState('kali')
  const [width, setWidth] = useState('390')
  const [complete, setComplete] = useState(false)
  return <main style={{ margin: '20px auto', padding: 16, maxWidth: 1180 }}>
    <h1>实战案例独立验证</h1><p>不登录、不写入真实学习进度。</p>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18, marginBottom: 20 }}>
      <label>测试系统 <select value={distro} onChange={event => setDistro(event.target.value)}>{Object.keys(distroCatalog).map(id => <option key={id}>{id}</option>)}</select></label>
      <label>预览宽度 <select value={width} onChange={event => setWidth(event.target.value)}><option value="390">手机 390px</option><option value="320">小屏 320px</option><option value="1100">桌面 1100px</option></select></label>
      <label><input type="checkbox" checked={complete} onChange={event => setComplete(event.target.checked)} />课程全部完成</label>
    </div>
    <iframe title="实战测试预览" src={'./practice-preview.html?frame=1&distro=' + distro + (complete ? '&complete=1' : '')} style={{ width: Number(width), maxWidth: '100%', height: 860, display: 'block', margin: 'auto', border: '1px solid #294053' }} />
  </main>
}

createRoot(document.getElementById('root')).render(params.has('frame') ? <Fixture /> : <Preview />)
