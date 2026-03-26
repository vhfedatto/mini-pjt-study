import { useEffect, useMemo, useState } from 'react'
import Header from '../components/layout/Header'
import SummaryCard from '../components/ui/SummaryCard'
import SubjectList from '../components/study/SubjectList'
import Footer from '../components/layout/Footer'

function Subjects() {
  const [subjects, setSubjects] = useState(() => {
    const stored = localStorage.getItem('subjects')
    return stored ? JSON.parse(stored) : []
  })

  const [tasks] = useState(() => {
    const stored = localStorage.getItem('tasks')
    return stored ? JSON.parse(stored) : []
  })

  const subjectsWithTasks = useMemo(
    () => subjects.filter((subject) => tasks.some((task) => task.subjectId === subject.id)).length,
    [subjects, tasks]
  )

  const subjectsWithoutTasks = subjects.length - subjectsWithTasks

  useEffect(() => {
    localStorage.setItem('subjects', JSON.stringify(subjects))
  }, [subjects])

  return (
    <section className="dashboard-content">
      <Header />

      <section className="summary-grid">
        <SummaryCard
          title="Total de matérias"
          value={subjects.length}
          description="Matérias cadastradas"
        />
        <SummaryCard
          title="Com tarefas"
          value={subjectsWithTasks}
          description="Matérias vinculadas a tarefas"
        />
        <SummaryCard
          title="Sem tarefas"
          value={subjectsWithoutTasks}
          description="Matérias ainda sem atividades"
        />
      </section>

      <SubjectList
        subjects={subjects}
        setSubjects={setSubjects}
        isLoadingSubjects={false}
        tasks={tasks}
      />

      <Footer />
    </section>
  )
}

export default Subjects
