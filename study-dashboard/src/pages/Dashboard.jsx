import { useEffect, useState } from 'react'
import Sidebar from '../components/layout/Sidebar'
import Header from '../components/layout/Header'
import SummaryCard from '../components/ui/SummaryCard'
import SubjectList from '../components/study/SubjectList'
import TaskList from '../components/study/TaskList'

function Dashboard() {
  const [subjects, setSubjects] = useState([])
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setSubjects([
        { id: 1, name: 'Back-end' },
        { id: 2, name: 'Banco de Dados' },
        { id: 3, name: 'Estrutura de Dados' }
      ])
      setIsLoadingSubjects(false)
    }, 1200)

    return () => {
      clearTimeout(timer)
    }
  }, [])

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
          isLoadingSubjects={isLoadingSubjects}
        />
        <TaskList />
      </section>
    </main>
  )
}

export default Dashboard