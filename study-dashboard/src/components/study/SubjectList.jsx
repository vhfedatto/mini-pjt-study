import { useEffect, useRef, useState } from 'react'
import Card from '../ui/Card'
import { useCallback } from 'react'

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
