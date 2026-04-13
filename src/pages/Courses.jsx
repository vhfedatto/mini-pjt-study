import { useEffect, useMemo, useState } from 'react'
import SummaryCard from '../components/ui/SummaryCard'
import SubjectList from '../components/study/SubjectList'
import Footer from '../components/layout/Footer'
import { getCurrentAcademicPeriod } from '../utils/academicPeriod'
import Card from '../components/ui/Card'

const defaultPlanColor = '#c46b2d'

function loadInitialPlans() {
  const stored = localStorage.getItem('plans') || localStorage.getItem('studyPlans')
  if (stored) return JSON.parse(stored)

  return [
    {
      id: Date.now(),
      name: 'Plano Geral',
      description: 'Organize todos os seus estudos aqui',
      goal: 'Manter o ritmo',
      color: defaultPlanColor
    }
  ]
}

function Courses() {
  const initialPlans = useMemo(() => loadInitialPlans(), [])
  const [plans, setPlans] = useState(initialPlans)
  const [subjects, setSubjects] = useState(() => {
    const stored = localStorage.getItem('subjects')
    return stored ? JSON.parse(stored) : []
  })
  const [tasks, setTasks] = useState(() => {
    const stored = localStorage.getItem('tasks')
    return stored ? JSON.parse(stored) : []
  })
  const [selectedPlanId, setSelectedPlanId] = useState(() => initialPlans[0]?.id ?? null)
  const [periodFilter, setPeriodFilter] = useState('all')
  const [customPeriod, setCustomPeriod] = useState('')
  const currentAcademicPeriod = useMemo(() => getCurrentAcademicPeriod(), [])
  const activePlanId = selectedPlanId ?? plans[0]?.id ?? null

  useEffect(() => {
    const defaultPlanId = plans[0]?.id
    if (!defaultPlanId) return

    const plansNeedColor = plans.some((plan) => !plan.color)
    if (plansNeedColor) {
      setPlans((prev) => prev.map((plan) => (plan.color ? plan : { ...plan, color: defaultPlanColor })))
    }

    const subjectsNeedPlan = subjects.some((subject) => !subject.planId)
    if (subjectsNeedPlan) {
      setSubjects((prev) => prev.map((subject) => (subject.planId ? subject : { ...subject, planId: defaultPlanId })))
    }

    const tasksNeedPlan = tasks.some((task) => !task.planId)
    if (tasksNeedPlan) {
      setTasks((prev) => prev.map((task) => (task.planId ? task : { ...task, planId: defaultPlanId })))
    }
  }, [plans, subjects, tasks])

  useEffect(() => {
    localStorage.setItem('plans', JSON.stringify(plans))
    localStorage.setItem('studyPlans', JSON.stringify(plans))
  }, [plans])

  useEffect(() => {
    localStorage.setItem('subjects', JSON.stringify(subjects))
  }, [subjects])

  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks))
  }, [tasks])

  useEffect(() => {
    const syncData = () => {
      const storedPlans = localStorage.getItem('plans') || localStorage.getItem('studyPlans')
      const storedSubjects = localStorage.getItem('subjects')
      const storedTasks = localStorage.getItem('tasks')

      if (storedPlans) setPlans(JSON.parse(storedPlans))
      if (storedSubjects) setSubjects(JSON.parse(storedSubjects))
      if (storedTasks) setTasks(JSON.parse(storedTasks))
    }

    window.addEventListener('study-plans-updated', syncData)
    window.addEventListener('storage', syncData)

    return () => {
      window.removeEventListener('study-plans-updated', syncData)
      window.removeEventListener('storage', syncData)
    }
  }, [])

  const currentSubjectsCount = useMemo(
    () => subjects.filter((subject) => !subject.period || subject.period === currentAcademicPeriod).length,
    [currentAcademicPeriod, subjects]
  )
  const pastSubjectsCount = useMemo(
    () => subjects.filter((subject) => subject.period && subject.period !== currentAcademicPeriod).length,
    [currentAcademicPeriod, subjects]
  )

  const filteredSubjects = useMemo(() => {
    let filtered = subjects

    if (selectedPlanId) {
      filtered = filtered.filter((subject) => subject.planId === selectedPlanId)
    }

    if (periodFilter === 'current') {
      filtered = filtered.filter((subject) => !subject.period || subject.period === currentAcademicPeriod)
    } else if (periodFilter === 'past') {
      filtered = filtered.filter((subject) => subject.period && subject.period !== currentAcademicPeriod)
    } else if (periodFilter === 'custom' && customPeriod.trim()) {
      const normalized = customPeriod.trim()
      filtered = filtered.filter((subject) => subject.period === normalized)
    }

    return filtered
  }, [currentAcademicPeriod, customPeriod, periodFilter, selectedPlanId, subjects])

  const periodChips = useMemo(() => {
    const uniquePeriods = new Set(subjects.map((subject) => subject.period).filter(Boolean))
    const sorted = Array.from(uniquePeriods).sort((a, b) => b.localeCompare(a))
    return sorted.slice(0, 6)
  }, [subjects])

  function handleResetFilters() {
    setPeriodFilter('all')
    setCustomPeriod('')
    setSelectedPlanId(plans[0]?.id ?? null)
  }

  return (
    <section className="dashboard-content">
      <section className="summary-grid">
        <SummaryCard
          title="Matérias no período atual"
          value={currentSubjectsCount}
          description={`Período ${currentAcademicPeriod}`}
          variant="brand"
          icon={(
            <svg viewBox="0 0 24 24" fill="none" role="img">
              <path d="M5.5 5.75h13" stroke="currentColor" strokeWidth="1.7" />
              <path d="M7.75 4.75h8.5A1.75 1.75 0 0 1 18 6.5v12.75a.75.75 0 0 1-1.14.63l-2.61-1.65a.75.75 0 0 0-.82 0l-2.61 1.65a.75.75 0 0 1-.82 0l-2.61-1.65a.75.75 0 0 0-.82 0L5.14 19.88A.75.75 0 0 1 4 19.25V6.5A1.75 1.75 0 0 1 5.75 4.75Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        />

        <SummaryCard
          title="Matérias de períodos passados"
          value={pastSubjectsCount}
          description="Visíveis apenas nesta aba"
          variant="warning"
          icon={(
            <svg viewBox="0 0 24 24" fill="none" role="img">
              <path d="M5 5.5h12.5A1.5 1.5 0 0 1 19 7v10.5a1.5 1.5 0 0 1-1.5 1.5H6A2 2 0 0 1 4 17V7A1.5 1.5 0 0 1 5.5 5.5Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              <path d="m9 9.5 3 2-3 2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        />

        <SummaryCard
          title="Planos com matérias"
          value={plans.length}
          description="Selecione para cadastrar novas"
          variant="success"
          icon={(
            <svg viewBox="0 0 24 24" fill="none" role="img">
              <path d="M7 5h10a2 2 0 0 1 2 2v11.5a.5.5 0 0 1-.77.42l-2.46-1.57a1 1 0 0 0-1.08 0l-2.46 1.57a1 1 0 0 1-1.08 0l-2.46-1.57a1 1 0 0 0-1.08 0l-2.46 1.57A.5.5 0 0 1 5 18.5V7a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M9 9.5h6M9 12.5h3.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            </svg>
          )}
        />
      </section>

      <Card className="courses-toolbar-card">
        <div className="subject-section-header">
          <div>
            <h2 className="section-title">Matérias por período</h2>
            <p className="courses-note">
              Adicione matérias antigas sem que elas apareçam no Dashboard. Apenas o período atual ({currentAcademicPeriod}) é mostrado lá.
            </p>
          </div>
          <button
            type="button"
            className="plan-current-period-button"
            onClick={() => {
              setPeriodFilter('current')
              setCustomPeriod('')
            }}
          >
            Ver somente período atual
          </button>
        </div>

        <div className="subject-form courses-filter-row">
          <select
            className="subject-input"
            value={selectedPlanId ?? ''}
            onChange={(event) => setSelectedPlanId(event.target.value ? Number(event.target.value) : null)}
          >
            <option value="">Todos os planos</option>
            {plans.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.name}
              </option>
            ))}
          </select>

          <select
            className="subject-input"
            value={periodFilter}
            onChange={(event) => setPeriodFilter(event.target.value)}
          >
            <option value="all">Todos os períodos</option>
            <option value="current">Somente período atual</option>
            <option value="past">Apenas períodos passados</option>
            <option value="custom">Período específico</option>
          </select>

          {periodFilter === 'custom' ? (
            <input
              className="subject-input subject-period-input"
              placeholder="2024.2"
              value={customPeriod}
              onChange={(event) => setCustomPeriod(event.target.value)}
            />
          ) : null}

          <button type="button" className="subject-add-button" onClick={handleResetFilters}>
            Limpar filtros
          </button>
        </div>

        {periodChips.length > 0 ? (
          <div className="courses-chip-row">
            <span className="courses-chip-label">Períodos já cadastrados:</span>
            <div className="courses-chip-group">
              {periodChips.map((period) => (
                <button
                  type="button"
                  key={period}
                  className={`chip-button${customPeriod === period ? ' is-active' : ''}`}
                  onClick={() => {
                    setPeriodFilter('custom')
                    setCustomPeriod(period)
                  }}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </Card>

      <section className="courses-content">
        <SubjectList
          subjects={subjects}
          visibleSubjects={filteredSubjects}
          plans={plans}
          setSubjects={setSubjects}
          isLoadingSubjects={false}
          tasks={tasks}
          activePlanId={activePlanId}
        />
      </section>

      <Footer />
    </section>
  )
}

export default Courses
