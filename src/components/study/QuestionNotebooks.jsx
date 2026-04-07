import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import SummaryCard from '../ui/SummaryCard'
import Card from '../ui/Card'

const KEY = 'question-notebooks'
const BACKUP_KEY = 'question-notebooks-backup'
const TRAINING_RESUME_KEY = 'question-training-resume'
const DIREITOS_HUMANOS_RESET_KEY = 'question-training-reset-direitos-humanos-v1'
const OPT = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
const COLORS = ['terracota', 'oceano', 'oliva', 'ameixa', 'grafite', 'ambar', 'vinho', 'esmeralda', 'anil']

const emptyNotebook = () => ({ name: '', description: '', tag: '', color: COLORS[0] })
const createEmptyAlternative = () => ({ text: '', comment: '' })
const emptyQuestion = () => ({
  bank: '',
  year: '',
  statement: '',
  supportText: '',
  alternatives: [createEmptyAlternative(), createEmptyAlternative(), createEmptyAlternative(), createEmptyAlternative()],
  correctAlternative: 'A'
})

function fmt(value) {
  try {
    return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
  } catch { return 'Data inválida' }
}

function short(text, len = 150) {
  const v = (text || '').replaceAll(/\s+/g, ' ').trim()
  return v.length <= len ? v : `${v.slice(0, len - 3)}...`
}

function splitTags(tagValue) {
  return (tagValue || '')
    .split(';')
    .map((item) => item.trim())
    .filter(Boolean)
}

function sanitizeNotebookCollection(rawNotebooks) {
  if (!Array.isArray(rawNotebooks)) return []

  const seenIds = new Set()

  return rawNotebooks.reduce((accumulator, item, index) => {
    if (!item || typeof item !== 'object') return accumulator

    const fallbackId = Date.now() + index
    const nextId = Number(item.id)
    const notebookId = Number.isFinite(nextId) ? nextId : fallbackId
    if (seenIds.has(notebookId)) return accumulator
    seenIds.add(notebookId)

    accumulator.push({
      id: notebookId,
      name: item.name ?? 'Caderno sem nome',
      description: item.description ?? '',
      tag: item.tag ?? '',
      color: COLORS.includes(item.color) ? item.color : COLORS[index % COLORS.length],
      createdAt: item.createdAt ?? item.updatedAt ?? Date.now(),
      updatedAt: item.updatedAt ?? item.createdAt ?? Date.now(),
      archived: Boolean(item.archived),
      attempts: Array.isArray(item.attempts) ? item.attempts : [],
      questions: Array.isArray(item.questions) ? item.questions : []
    })

    return accumulator
  }, [])
}

function persistNotebooks(notebooks) {
  try {
    const sanitized = sanitizeNotebookCollection(notebooks)
    localStorage.setItem(KEY, JSON.stringify(sanitized))
    localStorage.setItem(BACKUP_KEY, JSON.stringify(sanitized))
  } catch {
    // Ignore storage write failures and keep in-memory state intact.
  }
}

function resetDireitosHumanosProgressOnce() {
  if (localStorage.getItem(DIREITOS_HUMANOS_RESET_KEY) === 'done') return

  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || '[]')
    if (!Array.isArray(parsed)) return

    const updated = parsed.map((item) => {
      if ((item.name || '').trim().toLowerCase() !== 'direitos humanos') return item

      const orderedQuestions = Array.isArray(item.questions)
        ? [...item.questions].sort((left, right) => (left.createdAt ?? left.id ?? 0) - (right.createdAt ?? right.id ?? 0))
        : []

      return {
        ...item,
        updatedAt: Date.now(),
        attempts: [],
        questions: orderedQuestions.map(({ answerHistory, lastAnswerLabel, lastDifficulty, lastReviewedAt, correctCount, wrongCount, ...question }) => ({
          ...question,
          correctCount: 0,
          wrongCount: 0
        }))
      }
    })

    localStorage.setItem(KEY, JSON.stringify(updated))

    const resumeSessions = JSON.parse(localStorage.getItem(TRAINING_RESUME_KEY) || '{}')
    if (resumeSessions && typeof resumeSessions === 'object') {
      const targetNotebook = updated.find((item) => (item.name || '').trim().toLowerCase() === 'direitos humanos')
      if (targetNotebook) {
        delete resumeSessions[String(targetNotebook.id)]
        localStorage.setItem(TRAINING_RESUME_KEY, JSON.stringify(resumeSessions))
      }
    }

    localStorage.setItem(DIREITOS_HUMANOS_RESET_KEY, 'done')
  } catch {
    // Ignore malformed local data and leave current state untouched.
  }
}

function readStore() {
  try {
    resetDireitosHumanosProgressOnce()
    const parsed = JSON.parse(localStorage.getItem(KEY) || '[]')
    const sanitized = sanitizeNotebookCollection(parsed)
    if (sanitized.length > 0 || !localStorage.getItem(BACKUP_KEY)) {
      persistNotebooks(sanitized)
      return sanitized
    }
  } catch {
    // Fallback to backup below.
  }

  try {
    const backup = JSON.parse(localStorage.getItem(BACKUP_KEY) || '[]')
    const sanitizedBackup = sanitizeNotebookCollection(backup)
    persistNotebooks(sanitizedBackup)
    return sanitizedBackup
  } catch {
    return []
  }
}

function ArrowLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="m14 6-6 6 6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M8 6.5v11l9-5.5-9-5.5Z" fill="currentColor" />
    </svg>
  )
}

function DocumentIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M7 4.75h7.75L19.25 9v10.25A2.75 2.75 0 0 1 16.5 22H7.5A2.75 2.75 0 0 1 4.75 19.25v-11.75A2.75 2.75 0 0 1 7.5 4.75Zm7.25.5v4.5h4.5M8 12h8m-8 3.5h6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M9 4.75h6m-8.5 3h11m-9.5 0 .55 10.2A2 2 0 0 0 10.54 20h2.92a2 2 0 0 0 1.99-2.05L16 7.75M10.5 11v5m3-5v5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ArchiveIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M4 7.5h16v11a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5v-11Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M3 5.5A1.5 1.5 0 0 1 4.5 4h15A1.5 1.5 0 0 1 21 5.5v1A1.5 1.5 0 0 1 19.5 8h-15A1.5 1.5 0 0 1 3 6.5v-1Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M10 12h4"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M12 8.9a3.1 3.1 0 1 0 0 6.2 3.1 3.1 0 0 0 0-6.2Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M19.4 15a1 1 0 0 0 .2 1.1l.1.1a1.2 1.2 0 0 1 0 1.7l-1.5 1.5a1.2 1.2 0 0 1-1.7 0l-.1-.1a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9V20a1.2 1.2 0 0 1-1.2 1.2h-2.2A1.2 1.2 0 0 1 10 20v-.2a1 1 0 0 0-.6-.9 1 1 0 0 0-1.1.2l-.1.1a1.2 1.2 0 0 1-1.7 0L5 17.7a1.2 1.2 0 0 1 0-1.7l.1-.1A1 1 0 0 0 5.3 15a1 1 0 0 0-.9-.6H4.2A1.2 1.2 0 0 1 3 13.2v-2.1A1.2 1.2 0 0 1 4.2 10h.2a1 1 0 0 0 .9-.6 1 1 0 0 0-.2-1.1L5 8.2a1.2 1.2 0 0 1 0-1.7L6.5 5a1.2 1.2 0 0 1 1.7 0l.1.1a1 1 0 0 0 1.1.2 1 1 0 0 0 .6-.9V4.2A1.2 1.2 0 0 1 11.2 3h2.1a1.2 1.2 0 0 1 1.2 1.2v.2a1 1 0 0 0 .6.9 1 1 0 0 0 1.1-.2l.1-.1a1.2 1.2 0 0 1 1.7 0L19 6.5a1.2 1.2 0 0 1 0 1.7l-.1.1a1 1 0 0 0-.2 1.1 1 1 0 0 0 .9.6h.2A1.2 1.2 0 0 1 21 11.2v2.1a1.2 1.2 0 0 1-1.2 1.2h-.2a1 1 0 0 0-.9.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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

function CheckBadgeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="m6.5 12.2 3.4 3.4 7.6-7.6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CommentIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M7.5 5.25h9A3.25 3.25 0 0 1 19.75 8.5v5A3.25 3.25 0 0 1 16.5 16.75H11l-3.8 3.1c-.48.39-1.2.05-1.2-.57v-2.53A3.25 3.25 0 0 1 3.75 13.5v-5A3.25 3.25 0 0 1 7.5 5.25Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function normalizeImportedNotebooks(importedNotebooks) {
  const baseTime = Date.now()

  return importedNotebooks.map((notebook, notebookIndex) => {
    const notebookId = baseTime + notebookIndex * 1000
    const idMap = new Map()
    const questions = Array.isArray(notebook.questions) ? notebook.questions : []

    const normalizedQuestions = questions.map((question, questionIndex) => {
      const nextQuestionId = notebookId + questionIndex + 1
      idMap.set(question.id, nextQuestionId)

      return {
        ...question,
        id: nextQuestionId,
        correctCount: question.correctCount ?? 0,
        wrongCount: question.wrongCount ?? 0,
        alternatives: Array.isArray(question.alternatives) ? question.alternatives : []
      }
    })

    const attempts = (Array.isArray(notebook.attempts) ? notebook.attempts : []).map((attempt, attemptIndex) => ({
      ...attempt,
      id: notebookId + 500 + attemptIndex,
      number: attemptIndex + 1,
      questions: Array.isArray(attempt.questions)
        ? attempt.questions.map((question) => ({
            ...question,
            questionId: idMap.get(question.questionId) ?? question.questionId
          }))
        : []
    }))

    return {
      id: notebookId,
      name: notebook.name ?? `Caderno importado ${notebookIndex + 1}`,
      description: notebook.description ?? '',
      tag: notebook.tag ?? '',
      color: notebook.color ?? COLORS[notebookIndex % COLORS.length],
      createdAt: notebook.createdAt ?? notebook.updatedAt ?? baseTime,
      updatedAt: Date.now(),
      attempts,
      questions: normalizedQuestions
    }
  })
}

function normalizeImportedQuestions(importedQuestions) {
  const baseTime = Date.now()

  return importedQuestions.map((question, index) => ({
    id: baseTime + index + 1,
    bank: question.bank ?? '',
    year: question.year ?? '',
    statement: question.statement ?? '',
    supportText: question.supportText ?? '',
    correctAlternative: question.correctAlternative ?? 'A',
    correctCount: 0,
    wrongCount: 0,
    alternatives: Array.isArray(question.alternatives)
      ? question.alternatives.map((alternative, alternativeIndex) => ({
          label: OPT[alternativeIndex],
          text: alternative.text ?? '',
          comment: alternative.comment ?? ''
        }))
      : [],
    createdAt: baseTime + index + 1
  }))
}

function QuestionNotebooks({ onStartTraining, initialSelectedId }) {
  const importInputRef = useRef(null)
  const [notebooks, setNotebooks] = useState(() => readStore())
  const [showArchivedShelf, setShowArchivedShelf] = useState(false)
  const [view, setView] = useState(() => (initialSelectedId ? 'detail' : 'library'))
  const [selectedId, setSelectedId] = useState(() => initialSelectedId ?? null)
  const [shelfEdit, setShelfEdit] = useState(false)
  const [bookForm, setBookForm] = useState(emptyNotebook)
  const [questionForm, setQuestionForm] = useState(emptyQuestion)
  const [questionOpen, setQuestionOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState(emptyNotebook)
  const [editingQuestionId, setEditingQuestionId] = useState(null)
  const [editingQuestionForm, setEditingQuestionForm] = useState(emptyQuestion)
  const [reportOpen, setReportOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settingsContext, setSettingsContext] = useState('library')
  const [settingsMode, setSettingsMode] = useState('export')
  const [exportSelection, setExportSelection] = useState([])
  const [questionExportSelection, setQuestionExportSelection] = useState([])
  const [questionImportSelection, setQuestionImportSelection] = useState([])
  const [includeReportsOnExport, setIncludeReportsOnExport] = useState(true)
  const [settingsStatus, setSettingsStatus] = useState('')
  const [pendingQuestionImport, setPendingQuestionImport] = useState(null)
  const [draggedNotebookId, setDraggedNotebookId] = useState(null)
  const [dragOverNotebookId, setDragOverNotebookId] = useState(null)
  const [draggedQuestionId, setDraggedQuestionId] = useState(null)
  const [dragOverQuestionId, setDragOverQuestionId] = useState(null)
  const [alternativeCommentEditor, setAlternativeCommentEditor] = useState(null)
  const [alternativeCommentDraft, setAlternativeCommentDraft] = useState('')

  useEffect(() => { persistNotebooks(notebooks) }, [notebooks])

  useEffect(() => {
    if (view === 'detail' || view === 'create') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [view, selectedId])

  const visibleNotebooks = useMemo(
    () => notebooks.filter((notebook) => !notebook.archived),
    [notebooks]
  )
  const archivedNotebooks = useMemo(
    () => notebooks.filter((notebook) => notebook.archived),
    [notebooks]
  )
  const selected = useMemo(
    () => notebooks.find((n) => n.id === selectedId && !n.archived) ?? null,
    [notebooks, selectedId]
  )
  const editing = useMemo(() => notebooks.find((n) => n.id === editingId) ?? null, [notebooks, editingId])
  const editingQuestion = useMemo(
    () => selected?.questions.find((q) => q.id === editingQuestionId) ?? null,
    [selected, editingQuestionId]
  )
  const totalQuestions = useMemo(() => notebooks.reduce((t, n) => t + n.questions.length, 0), [notebooks])
  const activeBooks = useMemo(
    () => notebooks.filter((n) => !n.archived && n.questions.length > 0).length,
    [notebooks]
  )
  const selectedAttempts = useMemo(() => selected?.attempts ?? [], [selected])
  const reportStats = useMemo(() => {
    if (!selected || selectedAttempts.length === 0) return null

    const totalQuestionsPerAttempt = selectedAttempts[0]?.totalQuestions ?? selected.questions.length
    const totalCorrect = selectedAttempts.reduce((sum, attempt) => sum + attempt.correctQuestions.length, 0)
    const averageCorrect = selectedAttempts.length ? (totalCorrect / selectedAttempts.length).toFixed(1) : '0.0'
    const bestAttempt = selectedAttempts.reduce((best, attempt) => Math.max(best, attempt.correctQuestions.length), 0)

    return {
      totalAttempts: selectedAttempts.length,
      totalQuestionsPerAttempt,
      averageCorrect,
      bestAttempt,
      lastAttemptAt: selectedAttempts[selectedAttempts.length - 1]?.completedAt ?? null
    }
  }, [selected, selectedAttempts])

  useEffect(() => {
    const shouldLockScroll = Boolean(editing || editingQuestion || reportOpen || settingsOpen)
    const scrollY = window.scrollY
    const previousBodyOverflow = document.body.style.overflow
    const previousBodyOverflowY = document.body.style.overflowY
    const previousBodyPosition = document.body.style.position
    const previousBodyTop = document.body.style.top
    const previousBodyWidth = document.body.style.width
    const previousHtmlOverflow = document.documentElement.style.overflow
    const previousHtmlOverflowY = document.documentElement.style.overflowY
    const previousHtmlOverscroll = document.documentElement.style.overscrollBehavior
    const scrollContainers = Array.from(document.querySelectorAll('.dashboard-layout, .dashboard-content'))
    const previousContainerStyles = scrollContainers.map((element) => ({
      element,
      overflow: element.style.overflow,
      overscrollBehavior: element.style.overscrollBehavior
    }))

    if (shouldLockScroll) {
      document.body.style.overflow = 'hidden'
      document.body.style.overflowY = 'scroll'
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollY}px`
      document.body.style.width = '100%'
      document.documentElement.style.overflow = 'hidden'
      document.documentElement.style.overflowY = 'scroll'
      document.documentElement.style.overscrollBehavior = 'none'
      document.body.classList.add('modal-scroll-locked')
      document.documentElement.classList.add('modal-scroll-locked')
      previousContainerStyles.forEach(({ element }) => {
        element.style.overflow = 'hidden'
        element.style.overscrollBehavior = 'none'
      })
    }

    return () => {
      document.body.style.overflow = previousBodyOverflow
      document.body.style.overflowY = previousBodyOverflowY
      document.body.style.position = previousBodyPosition
      document.body.style.top = previousBodyTop
      document.body.style.width = previousBodyWidth
      document.documentElement.style.overflow = previousHtmlOverflow
      document.documentElement.style.overflowY = previousHtmlOverflowY
      document.documentElement.style.overscrollBehavior = previousHtmlOverscroll
      document.body.classList.remove('modal-scroll-locked')
      document.documentElement.classList.remove('modal-scroll-locked')
      previousContainerStyles.forEach(({ element, overflow, overscrollBehavior }) => {
        element.style.overflow = overflow
        element.style.overscrollBehavior = overscrollBehavior
      })
      if (shouldLockScroll) window.scrollTo(0, scrollY)
    }
  }, [editing, editingQuestion, reportOpen, settingsOpen])

  useLayoutEffect(() => {
    if (!initialSelectedId) return
    const notebookExists = notebooks.some((notebook) => notebook.id === initialSelectedId && !notebook.archived)
    if (!notebookExists) return
    setSelectedId(initialSelectedId)
    setView('detail')
    setQuestionOpen(false)
    setShelfEdit(false)
  }, [initialSelectedId])

  const goLibrary = () => { setView('library'); setSelectedId(null); setQuestionOpen(false); setQuestionForm(emptyQuestion()); setReportOpen(false) }
  const openDetail = (id) => { setSelectedId(id); setView('detail'); setQuestionOpen(false); setShelfEdit(false); setReportOpen(false); setShowArchivedShelf(false) }
  const openEditor = (book) => { setEditingId(book.id); setEditForm({ name: book.name, description: book.description, tag: book.tag, color: book.color }) }
  const closeEditor = () => { setEditingId(null); setEditForm(emptyNotebook()) }
  const closeQuestionEditor = () => { setEditingQuestionId(null); setEditingQuestionForm(emptyQuestion()); setAlternativeCommentEditor(null); setAlternativeCommentDraft('') }

  function getFormAlternative(formType, index) {
    const form = formType === 'edit' ? editingQuestionForm : questionForm
    return form.alternatives[index] ?? createEmptyAlternative()
  }

  function openAlternativeCommentEditor(formType, index) {
    const alternative = getFormAlternative(formType, index)
    setAlternativeCommentEditor({ formType, index })
    setAlternativeCommentDraft(alternative.comment || '')
  }

  function closeAlternativeCommentEditor() {
    setAlternativeCommentEditor(null)
    setAlternativeCommentDraft('')
  }

  function updateAlternativeComment(formType, index, comment) {
    if (formType === 'edit') {
      setEditingQuestionForm((previous) => ({
        ...previous,
        alternatives: previous.alternatives.map((alternative, alternativeIndex) =>
          alternativeIndex === index ? { ...alternative, comment } : alternative
        )
      }))
      return
    }

    setQuestionForm((previous) => ({
      ...previous,
      alternatives: previous.alternatives.map((alternative, alternativeIndex) =>
        alternativeIndex === index ? { ...alternative, comment } : alternative
      )
    }))
  }

  function saveAlternativeComment() {
    if (!alternativeCommentEditor) return
    updateAlternativeComment(alternativeCommentEditor.formType, alternativeCommentEditor.index, alternativeCommentDraft)
    closeAlternativeCommentEditor()
  }

  function openQuestionEditor(question) {
    setEditingQuestionId(question.id)
    setEditingQuestionForm({
      bank: question.bank,
      year: question.year,
      statement: question.statement,
      supportText: question.supportText || '',
      alternatives: question.alternatives.map((item) => ({ text: item.text, comment: item.comment || '' })),
      correctAlternative: question.correctAlternative
    })
  }

  function createBook(e) {
    e.preventDefault()
    const name = bookForm.name.trim()
    if (!name) return alert('Informe um nome para o caderno.')
    const now = Date.now()
    const book = { id: now, name, description: bookForm.description.trim(), tag: bookForm.tag.trim(), color: bookForm.color, createdAt: now, updatedAt: now, attempts: [], questions: [] }
    setNotebooks((p) => [book, ...p]); setBookForm(emptyNotebook()); setSelectedId(book.id); setView('detail')
  }

  function saveBook(e) {
    e.preventDefault()
    if (!editing) return
    const name = editForm.name.trim()
    if (!name) return alert('Informe um nome para o caderno.')
    const now = Date.now()
    setNotebooks((p) => p.map((n) => n.id === editing.id ? { ...n, name, description: editForm.description.trim(), tag: editForm.tag.trim(), color: editForm.color, updatedAt: now } : n))
    closeEditor()
  }

  function deleteNotebookById(notebookId, notebookName) {
    if (!window.confirm(`Excluir o caderno "${notebookName}"?`)) return
    setNotebooks((previous) => previous.filter((notebook) => notebook.id !== notebookId))
    if (selectedId === notebookId) goLibrary()
    if (editingId === notebookId) closeEditor()
  }

  function deleteBook() {
    if (!editing) return
    deleteNotebookById(editing.id, editing.name)
  }

  function toggleNotebookArchive(notebookId, shouldArchive) {
    setNotebooks((previous) => previous.map((notebook) => (
      notebook.id === notebookId
        ? { ...notebook, archived: shouldArchive, updatedAt: Date.now() }
        : notebook
    )))

    if (shouldArchive && selectedId === notebookId) goLibrary()
    if (editingId === notebookId) closeEditor()
  }

  function addAlt() { setQuestionForm((p) => ({ ...p, alternatives: [...p.alternatives, createEmptyAlternative()] })) }
  function removeAlt(i) {
    setQuestionForm((p) => {
      if (p.alternatives.length <= 2) return p
      const alternatives = p.alternatives.filter((_, idx) => idx !== i)
      const correctAlternative = OPT[Math.max(0, Math.min(OPT.indexOf(p.correctAlternative), alternatives.length - 1))]
      return { ...p, alternatives, correctAlternative }
    })
    if (alternativeCommentEditor?.formType === 'create') {
      if (alternativeCommentEditor.index === i) closeAlternativeCommentEditor()
      else if (alternativeCommentEditor.index > i) setAlternativeCommentEditor((previous) => ({ ...previous, index: previous.index - 1 }))
    }
  }
  function changeAlt(i, value) {
    setQuestionForm((p) => ({
      ...p,
      alternatives: p.alternatives.map((alternative, idx) => idx === i ? { ...alternative, text: value } : alternative)
    }))
  }

  function autoResizeTextarea(event) {
    event.currentTarget.style.height = 'auto'
    event.currentTarget.style.height = `${event.currentTarget.scrollHeight}px`
  }

  function addQuestion(e) {
    e.preventDefault()
    if (!selected) return
    const statement = questionForm.statement.trim()
    const alternatives = questionForm.alternatives
      .map((alternative, index) => ({ ...alternative, text: alternative.text.trim(), label: OPT[index] }))
      .filter((alternative) => alternative.text)
    if (!questionForm.bank.trim() || !questionForm.year.trim()) return alert('Informe banca e ano da questão.')
    if (!statement) return alert('Escreva o enunciado da questão.')
    if (alternatives.length < 2) return alert('Adicione pelo menos duas alternativas preenchidas.')
    if (OPT.indexOf(questionForm.correctAlternative) >= alternatives.length) return alert('Escolha uma alternativa correta válida.')
    const now = Date.now()
    const question = {
      id: now,
      bank: questionForm.bank.trim(),
      year: questionForm.year.trim(),
      statement,
      supportText: questionForm.supportText.trim(),
      correctAlternative: questionForm.correctAlternative,
      correctCount: 0,
      wrongCount: 0,
      alternatives: alternatives.map((alternative) => ({
        label: alternative.label,
        text: alternative.text,
        comment: alternative.comment.trim()
      })),
      createdAt: now
    }
    setNotebooks((p) => p.map((n) => n.id === selected.id ? { ...n, updatedAt: now, questions: [...n.questions, question] } : n))
    setQuestionForm(emptyQuestion()); setQuestionOpen(false); closeAlternativeCommentEditor()
  }

  function editQuestionAlt(i, value) {
    setEditingQuestionForm((p) => ({
      ...p,
      alternatives: p.alternatives.map((alternative, idx) => idx === i ? { ...alternative, text: value } : alternative)
    }))
  }

  function addQuestionEditorAlt() {
    setEditingQuestionForm((p) => ({ ...p, alternatives: [...p.alternatives, createEmptyAlternative()] }))
  }

  function removeQuestionEditorAlt(i) {
    setEditingQuestionForm((p) => {
      if (p.alternatives.length <= 2) return p
      const alternatives = p.alternatives.filter((_, idx) => idx !== i)
      const correctAlternative = OPT[Math.max(0, Math.min(OPT.indexOf(p.correctAlternative), alternatives.length - 1))]
      return { ...p, alternatives, correctAlternative }
    })
    if (alternativeCommentEditor?.formType === 'edit') {
      if (alternativeCommentEditor.index === i) closeAlternativeCommentEditor()
      else if (alternativeCommentEditor.index > i) setAlternativeCommentEditor((previous) => ({ ...previous, index: previous.index - 1 }))
    }
  }

  function saveQuestionEdit(e) {
    e.preventDefault()
    if (!selected || !editingQuestion) return
    const statement = editingQuestionForm.statement.trim()
    const alternatives = editingQuestionForm.alternatives
      .map((alternative, index) => ({ ...alternative, text: alternative.text.trim(), label: OPT[index] }))
      .filter((alternative) => alternative.text)
    if (!editingQuestionForm.bank.trim() || !editingQuestionForm.year.trim()) return alert('Informe banca e ano da questão.')
    if (!statement) return alert('Escreva o enunciado da questão.')
    if (alternatives.length < 2) return alert('Adicione pelo menos duas alternativas preenchidas.')
    if (OPT.indexOf(editingQuestionForm.correctAlternative) >= alternatives.length) return alert('Escolha uma alternativa correta válida.')
    const now = Date.now()
    setNotebooks((prev) => prev.map((notebook) => notebook.id === selected.id
      ? {
          ...notebook,
          updatedAt: now,
          questions: notebook.questions.map((question) => question.id === editingQuestion.id
            ? {
                ...question,
                bank: editingQuestionForm.bank.trim(),
                year: editingQuestionForm.year.trim(),
                statement,
                supportText: editingQuestionForm.supportText.trim(),
                correctAlternative: editingQuestionForm.correctAlternative,
                correctCount: question.correctCount ?? 0,
                wrongCount: question.wrongCount ?? 0,
                alternatives: alternatives.map((alternative) => ({
                  label: alternative.label,
                  text: alternative.text,
                  comment: alternative.comment.trim()
                }))
              }
            : question)
        }
      : notebook))
    closeQuestionEditor()
  }

  function deleteQuestion() {
    if (!selected || !editingQuestion) return
    if (!window.confirm('Excluir esta questão do caderno?')) return

    setNotebooks((prev) => prev.map((notebook) =>
      notebook.id === selected.id
        ? {
            ...notebook,
            updatedAt: Date.now(),
            questions: notebook.questions.filter((question) => question.id !== editingQuestion.id)
          }
        : notebook
    ))

    closeQuestionEditor()
  }

  function handleQuestionDragStart(questionId) {
    setDraggedQuestionId(questionId)
    setDragOverQuestionId(questionId)
  }

  function handleQuestionDragOver(event, questionId) {
    event.preventDefault()
    if (dragOverQuestionId !== questionId) setDragOverQuestionId(questionId)
  }

  function handleQuestionDragEnd() {
    setDraggedQuestionId(null)
    setDragOverQuestionId(null)
  }

  function handleQuestionDrop(event, targetQuestionId) {
    event.preventDefault()
    if (!selected || !draggedQuestionId || draggedQuestionId === targetQuestionId) {
      handleQuestionDragEnd()
      return
    }

    const draggedIndex = selected.questions.findIndex((question) => question.id === draggedQuestionId)
    const targetIndex = selected.questions.findIndex((question) => question.id === targetQuestionId)

    if (draggedIndex === -1 || targetIndex === -1) {
      handleQuestionDragEnd()
      return
    }

    const reorderedQuestions = [...selected.questions]
    const [movedQuestion] = reorderedQuestions.splice(draggedIndex, 1)
    reorderedQuestions.splice(targetIndex, 0, movedQuestion)

    setNotebooks((prev) => prev.map((notebook) =>
      notebook.id === selected.id
        ? { ...notebook, updatedAt: Date.now(), questions: reorderedQuestions }
        : notebook
    ))

    handleQuestionDragEnd()
  }

  function handleNotebookDragStart(notebookId) {
    setDraggedNotebookId(notebookId)
    setDragOverNotebookId(notebookId)
  }

  function handleNotebookDragOver(event, notebookId) {
    event.preventDefault()
    if (dragOverNotebookId !== notebookId) setDragOverNotebookId(notebookId)
  }

  function handleNotebookDragEnd() {
    setDraggedNotebookId(null)
    setDragOverNotebookId(null)
  }

  function handleNotebookDrop(event, targetNotebookId) {
    event.preventDefault()
    if (!draggedNotebookId || draggedNotebookId === targetNotebookId) {
      handleNotebookDragEnd()
      return
    }

    const sourceNotebooks = showArchivedShelf ? archivedNotebooks : visibleNotebooks
    const draggedIndex = sourceNotebooks.findIndex((notebook) => notebook.id === draggedNotebookId)
    const targetIndex = sourceNotebooks.findIndex((notebook) => notebook.id === targetNotebookId)

    if (draggedIndex === -1 || targetIndex === -1) {
      handleNotebookDragEnd()
      return
    }

    const reorderedVisible = [...sourceNotebooks]
    const [movedNotebook] = reorderedVisible.splice(draggedIndex, 1)
    reorderedVisible.splice(targetIndex, 0, movedNotebook)

    const preserved = notebooks.filter((notebook) => Boolean(notebook.archived) !== showArchivedShelf)
    setNotebooks(showArchivedShelf ? [...preserved, ...reorderedVisible] : [...reorderedVisible, ...preserved])
    handleNotebookDragEnd()
  }

  function openNotebookSettings() {
    setSettingsContext('library')
    setSettingsMode('export')
    setExportSelection([])
    setIncludeReportsOnExport(true)
    setSettingsStatus('')
    setSettingsOpen(true)
  }

  function openSelectedNotebookSettings() {
    if (!selected) return
    setSettingsContext('notebook')
    setSettingsMode('export')
    setSettingsStatus('')
    setPendingQuestionImport(null)
    setQuestionImportSelection([])
    setQuestionExportSelection((selected.questions ?? []).map((question) => question.id))
    setSettingsOpen(true)
  }

  function closeNotebookSettings() {
    setSettingsOpen(false)
    setSettingsStatus('')
    setPendingQuestionImport(null)
    setQuestionImportSelection([])
  }

  function toggleExportSelection(notebookId) {
    setExportSelection((previous) =>
      previous.includes(notebookId)
        ? previous.filter((id) => id !== notebookId)
        : [...previous, notebookId]
    )
  }

  function handleExportNotebooks() {
    const selectedBooks = notebooks.filter((notebook) => exportSelection.includes(notebook.id))
    if (selectedBooks.length === 0) {
      setSettingsStatus('Selecione pelo menos um caderno para exportar.')
      return
    }

    const payload = {
      app: 'study-dashboard',
      type: 'question-notebooks-export',
      version: 1,
      exportedAt: new Date().toISOString(),
      includeReports: includeReportsOnExport,
      notebooks: selectedBooks.map((notebook) => ({
        ...notebook,
        attempts: includeReportsOnExport ? notebook.attempts ?? [] : []
      }))
    }

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `studydash-cadernos-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(url)
    setSettingsStatus('Caderno(s) exportado(s) com sucesso.')
  }

  function handleOpenNotebookImport() {
    importInputRef.current?.click()
  }

  function handleImportNotebooks(event) {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || '{}'))
        const importedNotebooks = Array.isArray(parsed?.notebooks)
          ? parsed.notebooks
          : Array.isArray(parsed)
            ? parsed
            : null

        if (!importedNotebooks || importedNotebooks.length === 0) {
          throw new Error('Formato inválido')
        }

        const normalized = normalizeImportedNotebooks(importedNotebooks)
        setNotebooks((previous) => [...normalized, ...previous])
        setSettingsStatus(`${normalized.length} caderno(s) importado(s) com sucesso.`)
      } catch {
        setSettingsStatus('Não consegui importar este arquivo de cadernos.')
      } finally {
        event.target.value = ''
      }
    }

    reader.readAsText(file)
  }

  function handleExportSelectedNotebookQuestions() {
    if (!selected) return
    const selectedQuestions = (selected.questions ?? []).filter((question) => questionExportSelection.includes(question.id))
    if (selectedQuestions.length === 0) {
      setSettingsStatus('Selecione pelo menos uma questão para exportar.')
      return
    }
    if ((selected.questions?.length ?? 0) === 0) {
      setSettingsStatus('Este caderno ainda não tem questões para exportar.')
      return
    }

    const payload = {
      app: 'study-dashboard',
      type: 'question-notebook-questions-export',
      version: 1,
      exportedAt: new Date().toISOString(),
      notebookName: selected.name,
      questions: selectedQuestions.map((question) => ({
        bank: question.bank,
        year: question.year,
        statement: question.statement,
        supportText: question.supportText ?? '',
        correctAlternative: question.correctAlternative,
        alternatives: (question.alternatives ?? []).map((alternative) => ({
          text: alternative.text ?? '',
          comment: alternative.comment ?? ''
        }))
      }))
    }

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `studydash-questoes-${selected.name.toLowerCase().replaceAll(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(url)
    setSettingsStatus('Questões exportadas com sucesso.')
  }

  function toggleQuestionExportSelection(questionId) {
    setQuestionExportSelection((previous) =>
      previous.includes(questionId)
        ? previous.filter((id) => id !== questionId)
        : [...previous, questionId]
    )
  }

  function toggleQuestionImportSelection(questionId) {
    setQuestionImportSelection((previous) =>
      previous.includes(questionId)
        ? previous.filter((id) => id !== questionId)
        : [...previous, questionId]
    )
  }

  function handleImportNotebookQuestions(event) {
    const file = event.target.files?.[0]
    if (!file || !selected) return

    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || '{}'))
        const isNotebookBackup = parsed?.type === 'question-notebooks-export'
          || Array.isArray(parsed?.notebooks)
          || (Array.isArray(parsed?.questions) && ('attempts' in parsed || 'color' in parsed || 'tag' in parsed || 'description' in parsed))
        if (isNotebookBackup) {
          setSettingsStatus('Esse arquivo é um backup de caderno. Aqui você pode importar apenas arquivos de questões.')
          return
        }

        const importedQuestions = Array.isArray(parsed?.questions)
          ? parsed.questions
          : Array.isArray(parsed)
            ? parsed
            : null

        if (!importedQuestions?.length) {
          throw new Error('Formato inválido')
        }

        const normalizedQuestions = normalizeImportedQuestions(importedQuestions)
        setPendingQuestionImport({
          fileName: file.name,
          notebookName: parsed?.notebookName ?? '',
          questions: normalizedQuestions
        })
        setQuestionImportSelection(normalizedQuestions.map((question) => question.id))
        setSettingsStatus(`Arquivo pronto para importação: ${normalizedQuestions.length} questão(ões).`)
      } catch {
        setSettingsStatus('Não consegui importar este arquivo de questões.')
      } finally {
        event.target.value = ''
      }
    }

    reader.readAsText(file)
  }

  function commitNotebookQuestionImport(strategy) {
    if (!selected || !pendingQuestionImport) return

    const nextQuestions = pendingQuestionImport.questions.filter((question) => questionImportSelection.includes(question.id))
    if (nextQuestions.length === 0) {
      setSettingsStatus('Selecione pelo menos uma questão para importar.')
      return
    }
    const nextSelection = strategy === 'replace'
      ? nextQuestions.map((question) => question.id)
      : [...(selected.questions ?? []).map((question) => question.id), ...nextQuestions.map((question) => question.id)]
    setNotebooks((previous) => previous.map((notebook) => {
      if (notebook.id !== selected.id) return notebook

      return {
        ...notebook,
        updatedAt: Date.now(),
        attempts: strategy === 'replace' ? [] : notebook.attempts ?? [],
        questions: strategy === 'replace' ? nextQuestions : [...(notebook.questions ?? []), ...nextQuestions]
      }
    }))

    if (strategy === 'replace') {
      const sessions = JSON.parse(localStorage.getItem(TRAINING_RESUME_KEY) || '{}')
      if (sessions && typeof sessions === 'object') {
        delete sessions[String(selected.id)]
        localStorage.setItem(TRAINING_RESUME_KEY, JSON.stringify(sessions))
      }
    }

    setPendingQuestionImport(null)
    setQuestionImportSelection([])
    setQuestionExportSelection(nextSelection)
    setSettingsStatus(
      strategy === 'replace'
        ? `${nextQuestions.length} questão(ões) importada(s) substituindo o conteúdo anterior do caderno.`
        : `${nextQuestions.length} questão(ões) importada(s) e mesclada(s) ao caderno.`
    )
  }

  function deleteAttempt(attemptId) {
    if (!selected) return
    if (!window.confirm('Excluir esta tentativa do relatório? Isso também removerá os dados estatísticos dela.')) return

    setNotebooks((prev) => prev.map((notebook) => {
      if (notebook.id !== selected.id) return notebook

      const remainingAttempts = (notebook.attempts ?? []).filter((attempt) => attempt.id !== attemptId)
      const currentQuestions = notebook.questions ?? []

      const rebuiltQuestions = currentQuestions.map((question) => {
        const nextQuestion = {
          ...question,
          correctCount: 0,
          wrongCount: 0,
          answerHistory: {},
          lastAnswerLabel: undefined,
          lastDifficulty: undefined,
          lastReviewedAt: undefined
        }

        remainingAttempts.forEach((attempt) => {
          const attemptQuestion = (attempt.questions ?? []).find((item) => item.questionId === question.id && item.answered)
          if (!attemptQuestion) return

          if (attemptQuestion.isCorrect) nextQuestion.correctCount += 1
          else nextQuestion.wrongCount += 1

          if (attemptQuestion.selectedAlternativeValue) {
            nextQuestion.answerHistory[attemptQuestion.selectedAlternativeValue] = (nextQuestion.answerHistory[attemptQuestion.selectedAlternativeValue] ?? 0) + 1
            nextQuestion.lastAnswerLabel = attemptQuestion.selectedAlternativeValue
          }

          nextQuestion.lastDifficulty = attemptQuestion.difficulty ?? nextQuestion.lastDifficulty
          nextQuestion.lastReviewedAt = attempt.completedAt ?? nextQuestion.lastReviewedAt
        })

        if (Object.keys(nextQuestion.answerHistory).length === 0) {
          delete nextQuestion.answerHistory
        }
        if (nextQuestion.lastAnswerLabel == null) delete nextQuestion.lastAnswerLabel
        if (nextQuestion.lastDifficulty == null) delete nextQuestion.lastDifficulty
        if (nextQuestion.lastReviewedAt == null) delete nextQuestion.lastReviewedAt

        return nextQuestion
      })

      return {
        ...notebook,
        updatedAt: Date.now(),
        attempts: remainingAttempts.map((attempt, index) => ({ ...attempt, number: index + 1 })),
        questions: rebuiltQuestions
      }
    }))
  }

  return (
    <>
      <section className="summary-grid">
        <SummaryCard title="Cadernos" value={visibleNotebooks.length} description="Coleções ativas para organizar suas questões" />
        <SummaryCard title="Questões salvas" value={totalQuestions} description="Itens prontos para treino futuro" />
        <SummaryCard title="Cadernos ativos" value={activeBooks} description="Cadernos que já possuem questões" />
      </section>

      {view === 'library' ? <section className="notebooks-library-layout"><Card><section className="panel-section">
        <div className="notebooks-library-header">
          <div><h2 className="section-title">Estante de cadernos</h2><p className="flashcards-helper">Abra um caderno para estudar ou ative a edição da estante para alterar os volumes existentes.</p></div>
          <div className="notebooks-library-actions"><button type="button" className={`plan-action-btn${shelfEdit ? ' is-active' : ''}`} onClick={() => setShelfEdit((p) => !p)}>{shelfEdit ? 'Concluir edição' : 'Editar estante'}</button><button type="button" className={`header-button header-button-secondary notebook-icon-action-button${showArchivedShelf ? ' is-active' : ''}`} onClick={() => { setShowArchivedShelf(true); setShelfEdit(false) }} aria-label="Ver cadernos arquivados" title="Ver cadernos arquivados"><span className="notebook-inline-icon"><ArchiveIcon /></span></button><button type="button" className="header-button header-button-secondary notebook-shelf-settings-button" onClick={openNotebookSettings}><span className="notebook-inline-icon"><SettingsIcon /></span><span>Configurações</span></button></div>
        </div>
        <div className="notebooks-shelf">
          {visibleNotebooks.map((n) => <article key={n.id} className={`notebook-book-shell ${draggedNotebookId === n.id ? 'is-dragging' : ''} ${dragOverNotebookId === n.id && draggedNotebookId !== n.id ? 'is-drop-target' : ''}`} draggable={shelfEdit} onDragStart={() => handleNotebookDragStart(n.id)} onDragOver={(event) => shelfEdit ? handleNotebookDragOver(event, n.id) : undefined} onDrop={(event) => shelfEdit ? handleNotebookDrop(event, n.id) : undefined} onDragEnd={handleNotebookDragEnd}>
            {shelfEdit ? <div className="notebook-book-card-actions">
              <button type="button" className="notebook-book-card-action notebook-book-card-action-delete" onClick={() => deleteNotebookById(n.id, n.name)} aria-label={`Excluir o caderno ${n.name}`} title="Excluir caderno">
                <TrashIcon />
              </button>
              <button type="button" className="notebook-book-card-action" onClick={() => toggleNotebookArchive(n.id, !n.archived)} aria-label={n.archived ? `Desarquivar o caderno ${n.name}` : `Arquivar o caderno ${n.name}`} title={n.archived ? 'Desarquivar caderno' : 'Arquivar caderno'}>
                <ArchiveIcon />
              </button>
            </div> : null}
            <button type="button" className={`notebook-book notebook-book--${n.color} ${shelfEdit ? 'notebook-book-draggable is-editing' : ''} ${n.archived ? 'is-archived' : ''}`} onClick={() => shelfEdit ? openEditor(n) : openDetail(n.id)}>
              <span className="notebook-book-spine" aria-hidden="true" />
              <span className="notebook-book-topline">{shelfEdit ? 'Editar caderno' : 'Caderno'}</span>
              <strong>{n.name}</strong>
              {splitTags(n.tag).length > 0 ? <div className="notebook-book-tags">{splitTags(n.tag).map((tag) => <span key={tag} className="notebook-book-tag">{tag}</span>)}</div> : null}
              <div className="notebook-book-meta"><span>{n.questions.length} questão(ões)</span><span>Última edição em {fmt(n.updatedAt)}</span></div>
            </button>
          </article>)}
          <button type="button" className="notebook-book notebook-book-add" onClick={() => { setView('create'); setShelfEdit(false) }}>
            <span className="notebook-book-plus" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false" aria-hidden="true"><path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
            <strong>Novo caderno</strong><p>Adicione outro volume ao final da estante e personalize cor, tag e descrição.</p>
          </button>
        </div>
        {visibleNotebooks.length === 0 ? <p className="empty-message">Sua estante ainda está vazia. Use o caderno com `+` para criar o primeiro.</p> : null}
      </section></Card></section> : null}

      {view === 'create' ? <section className="notebook-page-layout"><Card><section className="panel-section">
        <div className="notebook-page-header"><div><button type="button" className="notebook-back-button" onClick={goLibrary}><span className="notebook-inline-icon"><ArrowLeftIcon /></span><span>Voltar para a estante</span></button><h2 className="section-title">Criar novo caderno</h2></div></div>
        <p className="flashcards-helper">Defina identidade visual e contexto do caderno antes de começar a adicionar questões.</p>
        <div className="split-grid notebooks-layout">
          <form className="flashcards-form" onSubmit={createBook}>
            <div className="notebook-edit-grid"><div className="plan-field-group"><label className="plan-field-label" htmlFor="notebook-name">Nome do caderno</label><input id="notebook-name" className="subject-input" type="text" placeholder="Ex: Constitucional CESPE" value={bookForm.name} onChange={(e) => setBookForm((p) => ({ ...p, name: e.target.value }))} /></div>
            <div className="plan-field-group"><label className="plan-field-label" htmlFor="notebook-tag">Tag do caderno</label><input id="notebook-tag" className="subject-input" type="text" placeholder="Ex: Reta final" value={bookForm.tag} onChange={(e) => setBookForm((p) => ({ ...p, tag: e.target.value }))} /></div></div>
            <div className="plan-field-group"><label className="plan-field-label" htmlFor="notebook-description">Descrição</label><textarea id="notebook-description" className="subject-input notebook-description-input" placeholder="Ex: Questões focadas em controle de constitucionalidade e organização do Estado." value={bookForm.description} onChange={(e) => setBookForm((p) => ({ ...p, description: e.target.value }))} /></div>
            <div className="plan-field-group"><span className="plan-field-label">Cor principal</span><div className="notebook-color-picker">{COLORS.map((color) => <button key={color} type="button" className={`notebook-color-chip notebook-color-chip--${color}${bookForm.color === color ? ' is-active' : ''}`} onClick={() => setBookForm((p) => ({ ...p, color }))}><span>{color}</span></button>)}</div></div>
            <div className="flashcards-actions"><button type="submit" className="subject-add-button">Criar caderno</button><button type="button" className="header-button header-button-secondary" onClick={goLibrary}>Cancelar</button></div>
          </form>
          <div className="notebook-preview-panel"><span className="notebook-book-topline">Prévia do caderno</span><div className={`notebook-book notebook-book-preview notebook-book--${bookForm.color}`}><span className="notebook-book-spine" aria-hidden="true" /><strong>{bookForm.name.trim() || 'Seu próximo caderno'}</strong>{splitTags(bookForm.tag).length > 0 ? <div className="notebook-book-tags">{splitTags(bookForm.tag).map((tag) => <span key={tag} className="notebook-book-tag">{tag}</span>)}</div> : null}<p>{bookForm.description.trim() || 'A descrição aparece aqui para você validar rapidamente como ele ficará na estante.'}</p><div className="notebook-book-meta"><span>Criado em {fmt(Date.now())}</span></div></div></div>
        </div>
      </section></Card></section> : null}

      {view === 'detail' && selected ? <section className="notebook-page-layout">
        <Card><section className="panel-section"><div className={`notebook-detail-banner notebook-detail-banner--${selected.color}`} aria-hidden="true" /><div className="notebook-page-header"><div><button type="button" className="notebook-back-button" onClick={goLibrary}><span className="notebook-inline-icon"><ArrowLeftIcon /></span><span>Voltar para a estante</span></button><div className="notebook-title-row"><h2 className="section-title">{selected.name}</h2>{splitTags(selected.tag).length > 0 ? <div className="notebook-title-tags">{splitTags(selected.tag).map((tag) => <span key={tag} className="notebook-title-tag">{tag}</span>)}</div> : null}</div><p className="flashcards-helper">{selected.description || 'Adicione questões e use este caderno como base para os treinos futuros.'}</p></div><div className="notebook-page-actions"><button type="button" className="subject-add-button notebook-train-button" onClick={() => onStartTraining?.(selected.id)} disabled={selected.questions.length === 0}><span className="notebook-inline-icon"><PlayIcon /></span><span>{selected.questions.length === 0 ? 'Adicione questões para treinar' : 'Iniciar treinamento'}</span></button><button type="button" className="header-button header-button-secondary notebook-report-button" onClick={() => setReportOpen(true)} disabled={selectedAttempts.length === 0}><span className="notebook-inline-icon"><DocumentIcon /></span><span>{selectedAttempts.length === 0 ? 'Sem relatório ainda' : 'Relatório'}</span></button><button type="button" className="header-button header-button-secondary notebook-icon-action-button" onClick={openSelectedNotebookSettings} aria-label="Abrir configurações do caderno" title="Configurações"><span className="notebook-inline-icon"><SettingsIcon /></span></button></div></div></section></Card>
        <Card><section className="panel-section"><div className="notebook-section-heading"><div><h3 className="section-title">Questões do caderno</h3><p className="flashcards-helper">Veja as suas questões ou use o último card para adicionar novas.</p></div></div>
          <div className="question-cards-grid">{selected.questions.map((q, i) => <article key={q.id} className={`question-card question-card-draggable ${draggedQuestionId === q.id ? 'is-dragging' : ''} ${dragOverQuestionId === q.id && draggedQuestionId !== q.id ? 'is-drop-target' : ''}`} draggable onDragStart={() => handleQuestionDragStart(q.id)} onDragOver={(event) => handleQuestionDragOver(event, q.id)} onDrop={(event) => handleQuestionDrop(event, q.id)} onDragEnd={handleQuestionDragEnd}><span className="question-card-index">Questão {i + 1}</span><div className="flashcard-tags"><span className="pill info">{q.bank}</span><span className="pill">{q.year}</span><span className="pill success">{q.correctCount ?? 0} acertos</span></div><p className="question-card-statement">{short(q.statement, 180)}</p>{q.supportText ? <p className="question-card-support">{short(q.supportText, 120)}</p> : <p className="question-card-support">Sem texto de apoio.</p>}<div className="question-card-actions"><button type="button" className="plan-action-btn" onClick={() => openQuestionEditor(q)}>Editar questão</button></div></article>)}<button type="button" className={`question-card question-card-add${questionOpen ? ' is-active' : ''}`} onClick={() => setQuestionOpen(true)}><span className="question-card-plus">+</span><strong>Adicionar nova questão</strong><p>Abra o formulário e cadastre banca, ano, enunciado, texto de apoio e alternativas.</p></button></div>
        </section></Card>
      </section> : null}

      {editing ? <div className="plan-modal-overlay" onClick={closeEditor}><div className="plan-modal notebook-edit-modal" role="dialog" aria-modal="true" aria-labelledby="notebook-edit-title" onClick={(e) => e.stopPropagation()}>
        <div className="important-date-modal-header"><div><h2 id="notebook-edit-title" className="plan-modal-title">Editar caderno</h2><p className="flashcards-helper">Ajuste dados visuais e organize melhor sua estante.</p></div><button type="button" className="modal-close-button" onClick={closeEditor} aria-label="Fechar edição do caderno">×</button></div>
        <form className="flashcards-form" onSubmit={saveBook}>
          <div className="notebook-edit-grid"><div className="plan-field-group"><label className="plan-field-label" htmlFor="edit-notebook-name">Nome do caderno</label><input id="edit-notebook-name" className="subject-input" type="text" value={editForm.name} onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))} /></div>
          <div className="plan-field-group"><label className="plan-field-label" htmlFor="edit-notebook-tag">Tag</label><input id="edit-notebook-tag" className="subject-input" type="text" value={editForm.tag} onChange={(e) => setEditForm((p) => ({ ...p, tag: e.target.value }))} /></div></div>
          <div className="plan-field-group"><label className="plan-field-label" htmlFor="edit-notebook-description">Descrição</label><textarea id="edit-notebook-description" className="subject-input notebook-description-input" value={editForm.description} onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))} /></div>
          <div className="plan-field-group"><span className="plan-field-label">Cor principal</span><div className="notebook-color-picker">{COLORS.map((color) => <button key={color} type="button" className={`notebook-color-chip notebook-color-chip--${color}${editForm.color === color ? ' is-active' : ''}`} onClick={() => setEditForm((p) => ({ ...p, color }))}><span>{color}</span></button>)}</div></div>
          <div className="notebook-edit-meta"><span>Criado em {fmt(editing.createdAt)}</span><span>Última edição em {fmt(editing.updatedAt)}</span></div>
          <div className="notebook-edit-actions"><button type="submit" className="subject-add-button">Salvar alterações</button><button type="button" className="header-button header-button-secondary" onClick={closeEditor}>Cancelar</button><button type="button" className="plan-action-btn notebook-delete-btn" onClick={deleteBook}>Excluir caderno</button></div>
        </form>
      </div></div> : null}

      {showArchivedShelf ? <div className="plan-modal-overlay" onClick={() => setShowArchivedShelf(false)}><div className="plan-modal notebook-archived-modal" role="dialog" aria-modal="true" aria-labelledby="archived-notebooks-title" onClick={(e) => e.stopPropagation()}>
        <div className="important-date-modal-header"><div><h2 id="archived-notebooks-title" className="plan-modal-title">Cadernos arquivados</h2><p className="flashcards-helper">Para entrar novamente em um caderno, desarquive-o primeiro.</p></div><button type="button" className="modal-close-button" onClick={() => setShowArchivedShelf(false)} aria-label="Fechar cadernos arquivados">×</button></div>
        <div className="notebook-archived-grid">
          {archivedNotebooks.map((n) => <article key={n.id} className="notebook-book-shell notebook-book-shell-compact">
            <div className="notebook-book-card-actions">
              <button type="button" className="notebook-book-card-action notebook-book-card-action-delete" onClick={() => deleteNotebookById(n.id, n.name)} aria-label={`Excluir o caderno ${n.name}`} title="Excluir caderno">
                <TrashIcon />
              </button>
              <button type="button" className="notebook-book-card-action" onClick={() => toggleNotebookArchive(n.id, false)} aria-label={`Desarquivar o caderno ${n.name}`} title="Desarquivar caderno">
                <ArchiveIcon />
              </button>
            </div>
            <button type="button" className={`notebook-book notebook-book--${n.color} notebook-book-compact is-archived`} onClick={() => undefined} disabled>
              <span className="notebook-book-spine" aria-hidden="true" />
              <span className="notebook-book-topline">Arquivado</span>
              <strong>{n.name}</strong>
              {splitTags(n.tag).length > 0 ? <div className="notebook-book-tags">{splitTags(n.tag).map((tag) => <span key={tag} className="notebook-book-tag">{tag}</span>)}</div> : null}
              <div className="notebook-book-meta"><span>{n.questions.length} questão(ões)</span><span>Desarquive para abrir este caderno.</span></div>
            </button>
          </article>)}
        </div>
        {archivedNotebooks.length === 0 ? <p className="empty-message">Você ainda não arquivou nenhum caderno.</p> : null}
      </div></div> : null}

      {editingQuestion ? <div className="plan-modal-overlay" onClick={closeQuestionEditor}><div className="plan-modal notebook-edit-modal notebook-question-modal" role="dialog" aria-modal="true" aria-labelledby="question-edit-title" onClick={(e) => e.stopPropagation()}>
        <div className="important-date-modal-header"><div><h2 id="question-edit-title" className="plan-modal-title">Editar questão</h2><p className="flashcards-helper">Ajuste os dados da questão sem sair do caderno.</p></div><div className="notebook-question-modal-header-actions"><button type="button" className="plan-action-btn notebook-delete-btn notebook-delete-btn-compact" onClick={deleteQuestion}>Excluir questão</button><button type="button" className="modal-close-button" onClick={closeQuestionEditor} aria-label="Fechar edição da questão">×</button></div></div>
        <form className="flashcards-form" onSubmit={saveQuestionEdit}>
          <div className="notebook-meta-grid"><div className="plan-field-group"><label className="plan-field-label" htmlFor="edit-question-bank">Banca</label><input id="edit-question-bank" className="subject-input" type="text" value={editingQuestionForm.bank} onChange={(e) => setEditingQuestionForm((p) => ({ ...p, bank: e.target.value }))} /></div><div className="plan-field-group"><label className="plan-field-label" htmlFor="edit-question-year">Ano</label><input id="edit-question-year" className="subject-input" type="text" value={editingQuestionForm.year} onChange={(e) => setEditingQuestionForm((p) => ({ ...p, year: e.target.value }))} /></div></div>
          <div className="plan-field-group"><label className="plan-field-label" htmlFor="edit-question-statement">Enunciado</label><textarea id="edit-question-statement" className="subject-input notebook-textarea-lg notebook-textarea-autogrow" rows="1" value={editingQuestionForm.statement} onInput={autoResizeTextarea} onChange={(e) => setEditingQuestionForm((p) => ({ ...p, statement: e.target.value }))} /></div>
          <div className="plan-field-group"><label className="plan-field-label" htmlFor="edit-question-support-text">Texto de apoio</label><textarea id="edit-question-support-text" className="subject-input notebook-textarea-md" value={editingQuestionForm.supportText} onChange={(e) => setEditingQuestionForm((p) => ({ ...p, supportText: e.target.value }))} /></div>
          <div className="notebook-alternatives-header"><div><h3 className="notebook-block-title">Alternativas</h3><p className="flashcards-helper">Você pode ajustar quantas alternativas deseja manter.</p></div><button type="button" className="plan-action-btn" onClick={addQuestionEditorAlt}>Adicionar alternativa</button></div>
          <div className="notebook-alternatives-list">{editingQuestionForm.alternatives.map((alternative, i) => <div key={OPT[i]} className="notebook-alternative-row"><button type="button" className={`notebook-alternative-label${editingQuestionForm.correctAlternative === OPT[i] ? ' is-correct' : ''}`} onClick={() => setEditingQuestionForm((p) => ({ ...p, correctAlternative: OPT[i] }))} aria-label={`Definir alternativa ${OPT[i]} como correta`}>{OPT[i]}</button><input className="subject-input" type="text" value={alternative.text} onChange={(e) => editQuestionAlt(i, e.target.value)} /><button type="button" className={`agenda-icon-button notebook-alternative-comment-button${alternative.comment?.trim() ? ' has-comment' : ''}`} onClick={() => openAlternativeCommentEditor('edit', i)} aria-label={`Adicionar comentario na alternativa ${OPT[i]}`}><CommentIcon /></button><button type="button" className="agenda-icon-button" onClick={() => removeQuestionEditorAlt(i)} aria-label={`Remover alternativa ${OPT[i]}`}><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 12h12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg></button></div>)}</div>
          <div className="flashcards-actions overlay-question-actions"><button type="submit" className="subject-add-button">Salvar alterações</button><button type="button" className="header-button header-button-secondary" onClick={closeQuestionEditor}>Cancelar</button></div>
        </form>
      </div></div> : null}
      {questionOpen ? <div className="plan-modal-overlay" onClick={() => { setQuestionForm(emptyQuestion()); setQuestionOpen(false); closeAlternativeCommentEditor() }}><div className="plan-modal notebook-edit-modal notebook-question-modal" role="dialog" aria-modal="true" aria-labelledby="question-create-title" onClick={(e) => e.stopPropagation()}>
        <div className="important-date-modal-header"><div><h2 id="question-create-title" className="plan-modal-title">Adicionar questão</h2><p className="flashcards-helper">Cadastre a questão exatamente como você quer visualizar depois no treino.</p></div><button type="button" className="modal-close-button" onClick={() => { setQuestionForm(emptyQuestion()); setQuestionOpen(false); closeAlternativeCommentEditor() }} aria-label="Fechar criação da questão">×</button></div>
        <form className="flashcards-form" onSubmit={addQuestion}>
          <div className="notebook-meta-grid"><div className="plan-field-group"><label className="plan-field-label" htmlFor="question-bank">Banca</label><input id="question-bank" className="subject-input" type="text" placeholder="Ex: FGV" value={questionForm.bank} onChange={(e) => setQuestionForm((p) => ({ ...p, bank: e.target.value }))} /></div><div className="plan-field-group"><label className="plan-field-label" htmlFor="question-year">Ano</label><input id="question-year" className="subject-input" type="text" inputMode="numeric" placeholder="Ex: 2025" value={questionForm.year} onChange={(e) => setQuestionForm((p) => ({ ...p, year: e.target.value }))} /></div></div>
          <div className="plan-field-group"><label className="plan-field-label" htmlFor="question-statement">Enunciado</label><textarea id="question-statement" className="subject-input notebook-textarea-lg notebook-textarea-autogrow" rows="1" placeholder="Digite o enunciado completo da questão." value={questionForm.statement} onInput={autoResizeTextarea} onChange={(e) => setQuestionForm((p) => ({ ...p, statement: e.target.value }))} /></div>
          <div className="plan-field-group"><label className="plan-field-label" htmlFor="question-support-text">Texto de apoio</label><textarea id="question-support-text" className="subject-input notebook-textarea-md" placeholder="Opcional. Use este campo se a questão tiver texto-base." value={questionForm.supportText} onChange={(e) => setQuestionForm((p) => ({ ...p, supportText: e.target.value }))} /></div>
          <div className="notebook-alternatives-header"><div><h3 className="notebook-block-title">Alternativas</h3><p className="flashcards-helper">Você define quantas opções quer manter no cadastro.</p></div><button type="button" className="plan-action-btn" onClick={addAlt}>Adicionar alternativa</button></div>
          <div className="notebook-alternatives-list">{questionForm.alternatives.map((alternative, i) => <div key={OPT[i]} className="notebook-alternative-row"><button type="button" className={`notebook-alternative-label${questionForm.correctAlternative === OPT[i] ? ' is-correct' : ''}`} onClick={() => setQuestionForm((p) => ({ ...p, correctAlternative: OPT[i] }))} aria-label={`Definir alternativa ${OPT[i]} como correta`}>{OPT[i]}</button><input className="subject-input" type="text" placeholder={`Texto da alternativa ${OPT[i]}`} value={alternative.text} onChange={(e) => changeAlt(i, e.target.value)} /><button type="button" className={`agenda-icon-button notebook-alternative-comment-button${alternative.comment?.trim() ? ' has-comment' : ''}`} onClick={() => openAlternativeCommentEditor('create', i)} aria-label={`Adicionar comentario na alternativa ${OPT[i]}`}><CommentIcon /></button><button type="button" className="agenda-icon-button" onClick={() => removeAlt(i)} aria-label={`Remover alternativa ${OPT[i]}`}><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 12h12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg></button></div>)}</div>
          <div className="flashcards-actions overlay-question-actions"><button type="submit" className="subject-add-button">Salvar questão</button><button type="button" className="header-button header-button-secondary" onClick={() => { setQuestionForm(emptyQuestion()); setQuestionOpen(false); closeAlternativeCommentEditor() }}>Cancelar</button></div>
        </form>
      </div></div> : null}
      {alternativeCommentEditor ? <div className="plan-modal-overlay" onClick={closeAlternativeCommentEditor}><div className="plan-modal notebook-alternative-comment-modal" role="dialog" aria-modal="true" aria-labelledby="alternative-comment-title" onClick={(e) => e.stopPropagation()}>
        <div className="important-date-modal-header"><div><h2 id="alternative-comment-title" className="plan-modal-title">Comentário da alternativa {OPT[alternativeCommentEditor.index]}</h2><p className="flashcards-helper">Explique por que esta alternativa está certa ou errada. Esse texto aparece no treino após a resposta.</p></div><button type="button" className="modal-close-button" onClick={closeAlternativeCommentEditor} aria-label="Fechar comentário da alternativa">×</button></div>
        <div className="plan-field-group"><label className="plan-field-label" htmlFor="alternative-comment-input">Comentário</label><textarea id="alternative-comment-input" className="subject-input notebook-alternative-comment-input" value={alternativeCommentDraft} onChange={(e) => setAlternativeCommentDraft(e.target.value)} placeholder="Ex: esta alternativa erra ao confundir conceito, competência ou exceção cobrada pela banca." /></div>
        <div className="flashcards-actions overlay-question-actions"><button type="button" className="subject-add-button" onClick={saveAlternativeComment}>Salvar comentário</button><button type="button" className="header-button header-button-secondary" onClick={closeAlternativeCommentEditor}>Cancelar</button></div>
      </div></div> : null}
      {reportOpen && selected ? <div className="plan-modal-overlay" onClick={() => setReportOpen(false)}><div className="plan-modal notebook-report-modal" role="dialog" aria-modal="true" aria-labelledby="notebook-report-title" onClick={(e) => e.stopPropagation()}>
        <div className="important-date-modal-header"><div><h2 id="notebook-report-title" className="plan-modal-title">Relatório de tentativas</h2><p className="flashcards-helper">Histórico completo das suas resoluções no caderno {selected.name}.</p></div><button type="button" className="modal-close-button" onClick={() => setReportOpen(false)} aria-label="Fechar relatório de tentativas">×</button></div>
        {reportStats ? <div className="notebook-report-stats"><article className="notebook-report-stat-card"><span>Total de tentativas</span><strong>{reportStats.totalAttempts}</strong></article><article className="notebook-report-stat-card"><span>Média de acertos</span><strong>{reportStats.averageCorrect}/{reportStats.totalQuestionsPerAttempt}</strong></article><article className="notebook-report-stat-card"><span>Melhor tentativa</span><strong>{reportStats.bestAttempt}/{reportStats.totalQuestionsPerAttempt}</strong></article><article className="notebook-report-stat-card"><span>Última tentativa</span><strong>{reportStats.lastAttemptAt ? fmt(reportStats.lastAttemptAt) : 'Sem registro'}</strong></article></div> : null}
        <div className="notebook-report-list">{selectedAttempts.slice().reverse().map((attempt) => { const activeQuestionIds = new Set(selected.questions.map((question) => question.id)); const correctLabels = (attempt.questions ?? []).filter((question) => question.answered && question.isCorrect).map((question) => activeQuestionIds.has(question.questionId) ? question.number : 'N/A'); const wrongLabels = (attempt.questions ?? []).filter((question) => question.answered && !question.isCorrect).map((question) => activeQuestionIds.has(question.questionId) ? question.number : 'N/A'); return <article key={attempt.id} className="notebook-report-item"><div className="notebook-report-item-header"><div><h3>Tentativa {attempt.number}</h3><p>{fmt(attempt.completedAt)}</p></div><div className="notebook-report-item-actions"><span className="notebook-report-score">{attempt.correctQuestions.length}/{attempt.totalQuestions} acertos</span><button type="button" className="plan-action-btn notebook-report-delete-button" onClick={() => deleteAttempt(attempt.id)}><span className="notebook-inline-icon"><TrashIcon /></span><span>Apagar</span></button></div></div><div className="notebook-report-columns"><div><h4>Questões corretas</h4><p>{correctLabels.length > 0 ? correctLabels.join(', ') : 'Nenhuma questão correta nesta tentativa.'}</p></div><div><h4>Questões erradas</h4><p>{wrongLabels.length > 0 ? wrongLabels.join(', ') : 'Nenhuma questão errada nesta tentativa.'}</p></div></div></article>})}</div>
      </div></div> : null}
      {settingsOpen ? <div className="plan-modal-overlay" onClick={closeNotebookSettings}><div className="plan-modal notebook-settings-modal" role="dialog" aria-modal="true" aria-labelledby="notebook-settings-title" onClick={(e) => e.stopPropagation()}>
        <div className="important-date-modal-header"><div><h2 id="notebook-settings-title" className="plan-modal-title">{settingsContext === 'library' ? 'Configurações da estante' : `Configurações do caderno ${selected?.name ?? ''}`}</h2><p className="flashcards-helper">{settingsContext === 'library' ? 'Exporte ou importe um ou vários cadernos com questões e relatórios.' : 'Exporte ou importe apenas as questões deste caderno.'}</p></div><button type="button" className="modal-close-button" onClick={closeNotebookSettings} aria-label={settingsContext === 'library' ? 'Fechar configurações da estante' : 'Fechar configurações do caderno'}>×</button></div>
        <div className="notebook-settings-mode-switch"><button type="button" className={`notebook-settings-mode-button${settingsMode === 'export' ? ' is-active' : ''}`} onClick={() => { setSettingsMode('export'); setSettingsStatus('') }}><span className="notebook-inline-icon"><ExportIcon /></span><span>Exportar</span></button><button type="button" className={`notebook-settings-mode-button${settingsMode === 'import' ? ' is-active' : ''}`} onClick={() => { setSettingsMode('import'); setSettingsStatus('') }}><span className="notebook-inline-icon"><ImportIcon /></span><span>Importar</span></button></div>
        {settingsMode === 'export'
          ? settingsContext === 'library'
            ? <div className="notebook-settings-body"><div className="notebook-settings-hero"><div><h3 className="section-title">Exportar cadernos</h3><p className="flashcards-helper">Monte um arquivo com um ou vários cadernos e leve também os relatórios, se quiser.</p></div><label className="notebook-settings-switch-card"><span><strong>Incluir relatórios</strong><small>Leva tentativas e estatísticas do relatório junto com os cadernos.</small></span><button type="button" role="switch" aria-checked={includeReportsOnExport} className={`notebook-settings-switch${includeReportsOnExport ? ' is-active' : ''}`} onClick={() => setIncludeReportsOnExport((previous) => !previous)}><span /></button></label></div><div><h3 className="section-title">Selecione os cadernos</h3><p className="flashcards-helper">Nenhum caderno começa marcado. Escolha manualmente o que deseja exportar.</p></div><div className="notebook-settings-selection-list">{notebooks.map((notebook) => <label key={notebook.id} className={`notebook-settings-selection-item${exportSelection.includes(notebook.id) ? ' is-selected' : ''}`}><input type="checkbox" checked={exportSelection.includes(notebook.id)} onChange={() => toggleExportSelection(notebook.id)} /><span className="notebook-settings-selection-app">{exportSelection.includes(notebook.id) ? <span className="notebook-settings-selection-badge"><CheckBadgeIcon /></span> : null}<span className={`notebook-settings-selection-app-icon notebook-settings-selection-app-icon--${notebook.color}`} aria-hidden="true">{notebook.name.slice(0, 1).toUpperCase()}</span><span className="notebook-settings-selection-copy"><strong>{notebook.name}</strong><small>{notebook.questions.length} questão(ões){(notebook.attempts?.length ?? 0) > 0 ? ` • ${notebook.attempts.length} relatório(s)` : ''}</small></span></span></label>)}</div><div className="settings-actions"><button type="button" className="subject-add-button" onClick={handleExportNotebooks}>Exportar caderno(s)</button></div></div>
            : <div className="notebook-settings-body"><div className="notebook-settings-import-card"><div><h3 className="section-title">Exportar questões do caderno</h3><p className="flashcards-helper">Escolha quais questões entram no arquivo. Relatórios e estatísticas não entram no export.</p></div></div><div><h3 className="section-title">Selecione as questões</h3><p className="flashcards-helper">Questões marcadas serão exportadas para o arquivo.</p></div><div className="notebook-question-settings-list">{(selected?.questions ?? []).map((question, index) => <label key={question.id} className={`notebook-question-settings-item${questionExportSelection.includes(question.id) ? ' is-selected' : ''}`}><input type="checkbox" checked={questionExportSelection.includes(question.id)} onChange={() => toggleQuestionExportSelection(question.id)} /><span className="notebook-question-settings-item-index">{index + 1}</span><span className="notebook-question-settings-item-copy"><strong>Questão {index + 1}</strong><small>{question.bank} • {question.year}</small><p>{short(question.statement, 180)}</p></span>{questionExportSelection.includes(question.id) ? <span className="notebook-question-settings-check"><CheckBadgeIcon /></span> : null}</label>)}</div><div className="settings-actions"><button type="button" className="subject-add-button" onClick={handleExportSelectedNotebookQuestions}>Exportar questões</button></div></div>
          : settingsContext === 'library'
            ? <div className="notebook-settings-body notebook-settings-body-import"><div className="notebook-settings-import-card"><div><h3 className="section-title">Importar arquivo de caderno</h3><p className="flashcards-helper">Escolha um arquivo exportado da estante. Os cadernos serão adicionados automaticamente com questões e relatórios, se existirem.</p></div><div className="settings-actions"><button type="button" className="subject-add-button" onClick={handleOpenNotebookImport}>Selecionar arquivo</button></div></div></div>
            : <div className="notebook-settings-body notebook-settings-body-import"><div className="notebook-settings-import-card"><div><h3 className="section-title">Importar questões para este caderno</h3><p className="flashcards-helper">Escolha um arquivo de questões. Se o arquivo for um backup completo de caderno, a importação será recusada.</p></div><div className="settings-actions"><button type="button" className="subject-add-button" onClick={handleOpenNotebookImport}>Selecionar arquivo</button></div></div>{pendingQuestionImport ? <div className="notebook-settings-import-preview"><div><h3 className="section-title">Prévia da importação</h3><p className="flashcards-helper">{pendingQuestionImport.fileName}{pendingQuestionImport.notebookName ? ` • origem: ${pendingQuestionImport.notebookName}` : ''}</p></div><div className="notebook-settings-import-stats"><article className="notebook-report-stat-card"><span>Selecionadas para entrar</span><strong>{questionImportSelection.length}</strong></article><article className="notebook-report-stat-card"><span>Já existem no caderno</span><strong>{selected?.questions?.length ?? 0}</strong></article></div><div><h3 className="section-title">Escolha quais importar</h3><p className="flashcards-helper">Questões desmarcadas serão ignoradas.</p></div><div className="notebook-question-settings-list">{pendingQuestionImport.questions.map((question, index) => <label key={question.id} className={`notebook-question-settings-item${questionImportSelection.includes(question.id) ? ' is-selected' : ''}`}><input type="checkbox" checked={questionImportSelection.includes(question.id)} onChange={() => toggleQuestionImportSelection(question.id)} /><span className="notebook-question-settings-item-index">{index + 1}</span><span className="notebook-question-settings-item-copy"><strong>{question.bank} • {question.year}</strong><small>Questão importada {index + 1}</small><p>{short(question.statement, 180)}</p></span>{questionImportSelection.includes(question.id) ? <span className="notebook-question-settings-check"><CheckBadgeIcon /></span> : null}</label>)}</div><div className="question-import-choice-actions"><button type="button" className="subject-add-button" onClick={() => commitNotebookQuestionImport('merge')}>Mesclar ao caderno</button><button type="button" className="header-button header-button-secondary" onClick={() => commitNotebookQuestionImport('replace')}>Substituir tudo</button></div></div> : null}</div>}
        <input ref={importInputRef} type="file" accept="application/json" className="settings-hidden-input" onChange={settingsContext === 'library' ? handleImportNotebooks : handleImportNotebookQuestions} />
        {settingsStatus ? <p className="settings-status">{settingsStatus}</p> : null}
      </div></div> : null}
    </>
  )
}

export default QuestionNotebooks
