import { useEffect, useMemo, useState } from 'react'
import Header from '../components/layout/Header'
import SummaryCard from '../components/ui/SummaryCard'
import Footer from '../components/layout/Footer'
import Card from '../components/ui/Card'

function ImportantDates() {
  const defaultPlanColor = '#c46b2d'
  const [plans] = useState(() => {
    const stored = localStorage.getItem('plans') || localStorage.getItem('studyPlans')
    return stored ? JSON.parse(stored) : []
  })
  const [subjects] = useState(() => {
    const stored = localStorage.getItem('subjects')
    return stored ? JSON.parse(stored) : []
  })
  const [importantDates, setImportantDates] = useState(() => {
    const stored = localStorage.getItem('importantDates')
    return stored ? JSON.parse(stored) : []
  })
  const [selectedSubjectId, setSelectedSubjectId] = useState('')
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [expandedItem, setExpandedItem] = useState(null)
  const today = new Date().toISOString().split('T')[0]

  function formatDate(date) {
    if (!date) return ''

    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(new Date(`${date}T00:00:00`))
  }

  useEffect(() => {
    localStorage.setItem('importantDates', JSON.stringify(importantDates))
    globalThis.dispatchEvent(new Event('important-dates-updated'))
  }, [importantDates])

  const sortedDates = useMemo(() => {
    return importantDates
      .map((item) => {
        const subject = subjects.find((entry) => entry.id === item.subjectId)
        const plan = plans.find((entry) => entry.id === (subject?.planId ?? item.planId))

        return {
          ...item,
          subjectName: subject?.name || 'Materia removida',
          planName: plan?.name || 'Plano sem nome',
          planColor: plan?.color || defaultPlanColor
        }
      })
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.id - b.id)
  }, [defaultPlanColor, importantDates, plans, subjects])

  const nextPendingDate = useMemo(
    () => sortedDates.find((item) => !item.completed) ?? null,
    [sortedDates]
  )

  const upcomingCount = useMemo(
    () =>
      importantDates.filter(
        (item) => item.dueDate && item.dueDate >= today && !item.completed
      ).length,
    [importantDates, today]
  )

  function resetForm() {
    setSelectedSubjectId('')
    setTitle('')
    setNotes('')
    setDueDate('')
    setEditingId(null)
  }

  function handleAddImportantDate() {
    const selectedSubject = subjects.find((subject) => subject.id === Number(selectedSubjectId))
    const trimmedTitle = title.trim()
    const trimmedNotes = notes.trim()

    if (!selectedSubject) {
      alert('Selecione uma matéria para cadastrar a data importante.')
      return
    }

    if (!trimmedTitle) {
      alert('Descreva o que essa data significa.')
      return
    }

    if (!dueDate) {
      alert('Selecione uma data para a avaliacao.')
      return
    }

    if (dueDate < today) {
      alert('A data não pode ser anterior ao dia de hoje.')
      return
    }

    if (editingId) {
      setImportantDates((prev) =>
        prev.map((item) =>
          item.id === editingId
            ? {
                ...item,
                subjectId: selectedSubject.id,
                planId: selectedSubject.planId,
                title: trimmedTitle,
                notes: trimmedNotes,
                dueDate
              }
            : item
        )
      )
    } else {
      setImportantDates((prev) => [
        ...prev,
        {
          id: Date.now(),
          subjectId: selectedSubject.id,
          planId: selectedSubject.planId,
          title: trimmedTitle,
          notes: trimmedNotes,
          dueDate,
          completed: false
        }
      ])
    }

    resetForm()
  }

  function handleStartEdit(item) {
    setEditingId(item.id)
    setSelectedSubjectId(String(item.subjectId))
    setTitle(item.title)
    setNotes(item.notes || '')
    setDueDate(item.dueDate || '')
  }

  function handleRemoveImportantDate(id) {
    setImportantDates((prev) => prev.filter((item) => item.id !== id))
    if (editingId === id) resetForm()
  }

  function handleToggleCompleted(id) {
    setImportantDates((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    )
  }

  return (
    <section className="dashboard-content">
      <Header />

      <section className="summary-grid">
        <SummaryCard
          title="Datas cadastradas"
          value={importantDates.length}
          description="Provas e marcos importantes registrados"
        />
        <SummaryCard
          title="Com data definida"
          value={upcomingCount}
          description="Eventos com prazo exato"
        />
        <SummaryCard
          title="Próxima avaliação"
          value={nextPendingDate ? nextPendingDate.subjectName : 'Sem datas'}
          description={
            nextPendingDate
              ? `${nextPendingDate.title} em ${formatDate(nextPendingDate.dueDate)}`
              : 'Cadastre uma avaliação para acompanhar'
          }
          variant="alert"
        />
      </section>

      <section className="split-grid important-dates-layout">
        <Card>
          <section className="panel-section">
            <h2 className="section-title">Provas e Datas Importantes</h2>

            {subjects.length === 0 ? (
              <p className="empty-message">
                Cadastre matérias antes de adicionar provas ou outras datas importantes.
              </p>
            ) : (
              <>
                <div className="important-dates-form">
                  <div className="plan-field-group">
                    <label className="plan-field-label" htmlFor="important-subject">Disciplina</label>
                    <select
                      id="important-subject"
                      className="subject-input"
                      value={selectedSubjectId}
                      onChange={(event) => setSelectedSubjectId(event.target.value)}
                    >
                      <option value="">Selecione uma matéria</option>
                      {subjects.map((subject) => {
                        const planName =
                          plans.find((plan) => plan.id === subject.planId)?.name || 'Plano sem nome'

                        return (
                          <option key={subject.id} value={subject.id}>
                            {`${subject.name} - ${planName}`}
                          </option>
                        )
                      })}
                    </select>
                  </div>

                  <div className="plan-field-group">
                    <label className="plan-field-label" htmlFor="important-title">Avaliação</label>
                    <input
                      id="important-title"
                      className="subject-input"
                      type="text"
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                      placeholder="Ex: Prova, seminario, trabalho"
                    />
                  </div>

                  <div className="plan-field-group">
                    <label className="plan-field-label" htmlFor="important-notes">Descrição</label>
                    
                    <textarea
                      id="important-notes"
                      className="subject-input important-dates-notes"
                      value={notes}
                      onChange={(event) => setNotes(event.target.value)}
                      placeholder="Detalhes da avaliacao"
                    />
                  </div>

                  <div className="plan-field-group">
                    <label className="plan-field-label" htmlFor="important-date">Data</label>
                    <input
                      id="important-date"
                      className="subject-input"
                      type="date"
                      value={dueDate}
                      min={today}
                      onChange={(event) => setDueDate(event.target.value)}
                    />
                  </div>

                  <div
                    className={`important-dates-actions ${
                      editingId ? 'important-dates-actions--editing' : 'important-dates-actions--single'
                    }`}
                  >
                    {editingId ? (
                      <button
                        type="button"
                        className="header-button header-button-secondary"
                        onClick={resetForm}
                      >
                        Cancelar
                      </button>
                    ) : null}
                    <button className="subject-add-button" onClick={handleAddImportantDate}>
                      {editingId ? 'Salvar alteracoes' : 'Adicionar data'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </section>
        </Card>

        <Card>
          <section className="panel-section">
            <h2 className="section-title">Avaliações cadastradas</h2>

            {sortedDates.length === 0 ? (
              <p className="empty-message">
                Nenhuma prova ou data importante cadastrada ainda.
              </p>
            ) : (
              <div className="important-dates-list">
                {sortedDates.map((item) => (
                  <article
                    className={`important-date-card important-date-card-compact ${
                      item.completed ? 'important-date-card-completed' : ''
                    }`}
                    key={item.id}
                  >
                    <div className="important-date-main">
                      <div className="important-date-subject-line">
                        <span
                          className="plan-color-dot"
                          style={{ '--plan-color': item.planColor }}
                          aria-hidden="true"
                        />
                        <span className="subject-name">{item.subjectName}</span>
                        <span className="important-date-type">
                          <span>{item.title}</span>
                        </span>
                      </div>
                      <p className="important-date-deadline">
                        Prazo: {formatDate(item.dueDate)}
                      </p>
                      {item.notes ? (
                        <>
                          <p className="important-date-notes">
                            {item.notes.length > 65 ? (
                              <>
                                {`${item.notes.slice(0, 65)}... `}
                                <button
                                  type="button"
                                  className="important-date-read-more"
                                  onClick={() => setExpandedItem(item)}
                                >
                                  Ler mais
                                </button>
                              </>
                            ) : (
                              item.notes
                            )}
                          </p>
                        </>
                      ) : null}
                    </div>

                    <div className="important-date-actions">
                      <button
                        type="button"
                        className={`important-date-icon-button important-date-check-button ${
                          item.completed ? 'is-completed' : ''
                        }`}
                        onClick={() => handleToggleCompleted(item.id)}
                        aria-label={
                          item.completed
                            ? `Marcar ${item.title} como pendente`
                            : `Marcar ${item.title} como concluida`
                        }
                      >
                        <svg viewBox="0 0 24 24" fill="none" role="img">
                          <path
                            d="m5 12 4.2 4.2L19 6.5"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                      <button
                        type="button"
                        className="important-date-icon-button"
                        onClick={() => handleStartEdit(item)}
                        aria-label={`Editar ${item.title}`}
                      >
                        <svg viewBox="0 0 24 24" fill="none" role="img">
                          <path
                            d="M4 20h4.2l9.9-9.9a1.5 1.5 0 0 0 0-2.12l-2.08-2.08a1.5 1.5 0 0 0-2.12 0L4 15.8V20Z"
                            stroke="currentColor"
                            strokeWidth="1.7"
                            strokeLinejoin="round"
                          />
                          <path
                            d="m12.5 7.5 4 4"
                            stroke="currentColor"
                            strokeWidth="1.7"
                            strokeLinecap="round"
                          />
                        </svg>
                      </button>
                      <button
                        type="button"
                        className="subject-remove-button"
                        onClick={() => handleRemoveImportantDate(item.id)}
                      >
                        ✕
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </Card>
      </section>

      {expandedItem ? (
        <div
          className="plan-modal-overlay"
          role="presentation"
          onClick={() => setExpandedItem(null)}
        >
          <div
            className="plan-modal important-date-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="important-date-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="important-date-modal-header">
              <h2 id="important-date-modal-title" className="plan-modal-title">
                {expandedItem.title}
              </h2>
              <button
                type="button"
                className="subject-remove-button"
                onClick={() => setExpandedItem(null)}
              >
                ✕
              </button>
            </div>
            <p className="important-date-deadline">
              Prazo: {formatDate(expandedItem.dueDate)}
            </p>
            <p className="important-date-modal-description">{expandedItem.notes}</p>
          </div>
        </div>
      ) : null}

      <Footer />
    </section>
  )
}

export default ImportantDates
