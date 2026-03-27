import { useEffect, useMemo, useReducer, useState } from 'react'
import Header from '../components/layout/Header'
import SummaryCard from '../components/ui/SummaryCard'
import TaskList from '../components/study/TaskList'
import Footer from '../components/layout/Footer'
import { taskReducer } from '../reducers/taskReducer'

function Tasks() {
  const [plans] = useState(() => {
    const stored = localStorage.getItem('plans') || localStorage.getItem('studyPlans')
    return stored ? JSON.parse(stored) : []
  })

  const [subjects] = useState(() => {
    const stored = localStorage.getItem('subjects')
    return stored ? JSON.parse(stored) : []
  })

  const [tasks, dispatch] = useReducer(taskReducer, [], () => {
    const stored = localStorage.getItem('tasks')
    return stored ? JSON.parse(stored) : []
  })

  const pendingTasks = useMemo(
    () => tasks.filter((task) => !task.completed).length,
    [tasks]
  )

  const completedTasks = useMemo(
    () => tasks.filter((task) => task.completed).length,
    [tasks]
  )

  const progressPercent = useMemo(() => {
    if (tasks.length === 0) return 0
    return Math.round((completedTasks / tasks.length) * 100)
  }, [tasks.length, completedTasks])

  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks))
  }, [tasks])

  return (
    <section className="dashboard-content">
      <Header />

      <section className="summary-grid">
        <SummaryCard
          title="Total de tarefas"
          value={tasks.length}
          description="Tarefas cadastradas"
        />

        <SummaryCard
          title="Pendentes"
          value={pendingTasks}
          description="Ainda restam tarefas por fazer"
        />

        <SummaryCard
          title="Concluídas"
          value={completedTasks}
          description="Tarefas finalizadas"
        />

        <SummaryCard
          title="Progresso"
          value={`${progressPercent}%`}
          description="Percentual concluído"
        />
      </section>

      <TaskList
        tasks={tasks}
        dispatch={dispatch}
        pendingTasks={pendingTasks}
        completedTasks={completedTasks}
        subjects={subjects}
        plans={plans}
      />

      <Footer />
    </section>
  )
}

export default Tasks
