import assert from 'node:assert/strict'
import test from 'node:test'
import { createLearningNote, createNotebook, notesReducer, persistNotebook } from '../src/data/notes.js'

const first = { id: 'a', title: 'First', content: 'Original\nSecond line', updatedAt: 1 }
const second = { id: 'b', title: 'Second', content: 'Keep me', updatedAt: 2 }

test('new notebooks can be empty and rapid creation uses distinct identities', () => {
  assert.deepEqual(createNotebook(), { notes: [], trash: [], activeId: null })
  const a = createLearningNote(100), b = createLearningNote(100)
  assert.notEqual(a.id, b.id)
  assert.equal(a.content, '')
  assert.equal(a.title, '')
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
