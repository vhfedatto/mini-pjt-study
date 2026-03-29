import { useMemo } from 'react'
import Header from '../components/layout/Header'
import SummaryCard from '../components/ui/SummaryCard'
import Footer from '../components/layout/Footer'
import Card from '../components/ui/Card'

function Progress() {
  // Cor padrão usada quando um plano não tem cor cadastrada.
  const defaultPlanColor = '#c46b2d'
  // Carrega os planos salvos para relacionar cada matéria ao seu plano.
  const plans = useMemo(
    () => JSON.parse(localStorage.getItem('plans') || localStorage.getItem('studyPlans') || '[]'),
    []
  )
  // Carrega as matérias salvas no navegador.
  const subjects = useMemo(() => JSON.parse(localStorage.getItem('subjects') || '[]'), [])
  // Carrega as tarefas salvas no navegador.
  const tasks = useMemo(() => JSON.parse(localStorage.getItem('tasks') || '[]'), [])

  // Total geral de tarefas cadastradas.
  const totalTasks = tasks.length
  // Quantidade de tarefas concluídas.
  const completedTasks = useMemo(
    () => tasks.filter((task) => task.completed).length,
    [tasks]
  )
  // Quantidade de tarefas ainda pendentes.
  const pendingTasks = totalTasks - completedTasks
  // Percentual geral de conclusão.
  const progressPercent = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100)

  // Agrupa o progresso por matéria e relaciona cada uma ao plano correspondente.
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

  return (
    <section className="dashboard-content">
        <Header />

        {/* Exibe os indicadores gerais de progresso. */}
        <section className="summary-grid">
          <SummaryCard title="Total de tarefas" value={totalTasks} description="Tarefas cadastradas" />
          <SummaryCard title="Tarefas concluídas" value={completedTasks} description="Tarefas marcadas como feitas" />
          <SummaryCard title="Tarefas pendentes" value={pendingTasks} description="Tarefas ainda abertas" />
          <SummaryCard title="Progresso geral" value={`${progressPercent}%`} description="Percentual concluído" />
        </section>

        <Card>
          {/* Tabela com o desempenho detalhado por matéria. */}
          <h2 className="section-title">Progresso por matéria</h2>
          <div className="progress-table">
            <div className="progress-row progress-row-header">
              <div>Matéria</div>
              <div>Total</div>
              <div>Concluídas</div>
              <div>%</div>
            </div>
            {progressBySubject.map((item) => {
              // Calcula o percentual individual de cada matéria.
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

          {/* Barra visual com o progresso geral acumulado. */}
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
