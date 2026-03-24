import { useState } from 'react'
import Sidebar from '../components/layout/Sidebar'
import Header from '../components/layout/Header'
import SummaryCard from '../components/ui/SummaryCard'
import SubjectList from '../components/study/SubjectList'

function Dashboard() {
  const [subjects, setSubjects] = useState([
    { id: 1, name: 'Direito Constitucional' },
    { id: 2, name: 'Algoritmos' },
    { id: 3, name: 'Banco de Dados' }
  ])

  return (
    <main className="dashboard-layout">
      <Sidebar />

      <section className="dashboard-content">
        <Header />

        <section className="summary-grid">
          <SummaryCard
            title="Matérias ativas"
            value={subjects.length}
            description="Total de matérias cadastradas"
          />

          <SummaryCard
            title="Tarefas pendentes"
            value="14"
            description="Ainda restam tarefas"
          />

          <SummaryCard
            title="Progresso geral"
            value="72%"
            description="Seu desempenho está ótimo"
          />
        </section>

        <SubjectList
          subjects={subjects}
          setSubjects={setSubjects}
        />
      </section>
    </main>
  )
}

export default Dashboard