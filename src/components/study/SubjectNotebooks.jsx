import { useEffect, useMemo, useRef, useState } from 'react'
import Card from '../ui/Card'
import SummaryCard from '../ui/SummaryCard'

const KEY = 'subject-notebooks'
const COLORS = ['terracota', 'oceano', 'oliva', 'ameixa', 'grafite', 'ambar', 'vinho', 'esmeralda', 'anil']

const emptyNotebook = () => ({ name: '', description: '', tag: '', color: COLORS[0], parentId: null })

function fmt(value) {
  try {
    return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
  } catch { return 'Data inválida' }
}

function sanitize(raw) {
  if (!Array.isArray(raw)) return []
  const seen = new Set()
  return raw.reduce((acc, item, i) => {
    if (!item || typeof item !== 'object') return acc
    const id = Number.isFinite(Number(item.id)) ? Number(item.id) : Date.now() + i
    if (seen.has(id)) return acc
    seen.add(id)
    acc.push({
      id,
      name: item.name ?? 'Caderno sem nome',
      description: item.description ?? '',
      tag: item.tag ?? '',
      color: COLORS.includes(item.color) ? item.color : COLORS[i % COLORS.length],
      content: item.content ?? '',
      createdAt: item.createdAt ?? Date.now(),
      updatedAt: item.updatedAt ?? Date.now(),
      archived: Boolean(item.archived),
      parentId: typeof item.parentId === 'number' ? item.parentId : null,
      topics: Array.isArray(item.topics) ? item.topics.map((t, ti) => ({
        id: Number.isFinite(Number(t.id)) ? Number(t.id) : Date.now() + ti,
        title: t.title ?? '',
        content: t.content ?? '',
      })) : [],
    })
    return acc
  }, [])
}

function persist(notebooks) {
  try { localStorage.setItem(KEY, JSON.stringify(sanitize(notebooks))) } catch { /* ignore */ }
}

function readStore() {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || '[]')
    const sanitized = sanitize(parsed)
    persist(sanitized)
    return sanitized
  } catch { return [] }
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function ArrowLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="m14 6-6 6 6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M12 5v14m-7-7h14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="m15.5 4.5 4 4L7 21H3v-4L15.5 4.5Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M9 4.75h6m-8.5 3h11m-9.5 0 .55 10.2A2 2 0 0 0 10.54 20h2.92a2 2 0 0 0 1.99-2.05L16 7.75M10.5 11v5m3-5v5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ArchiveIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M4 7.5h16v11a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5v-11Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      <path d="M3 5.5A1.5 1.5 0 0 1 4.5 4h15A1.5 1.5 0 0 1 21 5.5v1A1.5 1.5 0 0 1 19.5 8h-15A1.5 1.5 0 0 1 3 6.5v-1Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      <path d="M10 12h4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  )
}

function ExportIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M12 4.5v10m0-10 4 4m-4-4-4 4M5 15.5v2.25A1.75 1.75 0 0 0 6.75 19.5h10.5A1.75 1.75 0 0 0 19 17.75V15.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ImportIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M12 19.5v-10m0 10 4-4m-4 4-4-4M5 8.5V6.25A1.75 1.75 0 0 1 6.75 4.5h10.5A1.75 1.75 0 0 1 19 6.25V8.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function DocumentIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M7 4.75h7.75L19.25 9v10.25A2.75 2.75 0 0 1 16.5 22H7.5A2.75 2.75 0 0 1 4.75 19.25v-11.75A2.75 2.75 0 0 1 7.5 4.75Zm7.25.5v4.5h4.5M8 12h8m-8 3.5h6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

function splitTags(tagValue) {
  if (!tagValue) return []
  return tagValue.split(';').map((t) => t.trim()).filter(Boolean)
}

function SubjectNotebooks() {
  const importInputRef = useRef(null)
  const subImportInputRef = useRef(null)
  const subSectionRef = useRef(null)
  const [notebooks, setNotebooks] = useState(() => readStore())
  const [view, setView] = useState('library')
  const [selectedId, setSelectedId] = useState(null)
  const [shelfEdit, setShelfEdit] = useState(false)
  const [showArchivedShelf, setShowArchivedShelf] = useState(false)

  // create/edit forms
  const [bookForm, setBookForm] = useState(emptyNotebook)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState(emptyNotebook)

  // content editing
  const [contentDraft, setContentDraft] = useState('')
  const [contentSaved, setContentSaved] = useState(false)
  const [isContentEditing, setIsContentEditing] = useState(false)

  // sub-notebook creation
  const [showSubForm, setShowSubForm] = useState(false)
  const [subForm, setSubForm] = useState(emptyNotebook)
  const [subImportStatus, setSubImportStatus] = useState('')
  const [subShelfEdit, setSubShelfEdit] = useState(false)

  // topics (inside sub-notebooks)
  const [showTopicForm, setShowTopicForm] = useState(false)
  const [topicForm, setTopicForm] = useState({ title: '', content: '' })
  const [editingTopicId, setEditingTopicId] = useState(null)
  const [editingTopicForm, setEditingTopicForm] = useState({ title: '', content: '' })
  const [selectedTopicId, setSelectedTopicId] = useState(null)
  const [topicSaved, setTopicSaved] = useState(false)

  // navigation history (stack of parent IDs)
  const [navStack, setNavStack] = useState([])

  // import/export settings
  const [showSettings, setShowSettings] = useState(false)
  const [settingsMode, setSettingsMode] = useState('export')
  const [exportFormat, setExportFormat] = useState('json')
  const [exportSelection, setExportSelection] = useState([])
  const [settingsStatus, setSettingsStatus] = useState('')

  useEffect(() => { persist(notebooks) }, [notebooks])

  useEffect(() => {
    const shouldLock = Boolean(editingId || showSettings || showArchivedShelf)
    const scrollY = window.scrollY
    if (shouldLock) {
      document.body.style.overflow = 'hidden'
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollY}px`
      document.body.style.width = '100%'
    }
    return () => {
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      if (shouldLock) window.scrollTo(0, scrollY)
    }
  }, [editingId, showSettings, showArchivedShelf])

  const visibleNotebooks = useMemo(() => notebooks.filter((n) => !n.archived), [notebooks])
  const archivedNotebooks = useMemo(() => notebooks.filter((n) => n.archived), [notebooks])
  const rootNotebooks = useMemo(() => visibleNotebooks.filter((n) => !n.parentId), [visibleNotebooks])
  const selected = useMemo(() => notebooks.find((n) => n.id === selectedId && !n.archived) ?? null, [notebooks, selectedId])
  const subNotebooks = useMemo(() => selected ? visibleNotebooks.filter((n) => n.parentId === selected.id) : [], [visibleNotebooks, selected])
  const selectedTopic = useMemo(() => (selected?.topics ?? []).find((t) => t.id === selectedTopicId) ?? null, [selected, selectedTopicId])

  const totalChars = useMemo(() => notebooks.reduce((t, n) => t + (n.content?.length ?? 0), 0), [notebooks])
  const activeBooks = useMemo(() => rootNotebooks.filter((n) => (n.content?.length ?? 0) > 0).length, [rootNotebooks])

  useEffect(() => {
    if (selectedTopicId && !selectedTopic) {
      setSelectedTopicId(null)
      setEditingTopicForm({ title: '', content: '' })
    }
  }, [selectedTopicId, selectedTopic])

  function goLibrary() {
    setView('library')
    setSelectedId(null)
    setContentDraft('')
    setContentSaved(false)
    setIsContentEditing(false)
    setShelfEdit(false)
    setNavStack([])
    setShowSubForm(false)
    setSubForm(emptyNotebook())
    setShowTopicForm(false)
    setSelectedTopicId(null)
    setEditingTopicId(null)
    setEditingTopicForm({ title: '', content: '' })
    setTopicSaved(false)
  }

  function goBack() {
    if (navStack.length > 0) {
      const parentId = navStack.at(-1)
      const parentNb = notebooks.find((n) => n.id === parentId)
      setNavStack((prev) => prev.slice(0, -1))
      if (parentNb) {
        setSelectedId(parentId)
        setContentDraft(parentNb.content ?? '')
        setContentSaved(false)
        setIsContentEditing(false)
        setView('detail')
        setShowSubForm(false)
        setShowTopicForm(false)
        setSelectedTopicId(null)
        setEditingTopicId(null)
        setEditingTopicForm({ title: '', content: '' })
        setTopicSaved(false)
        window.scrollTo({ top: 0, behavior: 'smooth' })
        return
      }
    }
    goLibrary()
  }

  function openDetail(id) {
    if (view === 'detail' && selectedId !== null) {
      setNavStack((prev) => [...prev, selectedId])
    }
    const nb = notebooks.find((n) => n.id === id)
    if (!nb) return
    setSelectedId(id)
    setContentDraft(nb.content ?? '')
    setContentSaved(false)
    setIsContentEditing(false)
    setShowSubForm(false)
    setShowTopicForm(false)
    setSelectedTopicId(null)
    setEditingTopicId(null)
    setEditingTopicForm({ title: '', content: '' })
    setTopicSaved(false)
    setView('detail')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function openEditor(nb) {
    setEditingId(nb.id)
    setEditForm({ name: nb.name, description: nb.description, tag: nb.tag, color: nb.color })
  }

  function closeEditor() {
    setEditingId(null)
    setEditForm(emptyNotebook())
  }

  function startContentEdit() {
    if (!selected) return
    setContentDraft(selected.content ?? '')
    setContentSaved(false)
    setIsContentEditing(true)
  }

  function cancelContentEdit() {
    setContentDraft(selected?.content ?? '')
    setContentSaved(false)
    setIsContentEditing(false)
  }

  function openSubNotebookForm() {
    setShowSubForm(true)
    requestAnimationFrame(() => {
      subSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  function saveContent() {
    if (!selected) return
    setNotebooks((prev) => prev.map((n) => n.id === selected.id ? { ...n, content: contentDraft, updatedAt: Date.now() } : n))
    setContentSaved(true)
    setIsContentEditing(false)
    setTimeout(() => setContentSaved(false), 2000)
  }

  function createBook(e) {
    e.preventDefault()
    const name = bookForm.name.trim()
    if (!name) return alert('Informe um nome para o caderno.')
    const now = Date.now()
    const nb = { id: now, name, description: bookForm.description.trim(), tag: bookForm.tag.trim(), color: bookForm.color, content: '', createdAt: now, updatedAt: now, archived: false, parentId: null }
    setNotebooks((p) => [nb, ...p])
    setBookForm(emptyNotebook())
    setSelectedId(nb.id)
    setContentDraft('')
    setView('detail')
  }

  function createSubBook(e) {
    e.preventDefault()
    if (!selected) return
    const name = subForm.name.trim()
    if (!name) return alert('Informe um nome para o sub-caderno.')
    const now = Date.now()
    const nb = { id: now, name, description: subForm.description.trim(), tag: subForm.tag.trim(), color: subForm.color, content: '', createdAt: now, updatedAt: now, archived: false, parentId: selected.id }
    setNotebooks((p) => [...p, nb])
    setSubForm(emptyNotebook())
    setShowSubForm(false)
    openDetail(nb.id)
  }

  function saveBook(e) {
    e.preventDefault()
    if (!editingId) return
    const name = editForm.name.trim()
    if (!name) return alert('Informe um nome para o caderno.')
    setNotebooks((p) => p.map((n) => n.id === editingId ? { ...n, name, description: editForm.description.trim(), tag: editForm.tag.trim(), color: editForm.color, updatedAt: Date.now() } : n))
    closeEditor()
  }

  function deleteBook() {
    if (!editingId) return
    const nb = notebooks.find((n) => n.id === editingId)
    if (!nb) return
    if (!window.confirm(`Excluir o caderno "${nb.name}"?`)) return
    setNotebooks((p) => p.filter((n) => n.id !== editingId && n.parentId !== editingId))
    if (selectedId === editingId) goLibrary()
    closeEditor()
  }

  function deleteNotebookById(id, name) {
    if (!window.confirm(`Excluir o caderno "${name}"?`)) return
    setNotebooks((p) => p.filter((n) => n.id !== id && n.parentId !== id))
    if (selectedId === id) goLibrary()
    if (editingId === id) closeEditor()
  }

  function toggleArchive(id, shouldArchive) {
    setNotebooks((p) => p.map((n) => n.id === id ? { ...n, archived: shouldArchive, updatedAt: Date.now() } : n))
    if (shouldArchive && selectedId === id) goLibrary()
  }

  // ── Topics ──────────────────────────────────────────────────────────────────

  function createTopic(e) {
    e.preventDefault()
    if (!selected) return
    const title = topicForm.title.trim()
    if (!title) return
    const newTopic = { id: Date.now(), title, content: topicForm.content.trim() }
    setNotebooks((p) => p.map((n) => n.id === selected.id
      ? { ...n, topics: [...(n.topics ?? []), newTopic], updatedAt: Date.now() }
      : n
    ))
    setTopicForm({ title: '', content: '' })
    setShowTopicForm(false)
    setSelectedTopicId(newTopic.id)
    setEditingTopicId(newTopic.id)
    setEditingTopicForm({ title: newTopic.title, content: newTopic.content })
    setTopicSaved(false)
  }

  function openTopic(topic) {
    setSelectedTopicId(topic.id)
    setEditingTopicId(topic.id)
    setEditingTopicForm({ title: topic.title, content: topic.content })
    setTopicSaved(false)
    setShowTopicForm(false)
  }

  function closeTopic() {
    setSelectedTopicId(null)
    setEditingTopicId(null)
    setEditingTopicForm({ title: '', content: '' })
    setTopicSaved(false)
  }

  function saveTopic(topicId) {
    if (!selected) return
    setNotebooks((p) => p.map((n) => n.id === selected.id
      ? { ...n, topics: (n.topics ?? []).map((t) => t.id === topicId ? { ...t, title: editingTopicForm.title, content: editingTopicForm.content } : t), updatedAt: Date.now() }
      : n
    ))
    setTopicSaved(true)
    setTimeout(() => setTopicSaved(false), 1500)
  }

  function deleteTopic(topicId) {
    if (!selected) return
    setNotebooks((p) => p.map((n) => n.id === selected.id
      ? { ...n, topics: (n.topics ?? []).filter((t) => t.id !== topicId), updatedAt: Date.now() }
      : n
    ))
    if (editingTopicId === topicId) { setEditingTopicId(null); setEditingTopicForm({ title: '', content: '' }) }
    if (selectedTopicId === topicId) setSelectedTopicId(null)
  }

  // ── Sub-notebook import ────────────────────────────────────────────────────

  function handleSubImportFile(e) {
    const file = e.target.files?.[0]
    if (!file || !selectedId) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const text = ev.target.result
        const baseTime = Date.now()
        let imported = []
        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(text)
          const arr = Array.isArray(parsed) ? parsed : [parsed]
          imported = arr.map((item, i) => ({
            id: baseTime + i * 1000,
            name: item.name ?? `Sub-caderno importado ${i + 1}`,
            description: item.description ?? '',
            tag: item.tag ?? '',
            color: COLORS.includes(item.color) ? item.color : COLORS[i % COLORS.length],
            content: item.content ?? '',
            createdAt: item.createdAt ?? baseTime,
            updatedAt: baseTime,
            archived: false,
            parentId: selectedId,
          }))
        } else {
          const sections = text.split(/\n---\n/)
          imported = sections.map((section, i) => {
            const lines = section.trim().split('\n')
            const titleLine = lines.find((l) => l.startsWith('# '))
            const name = titleLine ? titleLine.replace(/^#\s+/, '') : `Sub-caderno importado ${i + 1}`
            const tagLine = lines.find((l) => l.startsWith('Tags:'))
            const tag = tagLine ? tagLine.replace(/^Tags:\s*/, '') : ''
            const contentLines = lines.filter((l) => !l.startsWith('# ') && !l.startsWith('Tags:') && !l.startsWith('> '))
            return {
              id: baseTime + i * 1000,
              name,
              description: '',
              tag,
              color: COLORS[i % COLORS.length],
              content: contentLines.join('\n').trim(),
              createdAt: baseTime,
              updatedAt: baseTime,
              archived: false,
              parentId: selectedId,
            }
          })
        }
        setNotebooks((p) => [...imported, ...p])
        setSubImportStatus(`${imported.length} sub-caderno(s) importado(s) com sucesso.`)
      } catch {
        setSubImportStatus('Erro ao importar: arquivo inválido.')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  // ── Export ──────────────────────────────────────────────────────────────────

  function openNotebookSettings() {
    setExportSelection(visibleNotebooks.map((n) => n.id))
    setSettingsMode('export')
    setSettingsStatus('')
    setShowSettings(true)
    setShelfEdit(false)
  }

  function toggleExportSelection(id) {
    setExportSelection((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id])
  }

  function doExport() {
    const toExport = notebooks.filter((n) => exportSelection.includes(n.id))
    if (toExport.length === 0) { setSettingsStatus('Selecione ao menos um caderno.'); return }

    if (exportFormat === 'json') {
      const data = JSON.stringify(toExport, null, 2)
      download(data, 'cadernos-materias.json', 'application/json')
    } else {
      const md = toExport.map((n) => {
        const tags = n.tag ? `\nTags: ${n.tag}` : ''
        const desc = n.description ? `\n> ${n.description}` : ''
        return `# ${n.name}${tags}${desc}\n\n${n.content ?? ''}`
      }).join('\n\n---\n\n')
      download(md, 'cadernos-materias.md', 'text/markdown')
    }

    setSettingsStatus(`${toExport.length} caderno(s) exportado(s).`)
  }

  function download(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  // ── Import ──────────────────────────────────────────────────────────────────

  function openImport() {
    setIoMode('import')
    setIoStatus('')
    setIoOpen(true)
  }

  function triggerImportFile() {
    importInputRef.current?.click()
  }

  function handleImportFile(e) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target.result
      try {
        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(text)
          const arr = Array.isArray(parsed) ? parsed : [parsed]
          const baseTime = Date.now()
          const imported = arr.map((item, i) => ({
            id: baseTime + i * 1000,
            name: item.name ?? `Caderno importado ${i + 1}`,
            description: item.description ?? '',
            tag: item.tag ?? '',
            color: COLORS.includes(item.color) ? item.color : COLORS[i % COLORS.length],
            content: item.content ?? '',
            createdAt: item.createdAt ?? baseTime,
            updatedAt: Date.now(),
            archived: false
          }))
          setNotebooks((p) => [...imported, ...p])
          setSettingsStatus(`${imported.length} caderno(s) importado(s).`)
        } else {
          // Markdown: treat each "# Título" block as one notebook
          const sections = text.split(/\n---\n/)
          const baseTime = Date.now()
          const imported = sections.map((section, i) => {
            const lines = section.trim().split('\n')
            const titleLine = lines.find((l) => l.startsWith('# '))
            const name = titleLine ? titleLine.replace(/^#\s+/, '') : `Caderno importado ${i + 1}`
            const tagLine = lines.find((l) => l.startsWith('Tags:'))
            const tag = tagLine ? tagLine.replace(/^Tags:\s*/, '') : ''
            const contentLines = lines.filter((l) => !l.startsWith('# ') && !l.startsWith('Tags:') && !l.startsWith('> '))
            return {
              id: baseTime + i * 1000,
              name,
              description: '',
              tag,
              color: COLORS[i % COLORS.length],
              content: contentLines.join('\n').trim(),
              createdAt: baseTime,
              updatedAt: baseTime,
              archived: false,
            }
          })
          setNotebooks((p) => [...imported, ...p])
          setSettingsStatus(`${imported.length} caderno(s) importado(s) do Markdown.`)
        }
      } catch {
        setIoStatus('Erro ao importar: arquivo inválido.')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* hidden file input for import */}
      <input
        ref={importInputRef}
        type="file"
        accept=".json,.md,.txt"
        style={{ display: 'none' }}
        onChange={handleImportFile}
      />

      {/* ── Summary cards ── */}
      <section className="summary-cards-grid">
        <SummaryCard
          className="summary-card--cadernos-total"
          title="Cadernos"
          value={visibleNotebooks.length}
          description="Coleções ativas para organizar suas matérias"
          icon={<svg viewBox="0 0 24 24" fill="none" role="img"><path d="M5.5 6.5A2.5 2.5 0 0 1 8 4h10.5v14.25A1.75 1.75 0 0 1 16.75 20H8A2.5 2.5 0 0 0 5.5 22V6.5Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" /><path d="M8.5 8.25h7M8.5 11.75h7M8.5 15.25h4.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>}
        />
        <SummaryCard
          className="summary-card--cadernos-ativos"
          title="Cadernos ativos"
          value={activeBooks}
          description="Cadernos que já possuem conteúdo"
          icon={<svg viewBox="0 0 24 24" fill="none" role="img"><path d="m6 12.5 3.5 3.5L18 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" stroke="currentColor" strokeWidth="1.7" /></svg>}
        />
        <SummaryCard
          title="Caracteres"
          value={totalChars.toLocaleString('pt-BR')}
          description="Total escrito em todos os cadernos"
          icon={<svg viewBox="0 0 24 24" fill="none" role="img"><path d="M4 6h16M4 10h16M4 14h10M4 18h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>}
        />
      </section>

      {/* ── Library view ── */}
      {view === 'library' ? <section className="notebooks-library-layout"><Card><section className="panel-section">
        <div className="notebooks-library-header">
          <div><h2 className="section-title">Estante de cadernos</h2><p className="flashcards-helper">Abra um caderno para escrever ou ative a edição da estante para alterar os volumes existentes.</p></div>
          <div className="notebooks-library-actions">
            <button type="button" className={`plan-action-btn${shelfEdit ? ' is-active' : ''}`} onClick={() => setShelfEdit((p) => !p)}>{shelfEdit ? 'Concluir edição' : 'Editar estante'}</button>
            <button type="button" className={`header-button header-button-secondary notebook-icon-action-button${showArchivedShelf ? ' is-active' : ''}`} onClick={() => { setShowArchivedShelf(true); setShelfEdit(false) }} aria-label="Ver cadernos arquivados" title="Ver cadernos arquivados"><span className="notebook-inline-icon"><ArchiveIcon /></span></button>
            <button type="button" className="header-button header-button-secondary notebook-shelf-settings-button" onClick={openNotebookSettings}><span className="notebook-inline-icon"><SettingsIcon /></span><span>Configurações</span></button>
          </div>
        </div>

        <div className="notebooks-shelf">
          {rootNotebooks.map((n) => (
            <article key={n.id} className="notebook-book-shell">
              {shelfEdit ? <div className="notebook-book-card-actions">
                <button type="button" className="notebook-book-card-action notebook-book-card-action-delete" onClick={() => deleteNotebookById(n.id, n.name)} aria-label={`Excluir o caderno ${n.name}`} title="Excluir caderno"><TrashIcon /></button>
                <button type="button" className="notebook-book-card-action" onClick={() => toggleArchive(n.id, !n.archived)} aria-label={n.archived ? `Desarquivar o caderno ${n.name}` : `Arquivar o caderno ${n.name}`} title={n.archived ? 'Desarquivar caderno' : 'Arquivar caderno'}><ArchiveIcon /></button>
              </div> : null}
              <button type="button" className={`notebook-book notebook-book--${n.color}${shelfEdit ? ' notebook-book-draggable is-editing' : ''}`} onClick={() => shelfEdit ? openEditor(n) : openDetail(n.id)}>
                <span className="notebook-book-spine" aria-hidden="true" />
                <span className="notebook-book-topline">{shelfEdit ? 'Editar caderno' : 'Caderno'}</span>
                <strong>{n.name}</strong>
                {splitTags(n.tag).length > 0 ? <div className="notebook-book-tags">{splitTags(n.tag).map((tag) => <span key={tag} className="notebook-book-tag">{tag}</span>)}</div> : null}
                <p>{n.description || 'Toque para abrir este caderno e começar a escrever.'}</p>
                <div className="notebook-book-meta">
                  <span>{(n.content?.length ?? 0).toLocaleString('pt-BR')} caracteres</span>
                  <span>Editado em {fmt(n.updatedAt)}</span>
                </div>
              </button>
            </article>
          ))}
          <button type="button" className="notebook-book notebook-book-add" onClick={() => { setView('create'); setShelfEdit(false) }}>
            <span className="notebook-book-plus" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false" aria-hidden="true"><path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
            <strong>Novo caderno</strong><p>Adicione outro volume ao final da estante e personalize cor, tag e descrição.</p>
          </button>
        </div>
        {rootNotebooks.length === 0 ? <p className="empty-message">Sua estante ainda está vazia. Use o caderno com + para criar o primeiro.</p> : null}
      </section></Card></section> : null}

      {/* ── Create view ── */}
      {view === 'create' ? <section className="notebook-page-layout"><Card><section className="panel-section">
        <div className="notebook-page-header"><div>
          <button type="button" className="notebook-back-button" onClick={goLibrary}><span className="notebook-inline-icon"><ArrowLeftIcon /></span><span>Voltar para a estante</span></button>
          <h2 className="section-title">Criar novo caderno</h2>
        </div></div>
        <p className="flashcards-helper">Defina a identidade visual e o contexto do caderno antes de começar a escrever.</p>
        <div className="split-grid notebooks-layout">
          <form className="flashcards-form" onSubmit={createBook}>
            <div className="notebook-edit-grid">
              <div className="plan-field-group"><label className="plan-field-label" htmlFor="snb-name">Nome do caderno</label><input id="snb-name" className="subject-input" type="text" placeholder="Ex: Matemática, Português, História..." value={bookForm.name} onChange={(e) => setBookForm((p) => ({ ...p, name: e.target.value }))} /></div>
              <div className="plan-field-group"><label className="plan-field-label" htmlFor="snb-tag">Tag do caderno</label><input id="snb-tag" className="subject-input" type="text" placeholder="Ex: ENEM; Reta final" value={bookForm.tag} onChange={(e) => setBookForm((p) => ({ ...p, tag: e.target.value }))} /></div>
            </div>
            <div className="plan-field-group"><label className="plan-field-label" htmlFor="snb-desc">Descrição</label><textarea id="snb-desc" className="subject-input notebook-description-input" placeholder="Descreva o conteúdo do caderno..." value={bookForm.description} onChange={(e) => setBookForm((p) => ({ ...p, description: e.target.value }))} /></div>
            <div className="plan-field-group"><span className="plan-field-label">Cor principal</span><div className="notebook-color-picker">{COLORS.map((color) => <button key={color} type="button" className={`notebook-color-chip notebook-color-chip--${color}${bookForm.color === color ? ' is-active' : ''}`} onClick={() => setBookForm((p) => ({ ...p, color }))}><span>{color}</span></button>)}</div></div>
            <div className="flashcards-actions"><button type="submit" className="subject-add-button">Criar caderno</button><button type="button" className="header-button header-button-secondary" onClick={goLibrary}>Cancelar</button></div>
          </form>
          <div className="notebook-preview-panel">
            <span className="notebook-book-topline">Prévia do caderno</span>
            <div className={`notebook-book notebook-book-preview notebook-book--${bookForm.color}`}>
              <span className="notebook-book-spine" aria-hidden="true" />
              <strong>{bookForm.name.trim() || 'Seu próximo caderno'}</strong>
              {splitTags(bookForm.tag).length > 0 ? <div className="notebook-book-tags">{splitTags(bookForm.tag).map((tag) => <span key={tag} className="notebook-book-tag">{tag}</span>)}</div> : null}
              <p>{bookForm.description.trim() || 'A descrição aparece aqui para você validar rapidamente como ele ficará na estante.'}</p>
              <div className="notebook-book-meta"><span>Criado em {fmt(Date.now())}</span></div>
            </div>
          </div>
        </div>
      </section></Card></section> : null}

      {/* ── Detail / Editor view ── */}
      {view === 'detail' && selected ? <section className="notebook-page-layout">
        <Card><section className="panel-section">
          <div className={`notebook-detail-banner notebook-detail-banner--${selected.color}`} aria-hidden="true" />
          <div className="notebook-page-header">
            <div>
              <button type="button" className="notebook-back-button" onClick={goBack}><span className="notebook-inline-icon"><ArrowLeftIcon /></span><span>{navStack.length > 0 ? `Voltar para ${notebooks.find(n => n.id === navStack.at(-1))?.name ?? 'caderno anterior'}` : 'Voltar para a estante'}</span></button>
              <div className="notebook-title-row">
                <h2 className="section-title">{selected.name}</h2>
                {splitTags(selected.tag).length > 0 ? <div className="notebook-title-tags">{splitTags(selected.tag).map((tag) => <span key={tag} className="notebook-title-tag">{tag}</span>)}</div> : null}
              </div>
              <p className="flashcards-helper">{selected.description || 'Escreva seus resumos, anotações e conteúdo da matéria abaixo.'}</p>
            </div>
            <div className="notebook-page-actions">
              {isContentEditing
                ? <button type="button" className="subject-add-button notebook-train-button" onClick={saveContent} disabled={contentDraft === (selected.content ?? '')}><span className="notebook-inline-icon"><PencilIcon /></span><span>{contentSaved ? '✓ Salvo' : 'Salvar alterações'}</span></button>
                : <button type="button" className="subject-add-button notebook-train-button" onClick={startContentEdit}><span className="notebook-inline-icon"><PencilIcon /></span><span>Fazer anotação no caderno</span></button>}
              <button type="button" className="header-button header-button-secondary notebook-report-button" onClick={() => openEditor(selected)}><span className="notebook-inline-icon"><PencilIcon /></span><span>Editar caderno</span></button>
              {!selected.parentId && <button type="button" className="header-button header-button-secondary notebook-icon-action-button" onClick={openSubNotebookForm} title="Novo sub-caderno" aria-label="Novo sub-caderno"><span className="notebook-inline-icon"><PlusIcon /></span></button>}
              <button type="button" className="header-button header-button-secondary notebook-icon-action-button" onClick={() => { setExportSelection([selected.id]); setSettingsMode('export'); setSettingsStatus(''); setShowSettings(true) }} title="Exportar este caderno" aria-label="Exportar este caderno"><span className="notebook-inline-icon"><ExportIcon /></span></button>
              <button type="button" className="header-button header-button-secondary notebook-icon-action-button" onClick={() => toggleArchive(selected.id, true)} title="Arquivar caderno" aria-label="Arquivar caderno"><span className="notebook-inline-icon"><ArchiveIcon /></span></button>
            </div>
          </div>
        </section></Card>

        {isContentEditing && <Card><section className="panel-section">
          <div className="notebook-section-heading">
            <div><h3 className="section-title">Conteúdo do caderno</h3><p className="flashcards-helper">Edite suas anotações abaixo.</p></div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.84rem', whiteSpace: 'nowrap' }}>{`${contentDraft.length.toLocaleString('pt-BR')} chars · ${contentDraft.split(/\s+/).filter(Boolean).length.toLocaleString('pt-BR')} palavras`}</div>
          </div>
          <textarea
            className="subject-input notebook-textarea-lg"
            style={{ width: '100%', minHeight: '420px', resize: 'vertical', fontFamily: 'inherit' }}
            value={contentDraft}
            onChange={(e) => { setContentDraft(e.target.value); setContentSaved(false) }}
            placeholder="Escreva aqui o conteúdo da matéria..."
            spellCheck
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
            <button type="button" className="header-button header-button-secondary" onClick={cancelContentEdit}>Cancelar edição</button>
            <button type="button" className="subject-add-button" onClick={saveContent} disabled={contentDraft === (selected.content ?? '')}>{contentSaved ? '✓ Salvo' : 'Salvar alterações'}</button>
          </div>
        </section></Card>}

        {selected.parentId ? (
          <Card><section className="panel-section">
            <div className="notebook-section-heading">
              <div><h3 className="section-title">Tópicos</h3><p className="flashcards-helper">Adicione tópicos com título e conteúdo para organizar este sub-caderno.</p></div>
              {!showTopicForm && !selectedTopicId && <button type="button" className="plan-action-btn" onClick={() => setShowTopicForm(true)}><span className="notebook-inline-icon"><PlusIcon /></span><span>Novo tópico</span></button>}
            </div>

            {showTopicForm && (
              <form className="flashcards-form" onSubmit={createTopic} style={{ marginBottom: '20px' }}>
                <div className="plan-field-group"><label className="plan-field-label" htmlFor="topic-title">Título do tópico</label><input id="topic-title" className="subject-input" type="text" placeholder="Ex: Introdução, Conceitos básicos..." value={topicForm.title} onChange={(e) => setTopicForm((p) => ({ ...p, title: e.target.value }))} autoFocus /></div>
                <div className="plan-field-group"><label className="plan-field-label" htmlFor="topic-content">Conteúdo</label><textarea id="topic-content" className="subject-input notebook-textarea-md" placeholder="Escreva o conteúdo do tópico..." value={topicForm.content} onChange={(e) => setTopicForm((p) => ({ ...p, content: e.target.value }))} /></div>
                <div className="flashcards-actions"><button type="submit" className="subject-add-button">Adicionar tópico</button><button type="button" className="header-button header-button-secondary" onClick={() => { setShowTopicForm(false); setTopicForm({ title: '', content: '' }) }}>Cancelar</button></div>
              </form>
            )}

            {selectedTopic ? (
              <div className="panel-section" style={{ background: 'var(--surface-raised, rgba(255,255,255,0.04))', borderRadius: '10px', marginTop: showTopicForm ? '8px' : '0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
                  <button type="button" className="header-button header-button-secondary" onClick={closeTopic}><span className="notebook-inline-icon"><ArrowLeftIcon /></span><span>Voltar para tópicos</span></button>
                  <button type="button" className="header-button header-button-secondary" onClick={() => deleteTopic(selectedTopic.id)}><span className="notebook-inline-icon"><TrashIcon /></span><span>Excluir tópico</span></button>
                </div>
                <div className="plan-field-group">
                  <label className="plan-field-label" htmlFor="topic-open-title">Título do tópico</label>
                  <input id="topic-open-title" className="subject-input" value={editingTopicForm.title} onChange={(e) => setEditingTopicForm((p) => ({ ...p, title: e.target.value }))} />
                </div>
                <div className="plan-field-group">
                  <label className="plan-field-label" htmlFor="topic-open-content">Conteúdo do tópico</label>
                  <textarea id="topic-open-content" className="subject-input notebook-textarea-lg" style={{ width: '100%', minHeight: '320px', resize: 'vertical', fontFamily: 'inherit' }} value={editingTopicForm.content} onChange={(e) => setEditingTopicForm((p) => ({ ...p, content: e.target.value }))} placeholder="Escreva o conteúdo do tópico..." spellCheck />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button type="button" className="header-button header-button-secondary" onClick={closeTopic}>Fechar</button>
                  <button type="button" className="subject-add-button" onClick={() => saveTopic(selectedTopic.id)}>{topicSaved ? '✓ Salvo' : 'Salvar tópico'}</button>
                </div>
              </div>
            ) : null}

            {!selectedTopic && (selected.topics ?? []).length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: showTopicForm ? '8px' : '0' }}>
                {(selected.topics ?? []).map((topic) => (
                  <button key={topic.id} type="button" className="panel-section" onClick={() => openTopic(topic)} style={{ background: 'var(--surface-raised, rgba(255,255,255,0.04))', borderRadius: '10px', border: '1px solid var(--border-soft, rgba(255,255,255,0.12))', padding: '14px', textAlign: 'left', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                      <strong style={{ fontSize: '1rem' }}>{topic.title}</strong>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Abrir</span>
                    </div>
                    {topic.content && <p style={{ marginTop: '8px', fontSize: '0.92rem', color: 'var(--text-muted)', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{topic.content.slice(0, 180)}{topic.content.length > 180 ? '...' : ''}</p>}
                  </button>
                ))}
              </div>
            ) : null}

            {!selectedTopic && (selected.topics ?? []).length === 0 && !showTopicForm ? <p className="empty-message" style={{ marginTop: '8px' }}>Nenhum tópico ainda. Clique em "Novo tópico" para adicionar.</p> : null}
          </section></Card>
        ) : (
          <Card><section className="panel-section" ref={subSectionRef}>
          <input ref={subImportInputRef} type="file" accept=".json,.md,.txt" style={{ display: 'none' }} onChange={handleSubImportFile} />
          <div className="notebook-section-heading">
            <div><h3 className="section-title">Sub-cadernos</h3><p className="flashcards-helper">Organize subcapítulos e temas dentro deste caderno.</p></div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {!showSubForm && !subShelfEdit && <button type="button" className="header-button header-button-secondary" onClick={() => { setSubImportStatus(''); subImportInputRef.current?.click() }}><span className="notebook-inline-icon"><ImportIcon /></span><span>Importar</span></button>}
              {!showSubForm && !subShelfEdit && <button type="button" className="plan-action-btn" onClick={openSubNotebookForm}><span className="notebook-inline-icon"><PlusIcon /></span><span>Novo sub-caderno</span></button>}
              {subNotebooks.length > 0 && <button type="button" className={`plan-action-btn${subShelfEdit ? ' is-active' : ''}`} onClick={() => setSubShelfEdit((p) => !p)}>{subShelfEdit ? 'Concluir edição' : 'Editar sub-cadernos'}</button>}
            </div>
          </div>
          {subImportStatus && <p style={{ fontSize: '0.84rem', color: subImportStatus.startsWith('Erro') ? 'var(--danger, #e05)' : 'var(--accent-strong)', marginBottom: '8px' }}>{subImportStatus}</p>}

          {showSubForm && (
            <form className="flashcards-form" onSubmit={createSubBook} style={{ marginBottom: '20px' }}>
              <div className="notebook-edit-grid">
                <div className="plan-field-group"><label className="plan-field-label" htmlFor="sub-name">Nome do sub-caderno</label><input id="sub-name" className="subject-input" type="text" placeholder="Ex: Capítulo 1, Tópico A..." value={subForm.name} onChange={(e) => setSubForm((p) => ({ ...p, name: e.target.value }))} autoFocus /></div>
                <div className="plan-field-group"><label className="plan-field-label" htmlFor="sub-tag">Tag</label><input id="sub-tag" className="subject-input" type="text" placeholder="Ex: Importante" value={subForm.tag} onChange={(e) => setSubForm((p) => ({ ...p, tag: e.target.value }))} /></div>
              </div>
              <div className="plan-field-group"><label className="plan-field-label" htmlFor="sub-desc">Descrição</label><textarea id="sub-desc" className="subject-input notebook-description-input" placeholder="Descreva o conteúdo..." value={subForm.description} onChange={(e) => setSubForm((p) => ({ ...p, description: e.target.value }))} /></div>
              <div className="plan-field-group"><span className="plan-field-label">Cor</span><div className="notebook-color-picker">{COLORS.map((color) => <button key={color} type="button" className={`notebook-color-chip notebook-color-chip--${color}${subForm.color === color ? ' is-active' : ''}`} onClick={() => setSubForm((p) => ({ ...p, color }))}><span>{color}</span></button>)}</div></div>
              <div className="flashcards-actions"><button type="submit" className="subject-add-button">Criar sub-caderno</button><button type="button" className="header-button header-button-secondary" onClick={() => { setShowSubForm(false); setSubForm(emptyNotebook()) }}>Cancelar</button></div>
            </form>
          )}

          {subNotebooks.length > 0 ? (
            <div className="notebooks-shelf" style={{ marginTop: showSubForm ? '8px' : '0' }}>
              {subNotebooks.map((sub) => (
                <article key={sub.id} className="notebook-book-shell">
                  {subShelfEdit && <div className="notebook-book-card-actions">
                    <button type="button" className="notebook-book-card-action notebook-book-card-action-delete" onClick={() => deleteNotebookById(sub.id, sub.name)} aria-label={`Excluir ${sub.name}`} title="Excluir sub-caderno"><TrashIcon /></button>
                    <button type="button" className="notebook-book-card-action" onClick={() => toggleArchive(sub.id, true)} aria-label={`Arquivar ${sub.name}`} title="Arquivar sub-caderno"><ArchiveIcon /></button>
                  </div>}
                  <button type="button" className={`notebook-book notebook-book--${sub.color}${subShelfEdit ? ' notebook-book-draggable is-editing' : ''}`} onClick={() => subShelfEdit ? openEditor(sub) : openDetail(sub.id)}>
                    <span className="notebook-book-spine" aria-hidden="true" />
                    <span className="notebook-book-topline">{subShelfEdit ? 'Editar sub-caderno' : 'Sub-caderno'}</span>
                    <strong>{sub.name}</strong>
                    {splitTags(sub.tag).length > 0 && <div className="notebook-book-tags">{splitTags(sub.tag).map((tag) => <span key={tag} className="notebook-book-tag">{tag}</span>)}</div>}
                    <p>{sub.description || 'Abrir sub-caderno.'}</p>
                    <div className="notebook-book-meta"><span>{(sub.content?.length ?? 0).toLocaleString('pt-BR')} chars</span></div>
                  </button>
                </article>
              ))}
            </div>
          ) : null}
          {subNotebooks.length === 0 && !showSubForm && <p className="empty-message" style={{ marginTop: '8px' }}>Nenhum sub-caderno ainda. Clique em "Novo sub-caderno" para criar.</p>}
        </section></Card>
        )}
      </section> : null}

      {/* ── Edit modal ── */}
      {editingId ? <div className="plan-modal-overlay" onClick={closeEditor}><div className="plan-modal notebook-edit-modal" role="dialog" aria-modal="true" aria-labelledby="snb-edit-title" onClick={(e) => e.stopPropagation()}>
        <div className="important-date-modal-header"><div><h2 id="snb-edit-title" className="plan-modal-title">Editar caderno</h2><p className="flashcards-helper">Ajuste os dados visuais e organize melhor sua estante.</p></div><button type="button" className="modal-close-button" onClick={closeEditor} aria-label="Fechar edição do caderno">×</button></div>
        <form className="flashcards-form" onSubmit={saveBook}>
          <div className="notebook-edit-grid">
            <div className="plan-field-group"><label className="plan-field-label" htmlFor="snb-edit-name">Nome do caderno</label><input id="snb-edit-name" className="subject-input" type="text" value={editForm.name} onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))} /></div>
            <div className="plan-field-group"><label className="plan-field-label" htmlFor="snb-edit-tag">Tag do caderno</label><input id="snb-edit-tag" className="subject-input" type="text" placeholder="Ex: Reta final" value={editForm.tag} onChange={(e) => setEditForm((p) => ({ ...p, tag: e.target.value }))} /></div>
          </div>
          <div className="plan-field-group"><label className="plan-field-label" htmlFor="snb-edit-desc">Descrição</label><textarea id="snb-edit-desc" className="subject-input notebook-description-input" value={editForm.description} onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))} /></div>
          <div className="plan-field-group"><span className="plan-field-label">Cor principal</span><div className="notebook-color-picker">{COLORS.map((color) => <button key={color} type="button" className={`notebook-color-chip notebook-color-chip--${color}${editForm.color === color ? ' is-active' : ''}`} onClick={() => setEditForm((p) => ({ ...p, color }))}><span>{color}</span></button>)}</div></div>
          <div className="notebook-edit-actions"><button type="submit" className="subject-add-button">Salvar alterações</button><button type="button" className="header-button header-button-secondary" onClick={closeEditor}>Cancelar</button><button type="button" className="plan-action-btn notebook-delete-btn" onClick={deleteBook}>Excluir caderno</button></div>
        </form>
      </div></div> : null}

      {/* ── Archived modal ── */}
      {showArchivedShelf ? <div className="plan-modal-overlay" onClick={() => setShowArchivedShelf(false)}><div className="plan-modal notebook-archived-modal" role="dialog" aria-modal="true" aria-labelledby="snb-archived-title" onClick={(e) => e.stopPropagation()}>
        <div className="important-date-modal-header"><div><h2 id="snb-archived-title" className="plan-modal-title">Cadernos arquivados</h2><p className="flashcards-helper">Para entrar novamente em um caderno, desarquive-o primeiro.</p></div><button type="button" className="modal-close-button" onClick={() => setShowArchivedShelf(false)} aria-label="Fechar cadernos arquivados">×</button></div>
        <div className="notebook-archived-grid">
          {archivedNotebooks.map((n) => <article key={n.id} className="notebook-book-shell notebook-book-shell-compact">
            <div className="notebook-book-card-actions">
              <button type="button" className="notebook-book-card-action notebook-book-card-action-delete" onClick={() => deleteNotebookById(n.id, n.name)} aria-label={`Excluir o caderno ${n.name}`} title="Excluir caderno"><TrashIcon /></button>
              <button type="button" className="notebook-book-card-action" onClick={() => toggleArchive(n.id, false)} aria-label={`Desarquivar o caderno ${n.name}`} title="Desarquivar caderno"><ArchiveIcon /></button>
            </div>
            <button type="button" className={`notebook-book notebook-book-compact notebook-book--${n.color}`} disabled>
              <span className="notebook-book-spine" aria-hidden="true" />
              <span className="notebook-book-topline">Arquivado</span>
              <strong>{n.name}</strong>
              <div className="notebook-book-meta"><span>{(n.content?.length ?? 0).toLocaleString('pt-BR')} chars</span><span>Desarquive para abrir este caderno.</span></div>
            </button>
          </article>)}
        </div>
        {archivedNotebooks.length === 0 ? <p className="empty-message">Você ainda não arquivou nenhum caderno.</p> : null}
      </div></div> : null}

      {/* ── Settings / IO modal ── */}
      {showSettings ? <div className="plan-modal-overlay" onClick={() => setShowSettings(false)}><div className="plan-modal" role="dialog" aria-modal="true" aria-labelledby="snb-settings-title" onClick={(e) => e.stopPropagation()}>
        <div className="important-date-modal-header"><div><h2 id="snb-settings-title" className="plan-modal-title">Configurações</h2><p className="flashcards-helper">Exporte ou importe seus cadernos de matérias.</p></div><button type="button" className="modal-close-button" onClick={() => setShowSettings(false)} aria-label="Fechar configurações">×</button></div>
        <div className="notebook-settings-mode-switch">
          <button type="button" className={`notebook-settings-mode-button${settingsMode === 'export' ? ' is-active' : ''}`} onClick={() => { setSettingsMode('export'); setSettingsStatus('') }}><span className="notebook-inline-icon"><ExportIcon /></span><span>Exportar</span></button>
          <button type="button" className={`notebook-settings-mode-button${settingsMode === 'import' ? ' is-active' : ''}`} onClick={() => { setSettingsMode('import'); setSettingsStatus('') }}><span className="notebook-inline-icon"><ImportIcon /></span><span>Importar</span></button>
        </div>
        {settingsMode === 'export' ? (
          <div className="notebook-settings-body">
            <div className="notebook-settings-import-card">
              <div><h3 className="section-title">Exportar cadernos de matérias</h3><p className="flashcards-helper">Escolha o formato e quais cadernos entram no arquivo.</p></div>
              <div className="settings-actions">
                <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                  {[{ value: 'json', label: 'JSON' }, { value: 'md', label: 'Markdown (.md)' }].map((opt) => (
                    <label key={opt.value} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.9rem' }}>
                      <input type="radio" name="snb-export-format" value={opt.value} checked={exportFormat === opt.value} onChange={() => setExportFormat(opt.value)} />
                      {opt.label}
                    </label>
                  ))}
                </div>
                <h3 className="section-title">Selecione os cadernos</h3>
                <p className="flashcards-helper">Cadernos marcados serão exportados.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', margin: '12px 0' }}>
                  {visibleNotebooks.map((nb) => (
                    <label key={nb.id} className={`notebook-question-settings-item${exportSelection.includes(nb.id) ? ' is-selected' : ''}`}>
                      <input type="checkbox" checked={exportSelection.includes(nb.id)} onChange={() => toggleExportSelection(nb.id)} />
                      <span>{nb.name}</span>
                    </label>
                  ))}
                </div>
                {settingsStatus && <p className="flashcards-helper" style={{ color: 'var(--accent-strong)' }}>{settingsStatus}</p>}
                <button type="button" className="subject-add-button" onClick={doExport}><span className="notebook-inline-icon"><ExportIcon /></span> Baixar arquivo</button>
              </div>
            </div>
          </div>
        ) : (
          <div className="notebook-settings-body notebook-settings-body-import">
            <div className="notebook-settings-import-card">
              <div><h3 className="section-title">Importar arquivo de cadernos</h3><p className="flashcards-helper">Escolha um arquivo <strong>.json</strong> exportado anteriormente ou <strong>.md</strong> com seções separadas por <code>---</code>. Os cadernos serão adicionados automaticamente.</p></div>
              <div className="settings-actions">
                {settingsStatus && <p className="flashcards-helper" style={{ color: 'var(--accent-strong)', marginBottom: '12px' }}>{settingsStatus}</p>}
                <button type="button" className="subject-add-button" onClick={triggerImportFile}>Selecionar arquivo</button>
              </div>
            </div>
          </div>
        )}
      </div></div> : null}
    </div>
  )
}

export default SubjectNotebooks
