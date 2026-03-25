import { useMemo } from 'react'
import Header from '../components/layout/Header'
import SummaryCard from '../components/ui/SummaryCard'
import Footer from '../components/layout/Footer'
import Card from '../components/ui/Card'

function Progress() {
  const subjects = useMemo(() => JSON.parse(localStorage.getItem('subjects') || '[]'), [])
  const tasks = useMemo(() => JSON.parse(localStorage.getItem('tasks') || '[]'), [])

  const totalTasks = tasks.length
  const completedTasks = useMemo(
    () => tasks.filter((task) => task.completed).length,
    [tasks]
  )
  const pendingTasks = totalTasks - completedTasks
  const progressPercent = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100)

  const progressBySubject = useMemo(() => {
    const map = {}

    subjects.forEach((subject) => {
      map[subject.id] = {
        subjectName: subject.name,
        total: 0,
        completed: 0
      }
    })

    tasks.forEach((task) => {
      const subjectProgress = map[task.subjectId] || {
        subjectName: 'Sem matéria',
        total: 0,
        completed: 0
      }

      subjectProgress.total += 1
      if (task.completed) subjectProgress.completed += 1
      map[task.subjectId] = subjectProgress
    })

    return Object.values(map)
  }, [subjects, tasks])

  return (
    <section className="dashboard-content">
        <Header />

        <section className="summary-grid">
          <SummaryCard title="Total de tarefas" value={totalTasks} description="Tarefas cadastradas" />
          <SummaryCard title="Tarefas concluídas" value={completedTasks} description="Tarefas marcadas como feitas" />
          <SummaryCard title="Tarefas pendentes" value={pendingTasks} description="Tarefas ainda abertas" />
          <SummaryCard title="Progresso geral" value={`${progressPercent}%`} description="Percentual concluído" />
        </section>

        <Card>
          <h2 className="section-title">Progresso por matéria</h2>
          <div className="progress-table">
            <div className="progress-row progress-row-header">
              <div>Matéria</div>
              <div>Total</div>
              <div>Concluídas</div>
              <div>%</div>
            </div>
            {progressBySubject.map((item) => {
              const percent = item.total === 0 ? 0 : Math.round((item.completed / item.total) * 100)
              return (
                <div className="progress-row" key={item.subjectName}>
                  <div>{item.subjectName}</div>
                  <div>{item.total}</div>
                  <div>{item.completed}</div>
                  <div>{percent}%</div>
                </div>
              )
            })}
          </div>

          <div className="progress-bar-wrapper">
            <div className="progress-bar-track">
              <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }} />
            </div>
            <span>{progressPercent}% concluído</span>
          </div>
        </Card>

        <Footer />
      </section>
  )
}

export default Progress
