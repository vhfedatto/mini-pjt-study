import { useEffect, useRef, useState } from 'react'
import Card from '../ui/Card'

function SubjectList({ subjects, setSubjects, isLoadingSubjects }) {
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

  function handleAddSubject() {
    const trimmedSubject = newSubject.trim()

    if (trimmedSubject === '') return

    const subjectAlreadyExists = subjects.some(
      (subject) => subject.name.toLowerCase() === trimmedSubject.toLowerCase()
    )

    if (subjectAlreadyExists) {
      alert('Essa matéria já foi adicionada.')
      return
    }

    const newItem = {
      id: Date.now(),
      name: trimmedSubject
    }

    setSubjects([...subjects, newItem])
    setNewSubject('')
    inputRef.current?.focus()
  }

  function handleRemoveSubject(id) {
    const filteredSubjects = subjects.filter((subject) => subject.id !== id)
    setSubjects(filteredSubjects)
  }

  return (
    <Card>
      <section className="subject-section">
        <h2 className="section-title">Matérias</h2>

        <div className="subject-form">
          <input
            ref={inputRef}
            className="subject-input"
            type="text"
            placeholder="Nova matéria"
            value={newSubject}
            onChange={(e) => setNewSubject(e.target.value)}
          />

          <button className="subject-add-button" onClick={handleAddSubject}>
            Adicionar
          </button>
        </div>

        {isLoadingSubjects ? (
          <p className="empty-message">Carregando matérias...</p>
        ) : subjects.length > 0 ? (
          <ul className="subject-list">
            {subjects.map((subject) => (
              <li className="subject-item" key={subject.id}>
                <span className="subject-name">{subject.name}</span>

                <button
                  className="subject-remove-button"
                  onClick={() => handleRemoveSubject(subject.id)}
                >
                  ✕
                </button>
              </li>
            ))}
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