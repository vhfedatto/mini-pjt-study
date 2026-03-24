import { useState } from 'react'
import Card from '../ui/Card';

function SubjectList({ subjects, setSubjects }) {
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

    function handleRemoveSubject(id) {
        const filtered = subjects.filter((subject) => subject.id !== id)
        setSubjects(filtered)
    }

    return (
        <Card>
            <section>
                <h2>Matérias</h2>
                <div>
                    <input type="text" placeholder="Nova matéria" value={newSubject} onChange={(e) => setNewSubject(e.target.value)}/>
                    <button onClick={handleAddSubject}>Adicionar</button>
                </div>
            <ul>
                {subjects.map((subject) => (
                <li key={subject.id}>{subject.name}
                    <button onClick={() => handleRemoveSubject(subject.id)}>❌</button>
                </li>
                ))}
            </ul>
            </section>
        </Card>
    )
}

export default SubjectList