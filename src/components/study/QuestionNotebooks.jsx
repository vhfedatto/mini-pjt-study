import { useEffect, useLayoutEffect, useMemo, useState } from 'react'
import SummaryCard from '../ui/SummaryCard'
import Card from '../ui/Card'

const KEY = 'question-notebooks'
const TRAINING_RESUME_KEY = 'question-training-resume'
const DIREITOS_HUMANOS_RESET_KEY = 'question-training-reset-direitos-humanos-v1'
const OPT = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
const COLORS = ['terracota', 'oceano', 'oliva', 'ameixa', 'grafite', 'ambar', 'vinho', 'esmeralda', 'anil']

const emptyNotebook = () => ({ name: '', description: '', tag: '', color: COLORS[0] })
const emptyQuestion = () => ({ bank: '', year: '', statement: '', supportText: '', alternatives: ['', '', '', ''], correctAlternative: 'A' })

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
    if (!Array.isArray(parsed)) return []
    return parsed.map((item, i) => ({
      id: item.id ?? Date.now() + i,
      name: item.name ?? 'Caderno sem nome',
      description: item.description ?? '',
      tag: item.tag ?? '',
      color: item.color ?? COLORS[i % COLORS.length],
      createdAt: item.createdAt ?? item.updatedAt ?? Date.now(),
      updatedAt: item.updatedAt ?? item.createdAt ?? Date.now(),
      attempts: Array.isArray(item.attempts) ? item.attempts : [],
      questions: Array.isArray(item.questions) ? item.questions : []
    }))
  } catch { return [] }
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

function QuestionNotebooks({ onStartTraining, initialSelectedId }) {
  const [notebooks, setNotebooks] = useState(() => readStore())
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
  const [draggedNotebookId, setDraggedNotebookId] = useState(null)
  const [dragOverNotebookId, setDragOverNotebookId] = useState(null)
  const [draggedQuestionId, setDraggedQuestionId] = useState(null)
  const [dragOverQuestionId, setDragOverQuestionId] = useState(null)

  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(notebooks)) }, [notebooks])

  useEffect(() => {
    if (view === 'detail' || view === 'create') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [view, selectedId])

  const selected = useMemo(() => notebooks.find((n) => n.id === selectedId) ?? null, [notebooks, selectedId])
  const editing = useMemo(() => notebooks.find((n) => n.id === editingId) ?? null, [notebooks, editingId])
  const editingQuestion = useMemo(
    () => selected?.questions.find((q) => q.id === editingQuestionId) ?? null,
    [selected, editingQuestionId]
  )
  const totalQuestions = useMemo(() => notebooks.reduce((t, n) => t + n.questions.length, 0), [notebooks])
  const activeBooks = useMemo(() => notebooks.filter((n) => n.questions.length > 0).length, [notebooks])
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
    const shouldLockScroll = Boolean(editing || editingQuestion || reportOpen)
    const previousBodyOverflow = document.body.style.overflow
    const previousHtmlOverflow = document.documentElement.style.overflow

    if (shouldLockScroll) {
      document.body.style.overflow = 'hidden'
      document.documentElement.style.overflow = 'hidden'
    }

    return () => {
      document.body.style.overflow = previousBodyOverflow
      document.documentElement.style.overflow = previousHtmlOverflow
    }
  }, [editing, editingQuestion, reportOpen])

  useLayoutEffect(() => {
    if (!initialSelectedId) return
    const notebookExists = notebooks.some((notebook) => notebook.id === initialSelectedId)
    if (!notebookExists) return
    setSelectedId(initialSelectedId)
    setView('detail')
    setQuestionOpen(false)
    setShelfEdit(false)
  }, [initialSelectedId])

  const goLibrary = () => { setView('library'); setSelectedId(null); setQuestionOpen(false); setQuestionForm(emptyQuestion()); setReportOpen(false) }
  const openDetail = (id) => { setSelectedId(id); setView('detail'); setQuestionOpen(false); setShelfEdit(false); setReportOpen(false) }
  const openEditor = (book) => { setEditingId(book.id); setEditForm({ name: book.name, description: book.description, tag: book.tag, color: book.color }) }
  const closeEditor = () => { setEditingId(null); setEditForm(emptyNotebook()) }
  const closeQuestionEditor = () => { setEditingQuestionId(null); setEditingQuestionForm(emptyQuestion()) }

  function openQuestionEditor(question) {
    setEditingQuestionId(question.id)
    setEditingQuestionForm({
      bank: question.bank,
      year: question.year,
      statement: question.statement,
      supportText: question.supportText || '',
      alternatives: question.alternatives.map((item) => item.text),
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

  function deleteBook() {
    if (!editing) return
    if (!window.confirm(`Excluir o caderno "${editing.name}"?`)) return
    setNotebooks((p) => p.filter((n) => n.id !== editing.id))
    if (selectedId === editing.id) goLibrary()
    closeEditor()
  }

  function addAlt() { setQuestionForm((p) => ({ ...p, alternatives: [...p.alternatives, ''] })) }
  function removeAlt(i) {
    setQuestionForm((p) => {
      if (p.alternatives.length <= 2) return p
      const alternatives = p.alternatives.filter((_, idx) => idx !== i)
      const correctAlternative = OPT[Math.max(0, Math.min(OPT.indexOf(p.correctAlternative), alternatives.length - 1))]
      return { ...p, alternatives, correctAlternative }
    })
  }
  function changeAlt(i, value) { setQuestionForm((p) => ({ ...p, alternatives: p.alternatives.map((a, idx) => idx === i ? value : a) })) }

  function autoResizeTextarea(event) {
    event.currentTarget.style.height = 'auto'
    event.currentTarget.style.height = `${event.currentTarget.scrollHeight}px`
  }

  function addQuestion(e) {
    e.preventDefault()
    if (!selected) return
    const statement = questionForm.statement.trim()
    const alternatives = questionForm.alternatives.map((i) => i.trim()).filter(Boolean)
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
      alternatives: alternatives.map((text, i) => ({ label: OPT[i], text })),
      createdAt: now
    }
    setNotebooks((p) => p.map((n) => n.id === selected.id ? { ...n, updatedAt: now, questions: [...n.questions, question] } : n))
    setQuestionForm(emptyQuestion()); setQuestionOpen(false)
  }

  function editQuestionAlt(i, value) {
    setEditingQuestionForm((p) => ({ ...p, alternatives: p.alternatives.map((a, idx) => idx === i ? value : a) }))
  }

  function addQuestionEditorAlt() {
    setEditingQuestionForm((p) => ({ ...p, alternatives: [...p.alternatives, ''] }))
  }

  function removeQuestionEditorAlt(i) {
    setEditingQuestionForm((p) => {
      if (p.alternatives.length <= 2) return p
      const alternatives = p.alternatives.filter((_, idx) => idx !== i)
      const correctAlternative = OPT[Math.max(0, Math.min(OPT.indexOf(p.correctAlternative), alternatives.length - 1))]
      return { ...p, alternatives, correctAlternative }
    })
  }

  function saveQuestionEdit(e) {
    e.preventDefault()
    if (!selected || !editingQuestion) return
    const statement = editingQuestionForm.statement.trim()
    const alternatives = editingQuestionForm.alternatives.map((i) => i.trim()).filter(Boolean)
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
                alternatives: alternatives.map((text, i) => ({ label: OPT[i], text }))
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

    const draggedIndex = notebooks.findIndex((notebook) => notebook.id === draggedNotebookId)
    const targetIndex = notebooks.findIndex((notebook) => notebook.id === targetNotebookId)

    if (draggedIndex === -1 || targetIndex === -1) {
      handleNotebookDragEnd()
      return
    }

    const reorderedNotebooks = [...notebooks]
    const [movedNotebook] = reorderedNotebooks.splice(draggedIndex, 1)
    reorderedNotebooks.splice(targetIndex, 0, movedNotebook)
    setNotebooks(reorderedNotebooks)
    handleNotebookDragEnd()
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
        <SummaryCard title="Cadernos" value={notebooks.length} description="Coleções para organizar suas questões" />
        <SummaryCard title="Questões salvas" value={totalQuestions} description="Itens prontos para treino futuro" />
        <SummaryCard title="Cadernos ativos" value={activeBooks} description="Cadernos que já possuem questões" />
      </section>

      {view === 'library' ? <section className="notebooks-library-layout"><Card><section className="panel-section">
        <div className="notebooks-library-header">
          <div><h2 className="section-title">Estante de cadernos</h2><p className="flashcards-helper">Abra um caderno para estudar ou ative a edição da estante para alterar os volumes existentes.</p></div>
          <div className="notebooks-library-actions"><button type="button" className={`plan-action-btn${shelfEdit ? ' is-active' : ''}`} onClick={() => setShelfEdit((p) => !p)}>{shelfEdit ? 'Concluir edição' : 'Editar estante'}</button></div>
        </div>
        <div className="notebooks-shelf">
          {notebooks.map((n) => <button key={n.id} type="button" className={`notebook-book notebook-book--${n.color} notebook-book-draggable ${draggedNotebookId === n.id ? 'is-dragging' : ''} ${dragOverNotebookId === n.id && draggedNotebookId !== n.id ? 'is-drop-target' : ''}`} draggable onDragStart={() => handleNotebookDragStart(n.id)} onDragOver={(event) => handleNotebookDragOver(event, n.id)} onDrop={(event) => handleNotebookDrop(event, n.id)} onDragEnd={handleNotebookDragEnd} onClick={() => shelfEdit ? openEditor(n) : openDetail(n.id)}>
            <span className="notebook-book-spine" aria-hidden="true" />
            <span className="notebook-book-topline">{shelfEdit ? 'Editar caderno' : 'Caderno'}</span>
            <strong>{n.name}</strong>
            {splitTags(n.tag).length > 0 ? <div className="notebook-book-tags">{splitTags(n.tag).map((tag) => <span key={tag} className="notebook-book-tag">{tag}</span>)}</div> : null}
            <div className="notebook-book-meta"><span>{n.questions.length} questão(ões)</span><span>Última edição em {fmt(n.updatedAt)}</span></div>
          </button>)}
          <button type="button" className="notebook-book notebook-book-add" onClick={() => { setView('create'); setShelfEdit(false) }}>
            <span className="notebook-book-plus" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false" aria-hidden="true"><path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
            <strong>Novo caderno</strong><p>Adicione outro volume ao final da estante e personalize cor, tag e descrição.</p>
          </button>
        </div>
        {notebooks.length === 0 ? <p className="empty-message">Sua estante ainda está vazia. Use o caderno com `+` para criar o primeiro.</p> : null}
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
        <Card><section className="panel-section"><div className={`notebook-detail-banner notebook-detail-banner--${selected.color}`} aria-hidden="true" /><div className="notebook-page-header"><div><button type="button" className="notebook-back-button" onClick={goLibrary}><span className="notebook-inline-icon"><ArrowLeftIcon /></span><span>Voltar para a estante</span></button><div className="notebook-title-row"><h2 className="section-title">{selected.name}</h2>{splitTags(selected.tag).length > 0 ? <div className="notebook-title-tags">{splitTags(selected.tag).map((tag) => <span key={tag} className="notebook-title-tag">{tag}</span>)}</div> : null}</div><p className="flashcards-helper">{selected.description || 'Adicione questões e use este caderno como base para os treinos futuros.'}</p></div><div className="notebook-page-actions"><button type="button" className="subject-add-button notebook-train-button" onClick={() => onStartTraining?.(selected.id)} disabled={selected.questions.length === 0}><span className="notebook-inline-icon"><PlayIcon /></span><span>{selected.questions.length === 0 ? 'Adicione questões para treinar' : 'Iniciar treinamento'}</span></button><button type="button" className="header-button header-button-secondary notebook-report-button" onClick={() => setReportOpen(true)} disabled={selectedAttempts.length === 0}><span className="notebook-inline-icon"><DocumentIcon /></span><span>{selectedAttempts.length === 0 ? 'Sem relatório ainda' : 'Relatório'}</span></button></div></div></section></Card>
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

      {editingQuestion ? <div className="plan-modal-overlay" onClick={closeQuestionEditor}><div className="plan-modal notebook-edit-modal" role="dialog" aria-modal="true" aria-labelledby="question-edit-title" onClick={(e) => e.stopPropagation()}>
        <div className="important-date-modal-header"><div><h2 id="question-edit-title" className="plan-modal-title">Editar questão</h2><p className="flashcards-helper">Ajuste os dados da questão sem sair do caderno.</p></div><div className="notebook-question-modal-header-actions"><button type="button" className="plan-action-btn notebook-delete-btn notebook-delete-btn-compact" onClick={deleteQuestion}>Excluir questão</button><button type="button" className="modal-close-button" onClick={closeQuestionEditor} aria-label="Fechar edição da questão">×</button></div></div>
        <form className="flashcards-form" onSubmit={saveQuestionEdit}>
          <div className="notebook-meta-grid"><div className="plan-field-group"><label className="plan-field-label" htmlFor="edit-question-bank">Banca</label><input id="edit-question-bank" className="subject-input" type="text" value={editingQuestionForm.bank} onChange={(e) => setEditingQuestionForm((p) => ({ ...p, bank: e.target.value }))} /></div><div className="plan-field-group"><label className="plan-field-label" htmlFor="edit-question-year">Ano</label><input id="edit-question-year" className="subject-input" type="text" value={editingQuestionForm.year} onChange={(e) => setEditingQuestionForm((p) => ({ ...p, year: e.target.value }))} /></div></div>
          <div className="plan-field-group"><label className="plan-field-label" htmlFor="edit-question-statement">Enunciado</label><textarea id="edit-question-statement" className="subject-input notebook-textarea-lg notebook-textarea-autogrow" rows="1" value={editingQuestionForm.statement} onInput={autoResizeTextarea} onChange={(e) => setEditingQuestionForm((p) => ({ ...p, statement: e.target.value }))} /></div>
          <div className="plan-field-group"><label className="plan-field-label" htmlFor="edit-question-support-text">Texto de apoio</label><textarea id="edit-question-support-text" className="subject-input notebook-textarea-md" value={editingQuestionForm.supportText} onChange={(e) => setEditingQuestionForm((p) => ({ ...p, supportText: e.target.value }))} /></div>
          <div className="notebook-alternatives-header"><div><h3 className="notebook-block-title">Alternativas</h3><p className="flashcards-helper">Você pode ajustar quantas alternativas deseja manter.</p></div><button type="button" className="plan-action-btn" onClick={addQuestionEditorAlt}>Adicionar alternativa</button></div>
          <div className="notebook-alternatives-list">{editingQuestionForm.alternatives.map((a, i) => <div key={OPT[i]} className="notebook-alternative-row"><button type="button" className={`notebook-alternative-label${editingQuestionForm.correctAlternative === OPT[i] ? ' is-correct' : ''}`} onClick={() => setEditingQuestionForm((p) => ({ ...p, correctAlternative: OPT[i] }))} aria-label={`Definir alternativa ${OPT[i]} como correta`}>{OPT[i]}</button><input className="subject-input" type="text" value={a} onChange={(e) => editQuestionAlt(i, e.target.value)} /><button type="button" className="agenda-icon-button" onClick={() => removeQuestionEditorAlt(i)} aria-label={`Remover alternativa ${OPT[i]}`}><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 12h12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg></button></div>)}</div>
          <div className="flashcards-actions overlay-question-actions"><button type="submit" className="subject-add-button">Salvar alterações</button><button type="button" className="header-button header-button-secondary" onClick={closeQuestionEditor}>Cancelar</button></div>
        </form>
      </div></div> : null}
      {questionOpen ? <div className="plan-modal-overlay" onClick={() => { setQuestionForm(emptyQuestion()); setQuestionOpen(false) }}><div className="plan-modal notebook-edit-modal" role="dialog" aria-modal="true" aria-labelledby="question-create-title" onClick={(e) => e.stopPropagation()}>
        <div className="important-date-modal-header"><div><h2 id="question-create-title" className="plan-modal-title">Adicionar questão</h2><p className="flashcards-helper">Cadastre a questão exatamente como você quer visualizar depois no treino.</p></div><button type="button" className="modal-close-button" onClick={() => { setQuestionForm(emptyQuestion()); setQuestionOpen(false) }} aria-label="Fechar criação da questão">×</button></div>
        <form className="flashcards-form" onSubmit={addQuestion}>
          <div className="notebook-meta-grid"><div className="plan-field-group"><label className="plan-field-label" htmlFor="question-bank">Banca</label><input id="question-bank" className="subject-input" type="text" placeholder="Ex: FGV" value={questionForm.bank} onChange={(e) => setQuestionForm((p) => ({ ...p, bank: e.target.value }))} /></div><div className="plan-field-group"><label className="plan-field-label" htmlFor="question-year">Ano</label><input id="question-year" className="subject-input" type="text" inputMode="numeric" placeholder="Ex: 2025" value={questionForm.year} onChange={(e) => setQuestionForm((p) => ({ ...p, year: e.target.value }))} /></div></div>
          <div className="plan-field-group"><label className="plan-field-label" htmlFor="question-statement">Enunciado</label><textarea id="question-statement" className="subject-input notebook-textarea-lg notebook-textarea-autogrow" rows="1" placeholder="Digite o enunciado completo da questão." value={questionForm.statement} onInput={autoResizeTextarea} onChange={(e) => setQuestionForm((p) => ({ ...p, statement: e.target.value }))} /></div>
          <div className="plan-field-group"><label className="plan-field-label" htmlFor="question-support-text">Texto de apoio</label><textarea id="question-support-text" className="subject-input notebook-textarea-md" placeholder="Opcional. Use este campo se a questão tiver texto-base." value={questionForm.supportText} onChange={(e) => setQuestionForm((p) => ({ ...p, supportText: e.target.value }))} /></div>
          <div className="notebook-alternatives-header"><div><h3 className="notebook-block-title">Alternativas</h3><p className="flashcards-helper">Você define quantas opções quer manter no cadastro.</p></div><button type="button" className="plan-action-btn" onClick={addAlt}>Adicionar alternativa</button></div>
          <div className="notebook-alternatives-list">{questionForm.alternatives.map((a, i) => <div key={OPT[i]} className="notebook-alternative-row"><button type="button" className={`notebook-alternative-label${questionForm.correctAlternative === OPT[i] ? ' is-correct' : ''}`} onClick={() => setQuestionForm((p) => ({ ...p, correctAlternative: OPT[i] }))} aria-label={`Definir alternativa ${OPT[i]} como correta`}>{OPT[i]}</button><input className="subject-input" type="text" placeholder={`Texto da alternativa ${OPT[i]}`} value={a} onChange={(e) => changeAlt(i, e.target.value)} /><button type="button" className="agenda-icon-button" onClick={() => removeAlt(i)} aria-label={`Remover alternativa ${OPT[i]}`}><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 12h12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg></button></div>)}</div>
          <div className="flashcards-actions overlay-question-actions"><button type="submit" className="subject-add-button">Salvar questão</button><button type="button" className="header-button header-button-secondary" onClick={() => { setQuestionForm(emptyQuestion()); setQuestionOpen(false) }}>Cancelar</button></div>
        </form>
      </div></div> : null}
      {reportOpen && selected ? <div className="plan-modal-overlay" onClick={() => setReportOpen(false)}><div className="plan-modal notebook-report-modal" role="dialog" aria-modal="true" aria-labelledby="notebook-report-title" onClick={(e) => e.stopPropagation()}>
        <div className="important-date-modal-header"><div><h2 id="notebook-report-title" className="plan-modal-title">Relatório de tentativas</h2><p className="flashcards-helper">Histórico completo das suas resoluções no caderno {selected.name}.</p></div><button type="button" className="modal-close-button" onClick={() => setReportOpen(false)} aria-label="Fechar relatório de tentativas">×</button></div>
        {reportStats ? <div className="notebook-report-stats"><article className="notebook-report-stat-card"><span>Total de tentativas</span><strong>{reportStats.totalAttempts}</strong></article><article className="notebook-report-stat-card"><span>Média de acertos</span><strong>{reportStats.averageCorrect}/{reportStats.totalQuestionsPerAttempt}</strong></article><article className="notebook-report-stat-card"><span>Melhor tentativa</span><strong>{reportStats.bestAttempt}/{reportStats.totalQuestionsPerAttempt}</strong></article><article className="notebook-report-stat-card"><span>Última tentativa</span><strong>{reportStats.lastAttemptAt ? fmt(reportStats.lastAttemptAt) : 'Sem registro'}</strong></article></div> : null}
        <div className="notebook-report-list">{selectedAttempts.slice().reverse().map((attempt) => { const activeQuestionIds = new Set(selected.questions.map((question) => question.id)); const correctLabels = (attempt.questions ?? []).filter((question) => question.answered && question.isCorrect).map((question) => activeQuestionIds.has(question.questionId) ? question.number : 'N/A'); const wrongLabels = (attempt.questions ?? []).filter((question) => question.answered && !question.isCorrect).map((question) => activeQuestionIds.has(question.questionId) ? question.number : 'N/A'); return <article key={attempt.id} className="notebook-report-item"><div className="notebook-report-item-header"><div><h3>Tentativa {attempt.number}</h3><p>{fmt(attempt.completedAt)}</p></div><div className="notebook-report-item-actions"><span className="notebook-report-score">{attempt.correctQuestions.length}/{attempt.totalQuestions} acertos</span><button type="button" className="plan-action-btn notebook-report-delete-button" onClick={() => deleteAttempt(attempt.id)}><span className="notebook-inline-icon"><TrashIcon /></span><span>Apagar</span></button></div></div><div className="notebook-report-columns"><div><h4>Questões corretas</h4><p>{correctLabels.length > 0 ? correctLabels.join(', ') : 'Nenhuma questão correta nesta tentativa.'}</p></div><div><h4>Questões erradas</h4><p>{wrongLabels.length > 0 ? wrongLabels.join(', ') : 'Nenhuma questão errada nesta tentativa.'}</p></div></div></article>})}</div>
      </div></div> : null}
    </>
  )
}

export default QuestionNotebooks
