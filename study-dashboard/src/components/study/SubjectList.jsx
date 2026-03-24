import { useState } from 'react'

function SubjectList() {
    const [subjects, setSubjects] = useState([
        { id: 1, name: 'Matemática' },
        { id: 2, name: 'Geografia' },
        { id: 3, name: 'Ciência Política' }
    ])
    
    const [newSubject, setNewSubject] = useState('')

    function handleAddSubject() {
        if (newSubject.trim() === '') return

        const newItem = {
            id: Date.now(),
            name: newSubject
        }

        setSubjects([...subjects, newItem])
        setNewSubject('')
    }
    
    return (
        <section>
            <h2>Matérias</h2>

            <div>
                <input type="text" placeholder="Nova matéria" value={newSubject} onChange={(e) => setNewSubject(e.target.value)} />

                <button onClick={handleAddSubject}>Adicionar</button>
            </div>

            <ul>
                {subjects.map((subject) => (<li key={subject.id}>{subject.name}</li>))}
            </ul>
        </section>
  )
}

export default SubjectList


// .map() serve para transformar cada item em jsx.
// key ajusta o React para identificar elementos.