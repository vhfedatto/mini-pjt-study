import { useEffect, useRef, useState, useCallback } from 'react'
import Card from '../ui/Card'

function SubjectList({ subjects, setSubjects, isLoadingSubjects, tasks = [] }) {
  const [newSubject, setNewSubject] = useState('')
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

    const exists = subjects.some(
      (s) => s.name.toLowerCase() === trimmedSubject.toLowerCase()
    )

    if (exists){
      alert('Matéria já existe')
      return
    } 

    setSubjects([
      ...subjects,
      { id: Date.now(), name: trimmedSubject }
    ])

    setNewSubject('')
    inputRef.current?.focus()
  }, [newSubject, subjects, setSubjects])
  

  function handleRemoveSubject(id) {
    const hasLinkedTasks = tasks.some((task) => task.subjectId === id)

    if (hasLinkedTasks) {
      alert('Essa matéria possui tarefas vinculadas. Remova ou altere as tarefas antes.')
      return
    }

    const filteredSubjects = subjects.filter((subject) => subject.id !== id)
    setSubjects(filteredSubjects)
  }

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
        ) : subjects.length > 0 ? (
          <ul
            className={`subject-list ${
              subjects.length >= 4 ? 'subject-list-grid' : ''
            }`}
          >
            {subjects.map((subject) => {
              const totalTasksForSubject = tasks.filter(
                (task) => task.subjectId === subject.id
              ).length

              const completedTasksForSubject = tasks.filter(
                (task) => task.subjectId === subject.id && task.completed
              ).length

              return (
                <li className="subject-item" key={subject.id}>
                  <div>
                    <span className="subject-name">{subject.name}</span>
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
