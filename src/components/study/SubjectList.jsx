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

function insertSubjectNearPlanGroup(subjects, nextSubject) {
  const lastSamePlanIndex = [...subjects].reverse().findIndex(
    (subject) => subject.planId === nextSubject.planId
  )

  if (lastSamePlanIndex === -1) {
    return [...subjects, nextSubject]
  }

  const insertAt = subjects.length - lastSamePlanIndex
  return [
    ...subjects.slice(0, insertAt),
    nextSubject,
    ...subjects.slice(insertAt)
  ]
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
  const [isEditMode, setIsEditMode] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const resetSubjectForm = useCallback(() => {
    setNewSubject('')
    setNewSubjectPeriod('')
    setEditingSubjectId(null)
  }, [])

  const handleSubmitSubject = useCallback(() => {
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

    const exists = subjects.some((subject) => {
      const isSamePlan = subject.planId === activePlanId
      const isSameName = subject.name.toLowerCase() === trimmedSubject.toLowerCase()
      const isDifferentSubject = editingSubjectId ? subject.id !== editingSubjectId : true

      return isSamePlan && isSameName && isDifferentSubject
    })

    if (exists) {
      alert(
        editingSubjectId
          ? 'Já existe outra matéria com esse nome neste plano.'
          : 'Matéria já existe'
      )
      return
    }

    if (editingSubjectId) {
      setSubjects((prev) =>
        prev.map((subject) =>
          subject.id === editingSubjectId
            ? { ...subject, name: trimmedSubject, period: formattedPeriod }
            : subject
        )
      )
    } else {
      setSubjects((prev) =>
        insertSubjectNearPlanGroup(prev, {
          id: Date.now(),
          name: trimmedSubject,
          period: formattedPeriod,
          planId: activePlanId
        })
      )
    }

    resetSubjectForm()
    inputRef.current?.focus()
  }, [activePlanId, editingSubjectId, newSubject, newSubjectPeriod, resetSubjectForm, setSubjects, subjects])
  

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
    setNewSubject(subject.name)
    setNewSubjectPeriod(subject.period || '')
    inputRef.current?.focus()
  }

  function handleCancelEdit() {
    resetSubjectForm()
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
      const visibleSubjectIds = new Set(orderedPlanSubjects.map((subject) => subject.id))
      const nextVisibleSubjects = [...reorderedPlanSubjects]
      const planSubjects = prev.filter((subject) => subject.planId === activePlanId)
      const mergedPlanSubjects = planSubjects.map((subject) => {
        if (!visibleSubjectIds.has(subject.id)) return subject
        return nextVisibleSubjects.shift() ?? subject
      })
      const nextPlanSubjects = [...mergedPlanSubjects]

      return prev.map((subject) => (
        subject.planId === activePlanId ? nextPlanSubjects.shift() ?? subject : subject
      ))
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
              if (e.key === 'Enter') handleSubmitSubject()
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
              if (e.key === 'Enter') handleSubmitSubject()
            }}
          />

          <button className="subject-add-button" onClick={handleSubmitSubject}>
            {editingSubjectId ? 'Atualizar' : 'Adicionar'}
          </button>
          {editingSubjectId ? (
            <button
              type="button"
              className="subject-edit-button subject-edit-button-secondary"
              onClick={handleCancelEdit}
            >
              Cancelar
            </button>
          ) : null}
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
              const isDragging = draggedSubjectId === subject.id
              const isDropTarget =
                dragOverSubjectId === subject.id && draggedSubjectId !== subject.id
              const isLongSubjectName = subject.name.trim().length > 22
              const isSelectedForEdit = editingSubjectId === subject.id

              return (
                <li
                  className={`subject-item ${activePlanId && !isEditMode ? 'subject-item-draggable' : ''} ${isEditMode ? 'subject-item-editable' : ''} ${isSelectedForEdit ? 'is-edit-selected' : ''} ${isDragging ? 'is-dragging' : ''} ${isDropTarget ? 'is-drop-target' : ''}`}
                  key={subject.id}
                  draggable={Boolean(activePlanId && !isEditMode)}
                  onDragStart={() => handleDragStart(subject.id)}
                  onDragOver={(event) => handleDragOver(event, subject.id)}
                  onDrop={(event) => handleDrop(event, subject.id)}
                  onDragEnd={handleDragEnd}
                  onClick={() => {
                    if (isEditMode) {
                      handleStartEdit(subject)
                    }
                  }}
                >
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
