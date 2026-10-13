import assert from 'node:assert/strict'
import test from 'node:test'
import { createLearningNote, createNotebook, filterNotes, NOTE_CATEGORIES, noteCategories, noteCategory, notePreview, noteRecordedTime, notesReducer, persistNotebook } from '../src/data/notes.js'

const first = { id: 'a', title: 'First', content: 'Original\nSecond line', updatedAt: 1 }
const second = { id: 'b', title: 'Second', content: 'Keep me', updatedAt: 2 }

test('new notebooks can be empty and rapid creation uses distinct identities', () => {
  assert.deepEqual(createNotebook(), { notes: [], trash: [], activeId: null })
  const a = createLearningNote(100), b = createLearningNote(100)
  assert.notEqual(a.id, b.id)
  assert.equal(a.content, '')
  assert.equal(a.title, '')
  assert.equal(a.createdAt, 100)
  assert.equal(a.updatedAt, 100)
  assert.equal(a.category, '未分类')
  assert.notEqual(createLearningNote(100, () => null).id, createLearningNote(100, () => null).id)
})

test('creating selects the new note without changing existing records', () => {
  const initial = createNotebook([first])
  const created = notesReducer(initial, { type: 'create', note: second })
  assert.equal(created.activeId, 'b')
  assert.deepEqual(created.notes, [second, first])
  assert.deepEqual(initial.notes, [first])
})

test('editing preserves newlines, blank lines, whitespace and deletions', () => {
  let state = createNotebook([first, second])
  for (const value of ['First\nSecond', 'First\n\n  Third\n', '', '中文输入\n第二行']) {
    state = notesReducer(state, { type: 'edit', id: 'a', field: 'content', value, now: 10 })
    assert.equal(state.notes[0].content, value)
    assert.deepEqual(state.notes[1], second)
  }
  state = notesReducer(state, { type: 'edit', id: 'a', field: 'title', value: '新名称', now: 11 })
  assert.equal(state.notes[0].title, '新名称')
  assert.equal(state.notes[0].content, '中文输入\n第二行')
  assert.equal(state.notes[0].updatedAt, 11)
})

test('only the selected note is edited after switching', () => {
  const selected = notesReducer(createNotebook([first, second]), { type: 'select', id: 'b' })
  const edited = notesReducer(selected, { type: 'edit', id: selected.activeId, field: 'content', value: 'Updated', now: 12 })
  assert.equal(edited.notes[1].content, 'Updated')
  assert.deepEqual(edited.notes[0], first)
})

test('the selected note survives refresh and stale selection falls back to a real note', () => {
  const storage = mockStorage([first, second], [])
  const selected = notesReducer(createNotebook([first, second]), { type: 'select', id: 'b' })
  assert.equal(persistNotebook(storage, 'notes', 'trash', selected, 'active'), true)
  const restored = createNotebook(JSON.parse(storage.getItem('notes')), JSON.parse(storage.getItem('trash')), JSON.parse(storage.getItem('active')))
  assert.equal(restored.activeId, 'b')
  assert.equal(createNotebook([first], [], 'missing').activeId, 'a')
  assert.equal(createNotebook([], [], 'missing').activeId, null)
})

test('deleting the last note really empties the list and preserves recoverable content', () => {
  const removed = notesReducer(createNotebook([first]), { type: 'delete', id: 'a', now: 20 })
  assert.deepEqual(removed.notes, [])
  assert.equal(removed.activeId, null)
  assert.equal(removed.trash[0].content, first.content)
  const restored = notesReducer(removed, { type: 'restore', id: 'a' })
  assert.deepEqual(restored, createNotebook([first]))
})

test('delete chooses another active note and does not change unselected content', () => {
  const initial = createNotebook([first, second])
  const removed = notesReducer(initial, { type: 'delete', id: 'a', now: 20 })
  assert.equal(removed.activeId, 'b')
  assert.deepEqual(removed.notes, [second])
  assert.deepEqual(initial, createNotebook([first, second]))
  const other = notesReducer(initial, { type: 'delete', id: 'b', now: 20 })
  assert.equal(other.activeId, 'a')
})

test('deletions and restores survive JSON storage without fabricating a blank note', () => {
  let state = notesReducer(createNotebook([first, second]), { type: 'delete', id: 'a', now: 20 })
  state = notesReducer(state, { type: 'delete', id: 'b', now: 21 })
  const loaded = createNotebook(JSON.parse(JSON.stringify(state.notes)), JSON.parse(JSON.stringify(state.trash)))
  assert.equal(loaded.notes.length, 0)
  assert.equal(loaded.trash.length, 2)
  const restored = notesReducer(loaded, { type: 'restore', id: 'b' })
  assert.deepEqual(restored.notes, [second])
  assert.equal(restored.trash[0].id, 'a')
})

test('duplicate identities are made unique on create and restore, without losing either content', () => {
  const created = notesReducer(createNotebook([first]), { type: 'create', note: { ...second, id: 'a' } })
  assert.notEqual(created.activeId, 'a')
  assert.equal(new Set(created.notes.map(note => note.id)).size, 2)
  const restored = notesReducer(createNotebook([first], [{ ...second, id: 'a', deletedAt: 20 }]), { type: 'restore', id: 'a' })
  assert.equal(restored.notes.length, 2)
  assert.equal(restored.notes[0].content, second.content)
  assert.equal(restored.notes[1].content, first.content)
})

test('unknown actions, missing deletes and invalid edit fields leave notes intact', () => {
  const initial = createNotebook([first])
  assert.equal(notesReducer(initial, { type: 'delete', id: 'missing' }), initial)
  assert.equal(notesReducer(initial, { type: 'select', id: 'missing' }), initial)
  assert.equal(notesReducer(initial, { type: 'edit', id: 'a', field: 'id', value: 'other' }), initial)
  assert.equal(notesReducer(initial, { type: 'unknown' }), initial)
})

function mockStorage(notes, trash, failAt = 0) {
  const values = new Map([['notes', JSON.stringify(notes)], ['trash', JSON.stringify(trash)]])
  let writes = 0
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => { if (++writes === failAt) throw new Error('Storage full'); values.set(key, value) } }
}

test('successful saves preserve content and recovery records exactly', () => {
  const storage = mockStorage([], [])
  const state = createNotebook([first], [{ ...second, deletedAt: 30 }])
  assert.equal(persistNotebook(storage, 'notes', 'trash', state), true)
  assert.deepEqual(JSON.parse(storage.getItem('notes')), state.notes)
  assert.deepEqual(JSON.parse(storage.getItem('trash')), state.trash)
})

test('failed delete persistence always keeps an active or recoverable copy', () => {
  const deleted = notesReducer(createNotebook([first]), { type: 'delete', id: 'a', now: 30 })
  for (const failAt of [1, 2, 3]) {
    const storage = mockStorage([first], [], failAt)
    assert.equal(persistNotebook(storage, 'notes', 'trash', deleted), false)
    const copies = [...JSON.parse(storage.getItem('notes')), ...JSON.parse(storage.getItem('trash'))]
    assert.equal(copies.some(note => note.id === 'a' && note.content === first.content), true)
  }
})

test('failed restore persistence never removes the only recovery copy', () => {
  const removed = { ...first, deletedAt: 30 }
  const restored = notesReducer(createNotebook([], [removed]), { type: 'restore', id: 'a' })
  for (const failAt of [1, 2, 3]) {
    const storage = mockStorage([], [removed], failAt)
    assert.equal(persistNotebook(storage, 'notes', 'trash', restored), false)
    const copies = [...JSON.parse(storage.getItem('notes')), ...JSON.parse(storage.getItem('trash'))]
    assert.equal(copies.some(note => note.id === 'a' && note.content === first.content), true)
  }
})

test('editing sticky-note fields updates modification time but preserves creation time', () => {
  const note = createLearningNote(100)
  let state = createNotebook([note])
  for (const [field, value] of [['title', '标题'], ['category', '靶场复盘'], ['content', '第一行\n第二行']]) {
    state = notesReducer(state, { type: 'edit', id: note.id, field, value, now: 200 })
    assert.equal(state.notes[0].createdAt, 100)
    assert.equal(state.notes[0].updatedAt, 200)
  }
  assert.deepEqual(noteRecordedTime(state.notes[0]), { value: 100, source: 'created' })
})

test('legacy notes remain unchanged and do not receive fabricated creation dates', () => {
  const state = createNotebook([first])
  assert.deepEqual(state.notes[0], first)
  assert.equal(noteCategory(first), '未分类')
  assert.deepEqual(noteRecordedTime(first), { value: 1, source: 'updated' })
  assert.equal(Object.hasOwn(first, 'createdAt'), false)
  assert.deepEqual(noteRecordedTime({}), { value: null, source: 'unknown' })
  assert.deepEqual(noteRecordedTime({ createdAt: Infinity, updatedAt: 20 }), { value: 20, source: 'updated' })
  assert.deepEqual(noteRecordedTime({ createdAt: 9e15 }), { value: null, source: 'unknown' })
})

test('category counts include defaults, custom categories and unclassified legacy notes', () => {
  const notes = [first, { ...second, category: '课程笔记' }, { ...first, id: 'c', category: ' 自定义项目 ' }, { ...first, id: 'd', category: '自定义项目' }]
  const categories = noteCategories(notes)
  assert.equal(categories.find(category => category.name === '未分类').count, 1)
  assert.equal(categories.find(category => category.name === '课程笔记').count, 1)
  assert.equal(categories.find(category => category.name === '自定义项目').count, 2)
  assert.equal(categories.length, NOTE_CATEGORIES.length + 1)
  assert.equal(noteCategory({ category: '   ' }), '未分类')
})

test('category filters keep original order and support a custom category named all', () => {
  const notes = [first, { ...second, category: 'all' }, { ...first, id: 'c', category: '课程笔记' }]
  const snapshot = structuredClone(notes)
  assert.equal(filterNotes(notes), notes)
  assert.deepEqual(filterNotes(notes, 'all'), [notes[1]])
  assert.deepEqual(filterNotes(notes, '课程笔记'), [notes[2]])
  assert.deepEqual(filterNotes(notes, '未分类'), [notes[0]])
  assert.deepEqual(filterNotes(notes, 'missing'), [])
  assert.deepEqual(notes, snapshot)
})

test('body previews preserve actual multiline text and do not cut Unicode characters in half', () => {
  assert.equal(notePreview({ content: '  第一行\n\n第二行  ' }), '第一行\n\n第二行')
  assert.equal(notePreview({ content: '🙂中文记录' }, 3), '🙂中文...')
  assert.equal(notePreview({ content: '<script>alert(1)</script>' }), '<script>alert(1)</script>')
  assert.equal(notePreview({ content: '   ' }), '')
  assert.equal(notePreview({}), '')
})

test('classification, body and timestamps survive deletion, recovery and JSON persistence', () => {
  const note = { ...createLearningNote(100), title: '课程复盘', category: '自定义项目', content: '真实正文\n第二行' }
  const removed = notesReducer(createNotebook([note]), { type: 'delete', id: note.id, now: 300 })
  const loaded = createNotebook([], JSON.parse(JSON.stringify(removed.trash)))
  const restored = notesReducer(loaded, { type: 'restore', id: note.id })
  assert.deepEqual(restored.notes, [note])
  assert.equal(notePreview(restored.notes[0]), note.content)
  assert.equal(noteCategory(restored.notes[0]), '自定义项目')
})
