import { useEffect, useMemo, useState } from 'react'
import SummaryCard from '../ui/SummaryCard'
import Card from '../ui/Card'

const KEY = 'question-notebooks'
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

function readStore() {
  try {
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

function QuestionNotebooks() {
  const [notebooks, setNotebooks] = useState(() => readStore())
  const [view, setView] = useState('library')
  const [selectedId, setSelectedId] = useState(null)
  const [shelfEdit, setShelfEdit] = useState(false)
  const [bookForm, setBookForm] = useState(emptyNotebook)
  const [questionForm, setQuestionForm] = useState(emptyQuestion)
  const [questionOpen, setQuestionOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState(emptyNotebook)
  const [editingQuestionId, setEditingQuestionId] = useState(null)
  const [editingQuestionForm, setEditingQuestionForm] = useState(emptyQuestion)
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

  useEffect(() => {
    const shouldLockScroll = Boolean(editing || editingQuestion)
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
  }, [editing, editingQuestion])

  const goLibrary = () => { setView('library'); setSelectedId(null); setQuestionOpen(false); setQuestionForm(emptyQuestion()) }
  const openDetail = (id) => { setSelectedId(id); setView('detail'); setQuestionOpen(false); setShelfEdit(false) }
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
    const book = { id: now, name, description: bookForm.description.trim(), tag: bookForm.tag.trim(), color: bookForm.color, createdAt: now, updatedAt: now, questions: [] }
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
    setNotebooks((p) => p.map((n) => n.id === selected.id ? { ...n, updatedAt: now, questions: [question, ...n.questions] } : n))
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
        <Card><section className="panel-section"><div className={`notebook-detail-banner notebook-detail-banner--${selected.color}`} aria-hidden="true" /><div className="notebook-page-header"><div><button type="button" className="notebook-back-button" onClick={goLibrary}><span className="notebook-inline-icon"><ArrowLeftIcon /></span><span>Voltar para a estante</span></button><div className="notebook-title-row"><h2 className="section-title">{selected.name}</h2>{splitTags(selected.tag).length > 0 ? <div className="notebook-title-tags">{splitTags(selected.tag).map((tag) => <span key={tag} className="notebook-title-tag">{tag}</span>)}</div> : null}</div><p className="flashcards-helper">{selected.description || 'Adicione questões e use este caderno como base para os treinos futuros.'}</p></div><div className="notebook-page-actions"><button type="button" className="subject-add-button notebook-train-button" onClick={() => alert('O treinamento deste caderno será implementado posteriormente.')}><span className="notebook-inline-icon"><PlayIcon /></span><span>Iniciar treinamento</span></button></div></div></section></Card>
        <Card><section className="panel-section"><div className="notebook-section-heading"><div><h3 className="section-title">Questões do caderno</h3><p className="flashcards-helper">Veja as suas questões ou use o último card para adicionar novas.</p></div></div>
          <div className="question-cards-grid">{selected.questions.map((q, i) => <article key={q.id} className={`question-card question-card-draggable ${draggedQuestionId === q.id ? 'is-dragging' : ''} ${dragOverQuestionId === q.id && draggedQuestionId !== q.id ? 'is-drop-target' : ''}`} draggable onDragStart={() => handleQuestionDragStart(q.id)} onDragOver={(event) => handleQuestionDragOver(event, q.id)} onDrop={(event) => handleQuestionDrop(event, q.id)} onDragEnd={handleQuestionDragEnd}><span className="question-card-index">Questão {i + 1}</span><div className="flashcard-tags"><span className="pill info">{q.bank}</span><span className="pill">{q.year}</span><span className="pill success">{q.correctCount ?? 0} acertos</span></div><p className="question-card-statement">{short(q.statement, 180)}</p>{q.supportText ? <p className="question-card-support">{short(q.supportText, 120)}</p> : <p className="question-card-support">Sem texto de apoio.</p>}<div className="question-card-actions"><button type="button" className="plan-action-btn" onClick={() => openQuestionEditor(q)}>Editar questão</button></div></article>)}<button type="button" className={`question-card question-card-add${questionOpen ? ' is-active' : ''}`} onClick={() => setQuestionOpen(true)}><span className="question-card-plus">+</span><strong>Adicionar nova questão</strong><p>Abra o formulário e cadastre banca, ano, enunciado, texto de apoio e alternativas.</p></button></div>
          {selected.questions.length === 0 ? <p className="empty-message">Este caderno ainda está vazio. O card de adição já está disponível acima para começar o cadastro.</p> : null}
        </section></Card>
        {questionOpen ? <Card><section className="panel-section"><h2 className="section-title">Adicionar questão</h2><p className="flashcards-helper">Cadastre a questão exatamente como você quer visualizar depois no treino.</p>
          <form className="flashcards-form" onSubmit={addQuestion}>
            <div className="notebook-meta-grid"><div className="plan-field-group"><label className="plan-field-label" htmlFor="question-bank">Banca</label><input id="question-bank" className="subject-input" type="text" placeholder="Ex: FGV" value={questionForm.bank} onChange={(e) => setQuestionForm((p) => ({ ...p, bank: e.target.value }))} /></div><div className="plan-field-group"><label className="plan-field-label" htmlFor="question-year">Ano</label><input id="question-year" className="subject-input" type="text" inputMode="numeric" placeholder="Ex: 2025" value={questionForm.year} onChange={(e) => setQuestionForm((p) => ({ ...p, year: e.target.value }))} /></div></div>
            <div className="plan-field-group"><label className="plan-field-label" htmlFor="question-statement">Enunciado</label><textarea id="question-statement" className="subject-input notebook-textarea-lg notebook-textarea-autogrow" rows="1" placeholder="Digite o enunciado completo da questão." value={questionForm.statement} onInput={autoResizeTextarea} onChange={(e) => setQuestionForm((p) => ({ ...p, statement: e.target.value }))} /></div>
            <div className="plan-field-group"><label className="plan-field-label" htmlFor="question-support-text">Texto de apoio</label><textarea id="question-support-text" className="subject-input notebook-textarea-md" placeholder="Opcional. Use este campo se a questão tiver texto-base." value={questionForm.supportText} onChange={(e) => setQuestionForm((p) => ({ ...p, supportText: e.target.value }))} /></div>
            <div className="notebook-alternatives-header"><div><h3 className="notebook-block-title">Alternativas</h3><p className="flashcards-helper">Você define quantas opções quer manter no cadastro.</p></div><button type="button" className="plan-action-btn" onClick={addAlt}>Adicionar alternativa</button></div>
            <div className="notebook-alternatives-list">{questionForm.alternatives.map((a, i) => <div key={OPT[i]} className="notebook-alternative-row"><button type="button" className={`notebook-alternative-label${questionForm.correctAlternative === OPT[i] ? ' is-correct' : ''}`} onClick={() => setQuestionForm((p) => ({ ...p, correctAlternative: OPT[i] }))} aria-label={`Definir alternativa ${OPT[i]} como correta`}>{OPT[i]}</button><input className="subject-input" type="text" placeholder={`Texto da alternativa ${OPT[i]}`} value={a} onChange={(e) => changeAlt(i, e.target.value)} /><button type="button" className="agenda-icon-button" onClick={() => removeAlt(i)} aria-label={`Remover alternativa ${OPT[i]}`}><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 12h12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg></button></div>)}</div>
            <div className="flashcards-actions"><button type="submit" className="subject-add-button">Salvar questão</button><button type="button" className="header-button header-button-secondary" onClick={() => { setQuestionForm(emptyQuestion()); setQuestionOpen(false) }}>Limpar formulário</button></div>
          </form>
        </section></Card> : null}
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
        <div className="important-date-modal-header"><div><h2 id="question-edit-title" className="plan-modal-title">Editar questão</h2><p className="flashcards-helper">Ajuste os dados da questão sem sair do caderno.</p></div><button type="button" className="modal-close-button" onClick={closeQuestionEditor} aria-label="Fechar edição da questão">×</button></div>
        <form className="flashcards-form" onSubmit={saveQuestionEdit}>
          <div className="notebook-meta-grid"><div className="plan-field-group"><label className="plan-field-label" htmlFor="edit-question-bank">Banca</label><input id="edit-question-bank" className="subject-input" type="text" value={editingQuestionForm.bank} onChange={(e) => setEditingQuestionForm((p) => ({ ...p, bank: e.target.value }))} /></div><div className="plan-field-group"><label className="plan-field-label" htmlFor="edit-question-year">Ano</label><input id="edit-question-year" className="subject-input" type="text" value={editingQuestionForm.year} onChange={(e) => setEditingQuestionForm((p) => ({ ...p, year: e.target.value }))} /></div></div>
          <div className="plan-field-group"><label className="plan-field-label" htmlFor="edit-question-statement">Enunciado</label><textarea id="edit-question-statement" className="subject-input notebook-textarea-lg notebook-textarea-autogrow" rows="1" value={editingQuestionForm.statement} onInput={autoResizeTextarea} onChange={(e) => setEditingQuestionForm((p) => ({ ...p, statement: e.target.value }))} /></div>
          <div className="plan-field-group"><label className="plan-field-label" htmlFor="edit-question-support-text">Texto de apoio</label><textarea id="edit-question-support-text" className="subject-input notebook-textarea-md" value={editingQuestionForm.supportText} onChange={(e) => setEditingQuestionForm((p) => ({ ...p, supportText: e.target.value }))} /></div>
          <div className="notebook-alternatives-header"><div><h3 className="notebook-block-title">Alternativas</h3><p className="flashcards-helper">Você pode ajustar quantas alternativas deseja manter.</p></div><button type="button" className="plan-action-btn" onClick={addQuestionEditorAlt}>Adicionar alternativa</button></div>
          <div className="notebook-alternatives-list">{editingQuestionForm.alternatives.map((a, i) => <div key={OPT[i]} className="notebook-alternative-row"><button type="button" className={`notebook-alternative-label${editingQuestionForm.correctAlternative === OPT[i] ? ' is-correct' : ''}`} onClick={() => setEditingQuestionForm((p) => ({ ...p, correctAlternative: OPT[i] }))} aria-label={`Definir alternativa ${OPT[i]} como correta`}>{OPT[i]}</button><input className="subject-input" type="text" value={a} onChange={(e) => editQuestionAlt(i, e.target.value)} /><button type="button" className="agenda-icon-button" onClick={() => removeQuestionEditorAlt(i)} aria-label={`Remover alternativa ${OPT[i]}`}><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 12h12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg></button></div>)}</div>
          <div className="notebook-edit-actions"><button type="submit" className="subject-add-button">Salvar alterações</button><button type="button" className="header-button header-button-secondary" onClick={closeQuestionEditor}>Cancelar</button></div>
        </form>
      </div></div> : null}
    </>
  )
}

export default QuestionNotebooks
