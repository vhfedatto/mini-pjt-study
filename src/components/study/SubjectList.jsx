import { useEffect, useRef, useState, useCallback } from 'react'
import Card from '../ui/Card'

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
  const [draggedSubjectId, setDraggedSubjectId] = useState(null)
  const [dragOverSubjectId, setDragOverSubjectId] = useState(null)
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    if (newSubject.length > 0) {
      console.log('O input foi alterado:', newSubject)
    }
  }, [newSubject])

  const handleAddSubject = useCallback(() => {
    const trimmedSubject = newSubject.trim()
    if (trimmedSubject === '') return
    if (!activePlanId) {
      alert('Selecione ou crie um plano antes de adicionar matérias.')
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
      { id: Date.now(), name: trimmedSubject, planId: activePlanId }
    ])

    setNewSubject('')
    inputRef.current?.focus()
  }, [activePlanId, newSubject, setSubjects, subjects])
  

  function handleRemoveSubject(id) {
    const hasLinkedTasks = tasks.some((task) => task.subjectId === id)

    if (hasLinkedTasks) {
      alert('Essa matéria possui tarefas vinculadas. Remova ou altere as tarefas antes.')
      return
    }

    setSubjects((prev) => prev.filter((subject) => subject.id !== id))
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

    if (!activePlanId || !draggedSubjectId || draggedSubjectId === targetSubjectId) {
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
  }, [activePlanId, draggedSubjectId, handleDragEnd, setSubjects, visibleSubjects])

  return (
    <Card>
      <section className="panel-section subject-section">
        <h2 className="section-title">Matérias</h2>

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

              return (
                <li
                  className={`subject-item ${activePlanId ? 'subject-item-draggable' : ''} ${isDragging ? 'is-dragging' : ''} ${isDropTarget ? 'is-drop-target' : ''}`}
                  key={subject.id}
                  draggable={Boolean(activePlanId)}
                  onDragStart={() => handleDragStart(subject.id)}
                  onDragOver={(event) => handleDragOver(event, subject.id)}
                  onDrop={(event) => handleDrop(event, subject.id)}
                  onDragEnd={handleDragEnd}
                >
                  <div className="subject-item-main">
                    <div className="subject-name-row">
                      <span
                        className="plan-color-dot"
                        style={{ '--plan-color': plan?.color || '#c46b2d' }}
                        aria-hidden="true"
                      />
                      <span className="subject-name">{subject.name}</span>
                    </div>
                    <p className="task-subject-label">
                      {completedTasksForSubject}/{totalTasksForSubject} tarefas concluídas
                    </p>
                  </div>

                  <button
                    className="subject-remove-button"
                    onClick={() => handleRemoveSubject(subject.id)}
                  >
                    ✕
                  </button>
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
