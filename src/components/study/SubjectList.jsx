import { useEffect, useRef, useState, useCallback } from 'react'
import Card from '../ui/Card'

function formatSubjectPeriodInput(value) {
  const digits = value.replace(/\D/g, '')
  const year = digits.slice(0, 4)
  const period = digits.slice(4, 5)

  if (!year) return ''
  if (!period) return year

  return `${year}.${period}`
}

function isValidSubjectPeriod(value) {
  return /^\d{4}\.[12]$/.test(value)
}

function SubjectList({
  subjects,
  visibleSubjects = subjects,
  plans = [],
  setSubjects,
  isLoadingSubjects,
  tasks = [],
  activePlanId
}) {
  const [newSubject, setNewSubject] = useState('')
  const [newSubjectPeriod, setNewSubjectPeriod] = useState('')
  const [draggedSubjectId, setDraggedSubjectId] = useState(null)
  const [dragOverSubjectId, setDragOverSubjectId] = useState(null)
  const [editingSubjectId, setEditingSubjectId] = useState(null)
  const [editingName, setEditingName] = useState('')
  const [editingPeriod, setEditingPeriod] = useState('')
  const [isEditMode, setIsEditMode] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleAddSubject = useCallback(() => {
    const trimmedSubject = newSubject.trim()
    const formattedPeriod = formatSubjectPeriodInput(newSubjectPeriod)
    if (trimmedSubject === '') return
    if (!activePlanId) {
      alert('Selecione ou crie um plano antes de adicionar matérias.')
      return
    }
    if (!isValidSubjectPeriod(formattedPeriod)) {
      alert('Informe o período no formato AAAA.P, usando 1 ou 2 após o ponto.')
      return
    }

    const exists = subjects.some(
      (s) =>
        s.planId === activePlanId &&
        s.name.toLowerCase() === trimmedSubject.toLowerCase()
    )

    if (exists){
      alert('Matéria já existe')
      return
    } 

    setSubjects((prev) => [
      ...prev,
      {
        id: Date.now(),
        name: trimmedSubject,
        period: formattedPeriod,
        planId: activePlanId
      }
    ])

    setNewSubject('')
    setNewSubjectPeriod('')
    inputRef.current?.focus()
  }, [activePlanId, newSubject, newSubjectPeriod, setSubjects, subjects])
  

  function handleRemoveSubject(id) {
    const hasLinkedTasks = tasks.some((task) => task.subjectId === id)

    if (hasLinkedTasks) {
      alert('Essa matéria possui tarefas vinculadas. Remova ou altere as tarefas antes.')
      return
    }

    setSubjects((prev) => prev.filter((subject) => subject.id !== id))
  }

  function handleStartEdit(subject) {
    setEditingSubjectId(subject.id)
    setEditingName(subject.name)
    setEditingPeriod(subject.period || '')
  }

  function handleCancelEdit() {
    setEditingSubjectId(null)
    setEditingName('')
    setEditingPeriod('')
  }

  function handleToggleEditMode() {
    setIsEditMode((prev) => {
      const next = !prev

      if (!next) {
        handleCancelEdit()
      }

      return next
    })
  }

  function handleSaveEdit(subjectId) {
    const trimmedName = editingName.trim()
    const formattedPeriod = formatSubjectPeriodInput(editingPeriod)

    if (!trimmedName) {
      alert('Informe o nome da matéria.')
      return
    }

    if (!isValidSubjectPeriod(formattedPeriod)) {
      alert('Informe o período no formato AAAA.P, usando 1 ou 2 após o ponto.')
      return
    }

    const currentSubject = subjects.find((subject) => subject.id === subjectId)
    const exists = subjects.some(
      (subject) =>
        subject.id !== subjectId &&
        subject.planId === currentSubject?.planId &&
        subject.name.toLowerCase() === trimmedName.toLowerCase()
    )

    if (exists) {
      alert('Já existe outra matéria com esse nome neste plano.')
      return
    }

    setSubjects((prev) =>
      prev.map((subject) =>
        subject.id === subjectId
          ? { ...subject, name: trimmedName, period: formattedPeriod }
          : subject
      )
    )

    handleCancelEdit()
  }

  const handleDragStart = useCallback((subjectId) => {
    setDraggedSubjectId(subjectId)
    setDragOverSubjectId(subjectId)
  }, [])

  const handleDragOver = useCallback((event, subjectId) => {
    event.preventDefault()

    if (dragOverSubjectId !== subjectId) {
      setDragOverSubjectId(subjectId)
    }
  }, [dragOverSubjectId])

  const handleDragEnd = useCallback(() => {
    setDraggedSubjectId(null)
    setDragOverSubjectId(null)
  }, [])

  const handleDrop = useCallback((event, targetSubjectId) => {
    event.preventDefault()

    if (
      !activePlanId ||
      isEditMode ||
      !draggedSubjectId ||
      draggedSubjectId === targetSubjectId
    ) {
      handleDragEnd()
      return
    }

    const orderedPlanSubjects = visibleSubjects.filter(
      (subject) => subject.planId === activePlanId
    )
    const draggedIndex = orderedPlanSubjects.findIndex(
      (subject) => subject.id === draggedSubjectId
    )
    const targetIndex = orderedPlanSubjects.findIndex(
      (subject) => subject.id === targetSubjectId
    )

    if (draggedIndex === -1 || targetIndex === -1) {
      handleDragEnd()
      return
    }

    const reorderedPlanSubjects = [...orderedPlanSubjects]
    const [movedSubject] = reorderedPlanSubjects.splice(draggedIndex, 1)
    reorderedPlanSubjects.splice(targetIndex, 0, movedSubject)

    setSubjects((prev) => {
      const nextPlanSubjects = [...reorderedPlanSubjects]

      return prev.map((subject) =>
        subject.planId === activePlanId ? nextPlanSubjects.shift() : subject
      )
    })

    handleDragEnd()
  }, [activePlanId, draggedSubjectId, handleDragEnd, isEditMode, setSubjects, visibleSubjects])

  return (
    <Card>
      <section className="panel-section subject-section">
        <div className="subject-section-header">
          <h2 className="section-title">Matérias</h2>
          <button
            type="button"
            className={`subject-edit-toggle${isEditMode ? ' is-active' : ''}`}
            onClick={handleToggleEditMode}
          >
            {isEditMode ? 'Concluir edição' : 'Editar'}
          </button>
        </div>

        <div className="subject-form">
          <input
            ref={inputRef}
            className="subject-input"
            type="text"
            placeholder="Nova matéria"
            value={newSubject}
            onChange={(e) => setNewSubject(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddSubject()
            }}
          />
          <input
            className="subject-input subject-period-input"
            type="text"
            inputMode="numeric"
            placeholder="2025.1"
            value={newSubjectPeriod}
            onChange={(e) => setNewSubjectPeriod(formatSubjectPeriodInput(e.target.value))}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddSubject()
            }}
          />

          <button className="subject-add-button" onClick={handleAddSubject}>
            Adicionar
          </button>
        </div>

        {isLoadingSubjects ? (
          <p className="empty-message">Carregando matérias...</p>
        ) : visibleSubjects.length > 0 ? (
          <ul
            className={`subject-list ${
              visibleSubjects.length >= 4 ? 'subject-list-grid' : ''
            }`}
          >
            {visibleSubjects.map((subject) => {
              const plan = plans.find((item) => item.id === subject.planId)
              const totalTasksForSubject = tasks.filter(
                (task) => task.subjectId === subject.id
              ).length

              const completedTasksForSubject = tasks.filter(
                (task) => task.subjectId === subject.id && task.completed
              ).length
              const isDragging = draggedSubjectId === subject.id
              const isDropTarget =
                dragOverSubjectId === subject.id && draggedSubjectId !== subject.id
              const isLongSubjectName = subject.name.trim().length > 22

              return (
                <li
                  className={`subject-item ${activePlanId && !isEditMode ? 'subject-item-draggable' : ''} ${isEditMode && editingSubjectId !== subject.id ? 'subject-item-editable' : ''} ${isDragging ? 'is-dragging' : ''} ${isDropTarget ? 'is-drop-target' : ''}`}
                  key={subject.id}
                  draggable={Boolean(activePlanId && !isEditMode)}
                  onDragStart={() => handleDragStart(subject.id)}
                  onDragOver={(event) => handleDragOver(event, subject.id)}
                  onDrop={(event) => handleDrop(event, subject.id)}
                  onDragEnd={handleDragEnd}
                  onClick={() => {
                    if (isEditMode && editingSubjectId !== subject.id) {
                      handleStartEdit(subject)
                    }
                  }}
                >
                  {editingSubjectId === subject.id ? (
                    <>
                      <div className="subject-item-main subject-item-main-editing">
                        <div className="subject-edit-fields">
                          <input
                            className="subject-input"
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            placeholder="Nome da matéria"
                            onClick={(event) => event.stopPropagation()}
                          />
                          <input
                            className="subject-input subject-period-input"
                            type="text"
                            inputMode="numeric"
                            value={editingPeriod}
                            placeholder="2025.1"
                            onChange={(e) => setEditingPeriod(formatSubjectPeriodInput(e.target.value))}
                            onClick={(event) => event.stopPropagation()}
                          />
                        </div>
                        <p className="task-subject-label">
                          {completedTasksForSubject}/{totalTasksForSubject} tarefas concluídas
                        </p>
                      </div>

                      <div className="subject-actions-column" onClick={(event) => event.stopPropagation()}>
                        <button
                          type="button"
                          className="subject-edit-button"
                          onClick={() => handleSaveEdit(subject.id)}
                        >
                          Salvar
                        </button>
                        <button
                          type="button"
                          className="subject-edit-button subject-edit-button-secondary"
                          onClick={handleCancelEdit}
                        >
                          Cancelar
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="subject-item-main">
                        <div className="subject-name-row">
                          <span
                            className="plan-color-dot"
                            style={{ '--plan-color': plan?.color || '#c46b2d' }}
                            aria-hidden="true"
                          />
                          <span
                            className={`subject-name${isLongSubjectName ? ' subject-name--long' : ''}`}
                            title={subject.name}
                          >
                            {subject.name}
                          </span>
                        </div>
                        <div className="subject-meta-row">
                          <span className="subject-period-badge">
                            {subject.period || 'Período não definido'}
                          </span>
                          <p className="task-subject-label">
                            {completedTasksForSubject}/{totalTasksForSubject} tarefas concluídas
                          </p>
                        </div>
                      </div>

                      <div className="subject-actions-column" onClick={(event) => event.stopPropagation()}>
                        <button
                          className="subject-remove-button"
                          onClick={() => handleRemoveSubject(subject.id)}
                        >
                          ✕
                        </button>
                      </div>
                    </>
                  )}
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="empty-message">
            Nenhuma matéria cadastrada ainda.
          </p>
        )}
      </section>
    </Card>
  )
}

export default SubjectList
