import { useEffect, useMemo, useState } from 'react'
import Header from '../components/layout/Header'
import SummaryCard from '../components/ui/SummaryCard'
import Footer from '../components/layout/Footer'
import Card from '../components/ui/Card'

function StudyProgress() {
  const defaultPlanColor = '#c46b2d'
  const [isArchivedTasksOpen, setIsArchivedTasksOpen] = useState(false)
  const [plans, setPlans] = useState(() =>
    JSON.parse(localStorage.getItem('plans') || localStorage.getItem('studyPlans') || '[]')
  )
  const [subjects, setSubjects] = useState(() => JSON.parse(localStorage.getItem('subjects') || '[]'))
  const [tasks, setTasks] = useState(() => JSON.parse(localStorage.getItem('tasks') || '[]'))

  const totalTasks = tasks.length
  const completedTasks = useMemo(
    () => tasks.filter((task) => task.completed).length,
    [tasks]
  )
  const pendingTasks = totalTasks - completedTasks
  const progressPercent = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100)
  const archivedTasks = useMemo(
    () => tasks.filter((task) => task.archived),
    [tasks]
  )

  useEffect(() => {
    const syncProgressData = () => {
      setPlans(JSON.parse(localStorage.getItem('plans') || localStorage.getItem('studyPlans') || '[]'))
      setSubjects(JSON.parse(localStorage.getItem('subjects') || '[]'))
      setTasks(JSON.parse(localStorage.getItem('tasks') || '[]'))
    }

    globalThis.addEventListener('storage', syncProgressData)

    return () => {
      globalThis.removeEventListener('storage', syncProgressData)
    }
  }, [])

  const progressBySubject = useMemo(() => {
    const map = {}

    subjects.forEach((subject) => {
      const linkedPlan = plans.find((plan) => plan.id === subject.planId)
      map[subject.id] = {
        subjectId: subject.id,
        subjectName: subject.name,
        planName: linkedPlan?.name || 'Plano sem nome',
        planColor: linkedPlan?.color || defaultPlanColor,
        total: 0,
        completed: 0
      }
    })

    tasks.forEach((task) => {
      const subjectProgress = map[task.subjectId] || {
        subjectId: task.subjectId,
        subjectName: 'Sem matéria',
        planName: 'Plano sem nome',
        planColor: defaultPlanColor,
        total: 0,
        completed: 0
      }

      subjectProgress.total += 1
      if (task.completed) subjectProgress.completed += 1
      map[task.subjectId] = subjectProgress
    })

    return Object.values(map)
  }, [defaultPlanColor, plans, subjects, tasks])

  const handleUnarchiveTask = (taskId) => {
    const nextTasks = tasks.map((task) =>
      task.id === taskId
        ? { ...task, archived: false, completed: true }
        : task
    )

    setTasks(nextTasks)
    localStorage.setItem('tasks', JSON.stringify(nextTasks))
    globalThis.dispatchEvent(new Event('storage'))
  }

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
        <div className="progress-card-header">
          <h2 className="section-title">Progresso por matéria</h2>
          <button
            type="button"
            className="plan-action-btn"
            onClick={() => setIsArchivedTasksOpen(true)}
          >
            Mostrar Tarefas Arquivadas
          </button>
        </div>
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
              <div className="progress-row" key={item.subjectId ?? item.subjectName}>
                <div>
                  <span className="progress-subject-label">
                    <span
                      className="plan-color-dot"
                      style={{ '--plan-color': item.planColor }}
                      aria-hidden="true"
                    />
                    <span className="progress-subject-name">{item.subjectName}</span>
                    <span className="progress-plan-name">{item.planName}</span>
                  </span>
                </div>
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

      {isArchivedTasksOpen ? (
        <div
          className="plan-modal-overlay"
          role="presentation"
          onClick={() => setIsArchivedTasksOpen(false)}
        >
          <div
            className="plan-modal progress-archived-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="archived-tasks-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="important-date-modal-header">
              <div>
                <h2 id="archived-tasks-title" className="plan-modal-title">Tarefas arquivadas</h2>
                <p className="settings-helper">
                  Histórico das tarefas concluídas e arquivadas para não poluir o dashboard inicial.
                </p>
              </div>
              <button
                type="button"
                className="subject-remove-button"
                onClick={() => setIsArchivedTasksOpen(false)}
              >
                ✕
              </button>
            </div>

            {archivedTasks.length > 0 ? (
              <ul className="progress-archived-list">
                {archivedTasks.map((task) => {
                  const linkedSubject = subjects.find((subject) => subject.id === task.subjectId)
                  const linkedPlan = plans.find((plan) => plan.id === task.planId)

                  return (
                    <li key={task.id} className="progress-archived-item subject-item task-item completed">
                      <div className="progress-archived-copy">
                        <strong className="task-text done">{task.text}</strong>
                        <span>{linkedSubject?.name || 'Sem matéria'}</span>
                        <span>{linkedPlan?.name || 'Plano sem nome'}</span>
                        <span>{task.dueDate ? `Prazo: ${new Intl.DateTimeFormat('pt-BR').format(new Date(`${task.dueDate}T00:00:00`))}` : 'Sem prazo'}</span>
                      </div>
                      <button
                        type="button"
                        className="plan-action-btn progress-archived-action"
                        onClick={() => handleUnarchiveTask(task.id)}
                      >
                        Desarquivar
                      </button>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <p className="empty-message">Nenhuma tarefa arquivada até agora.</p>
            )}
          </div>
        </div>
      ) : null}

      <Footer />
    </section>
  )
}

export default StudyProgress
