import { useState } from 'react'

function SubjectList() {
    // Estado agora é uma lista.
    const [subjects, setSubjects] = useState([
        'Direito Constitucional',
        'Algoritmos',
        'Banco de Dados'
    ])

  return (
    <section>
      <h2>Matérias</h2>

      <ul>
        {subjects.map((subject, index) => (
          <li key={index}>{subject}</li>
        ))}
      </ul>
    </section>
  )
}

export default SubjectList


// .map() serve para transformar cada item em jsx.
// key ajusta o React para identificar elementos.