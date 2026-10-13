import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import TerminalLab from '../src/components/TerminalLab.jsx'
import { distroCatalog } from '../src/App.jsx'
import '../src/styles.css'

function Preview() {
  const [id, setId] = useState('blackarch')
  const [completed, setCompleted] = useState(false)
  const distro = distroCatalog[id]
  return <main style={{ maxWidth: 1150, margin: '24px auto', padding: 16 }}>
    <h1>沙盒组件验证</h1>
    <label>测试系统 <select value={id} onChange={event => { setId(event.target.value); setCompleted(false) }}>{Object.keys(distroCatalog).map(value => <option key={value}>{value}</option>)}</select></label>
    <p role="status">{completed ? '测试任务完成' : '测试任务未完成'}</p>
    <TerminalLab key={id} distro={distro} onMissionComplete={() => setCompleted(true)} />
  </main>
}
createRoot(document.getElementById('root')).render(<Preview />)
