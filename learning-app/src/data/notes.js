let fallbackSequence = 0
export const NOTE_CATEGORIES = ['未分类', '课程笔记', '命令速查', '靶场复盘', '备考记录', '其他']

export function createLearningNote(now = Date.now(), createId = () => globalThis.crypto?.randomUUID?.()) {
  return { id: `note-${createId() || `${now}-${++fallbackSequence}`}`, title: '', content: '', category: '未分类', createdAt: now, updatedAt: now }
}

export function noteCategory(note) {
  return typeof note.category === 'string' && note.category.trim() ? note.category.trim() : '未分类'
}

export function noteCategories(notes) {
  const counts = new Map(NOTE_CATEGORIES.map(category => [category, 0]))
  for (const note of notes) {
    const category = noteCategory(note)
    counts.set(category, (counts.get(category) || 0) + 1)
  }
  return [...counts].map(([name, count]) => ({ name, count }))
}

export function filterNotes(notes, category = null) {
  return category === null ? notes : notes.filter(note => noteCategory(note) === category)
}

export function notePreview(note, limit = 260) {
  const content = typeof note.content === 'string' ? note.content.trim() : ''
  const characters = Array.from(content)
  return characters.length > limit ? `${characters.slice(0, limit).join('')}...` : content
}

export function noteRecordedTime(note) {
  const valid = value => Number.isFinite(value) && value > 0 && Number.isFinite(new Date(value).getTime())
  if (valid(note.createdAt)) return { value: note.createdAt, source: 'created' }
  if (valid(note.updatedAt)) return { value: note.updatedAt, source: 'updated' }
  return { value: null, source: 'unknown' }
}

function uniqueId(id, entries) {
  let candidate = id, suffix = 1
  while (entries.some(entry => entry.id === candidate)) candidate = `${id}-${suffix++}`
  return candidate
}

export function createNotebook(notes = [], trash = [], activeId = null) {
  return { notes, trash, activeId: notes.some(note => note.id === activeId) ? activeId : notes[0]?.id || null }
}

export function persistNotebook(storage, notesKey, trashKey, state, activeKey) {
  try {
    const previousTrash = JSON.parse(storage.getItem(trashKey) || '[]')
    if (!Array.isArray(previousTrash)) return false
    // Keep restored copies until the active-list write succeeds, too.
    const backup = new Map([...previousTrash, ...state.trash].map(note => [note.id, note]))
    storage.setItem(trashKey, JSON.stringify([...backup.values()]))
    storage.setItem(notesKey, JSON.stringify(state.notes))
    storage.setItem(trashKey, JSON.stringify(state.trash))
    if (activeKey) storage.setItem(activeKey, JSON.stringify(state.activeId))
    return true
  } catch {
    return false
  }
}

export function notesReducer(state, action) {
  if (action.type === 'create') {
    const note = { ...action.note, id: uniqueId(action.note.id, [...state.notes, ...state.trash]) }
    return { ...state, notes: [note, ...state.notes], activeId: note.id }
  }
  if (action.type === 'select') {
    return state.notes.some(note => note.id === action.id) ? { ...state, activeId: action.id } : state
  }
  if (action.type === 'edit') {
    if (!['title', 'content', 'category'].includes(action.field) || typeof action.value !== 'string') return state
    return { ...state, notes: state.notes.map(note => note.id === action.id ? { ...note, [action.field]: action.value, updatedAt: action.now } : note) }
  }
  if (action.type === 'delete') {
    const note = state.notes.find(entry => entry.id === action.id)
    if (!note) return state
    const notes = state.notes.filter(entry => entry.id !== action.id)
    return { notes, trash: [{ ...note, deletedAt: action.now }, ...state.trash], activeId: state.activeId === action.id ? notes[0]?.id || null : state.activeId }
  }
  if (action.type === 'restore') {
    const removed = state.trash.find(note => note.id === action.id)
    if (!removed) return state
    const { deletedAt, ...note } = removed
    const restored = { ...note, id: uniqueId(note.id, state.notes) }
    return { notes: [restored, ...state.notes], trash: state.trash.filter(entry => entry.id !== action.id), activeId: restored.id }
  }
  return state
}
