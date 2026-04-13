import { useEffect, useMemo, useReducer, useState } from 'react'
import Header from '../components/layout/Header'
import SummaryCard from '../components/ui/SummaryCard'
import SubjectList from '../components/study/SubjectList'
import TaskList from '../components/study/TaskList'
import TodaySubjectRecommendation from '../components/study/TodaySubjectRecommendation'
import Footer from '../components/layout/Footer'
import PlanManager from '../components/plans/PlanManager'
import { taskReducer } from '../reducers/taskReducer'
import { getCurrentAcademicPeriod } from '../utils/academicPeriod'

function Dashboard() {
	const defaultPlanColor = '#c46b2d'

	function formatDate(date) {
		if (!date) return ''

		return new Intl.DateTimeFormat('pt-BR', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric'
		}).format(new Date(`${date}T00:00:00`))
	}

	const [plans, setPlans] = useState(() => {
		const stored =
			localStorage.getItem('plans') || localStorage.getItem('studyPlans')
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
	})

	const [subjects, setSubjects] = useState(() => {
		const stored = localStorage.getItem('subjects')
		return stored ? JSON.parse(stored) : []
	})

 const [tasks, dispatch] = useReducer(taskReducer, [], () => {
		const stored = localStorage.getItem('tasks')
		return stored ? JSON.parse(stored) : []
	})

	const [agendaItems] = useState(() => {
		const stored = localStorage.getItem('agendaItems')
		return stored ? JSON.parse(stored) : []
	})

	const [selectedPlanId, setSelectedPlanId] = useState(null)
	const [isRecommendationVisible, setIsRecommendationVisible] = useState(false)
	const planForCreation = selectedPlanId ?? plans[0]?.id ?? null
	const currentAcademicPeriod = useMemo(() => getCurrentAcademicPeriod(), [])

	const subjectsById = useMemo(() => {
		const map = new Map()
		subjects.forEach((subject) => {
			map.set(subject.id, subject)
		})
		return map
	}, [subjects])

	useEffect(() => {
		const defaultPlanId = plans[0]?.id
		if (!defaultPlanId) return

		const plansNeedColor = plans.some((plan) => !plan.color)
		if (plansNeedColor) {
			setPlans((prev) =>
				prev.map((plan) =>
					plan.color ? plan : { ...plan, color: defaultPlanColor }
				)
			)
		}

		const subjectsNeedPlan = subjects.some((s) => !s.planId)
		if (subjectsNeedPlan) {
			setSubjects((prev) =>
				prev.map((s) => (s.planId ? s : { ...s, planId: defaultPlanId }))
			)
		}

		const tasksNeedPlan = tasks.some((t) => !t.planId)
		if (tasksNeedPlan) {
			dispatch({
				type: 'HYDRATE',
				payload: tasks.map((t) =>
					t.planId ? t : { ...t, planId: defaultPlanId }
				)
			})
		}
	}, [defaultPlanColor, plans, subjects, tasks])

	const filteredSubjects = useMemo(() => {
		const periodSubjects = subjects.filter(
			(subject) =>
				!subject.period || subject.period === currentAcademicPeriod
		)

		if (!selectedPlanId) return periodSubjects

		return periodSubjects.filter((subject) => subject.planId === selectedPlanId)
	}, [currentAcademicPeriod, selectedPlanId, subjects])

	const filteredTasks = useMemo(() => {
		const tasksByPlan = selectedPlanId
			? tasks.filter((task) => task.planId === selectedPlanId)
			: tasks

		return tasksByPlan.filter((task) => {
			const subject = subjectsById.get(task.subjectId)
			if (!subject) return false
			return !subject.period || subject.period === currentAcademicPeriod
		})
	}, [currentAcademicPeriod, selectedPlanId, subjectsById, tasks])

	const visibleTasks = useMemo(
		() => filteredTasks.filter((task) => !task.archived),
		[filteredTasks]
	)
	const archivedTasks = useMemo(
		() => filteredTasks.filter((task) => task.archived).length,
		[filteredTasks]
	)

	const pendingTasks = useMemo(
		() => visibleTasks.filter((task) => !task.completed).length,
		[visibleTasks]
	)
	const completedTasks = useMemo(
		() => visibleTasks.filter((task) => task.completed).length,
		[visibleTasks]
	)
	const completedTasksIncludingArchived = useMemo(
		() => filteredTasks.filter((task) => task.completed).length,
		[filteredTasks]
	)
	const progressPercent = useMemo(() => {
		if (filteredTasks.length === 0) return 0
		return Math.round((completedTasksIncludingArchived / filteredTasks.length) * 100)
	}, [filteredTasks.length, completedTasksIncludingArchived])

	const nextDeadlineTask = useMemo(() => {
		const pendingWithDeadline = visibleTasks
			.filter((task) => !task.completed && task.dueDate)
			.sort((a, b) => a.dueDate.localeCompare(b.dueDate))

		return pendingWithDeadline[0] ?? null
	}, [visibleTasks])

	const nextDeadlineSubject = useMemo(() => {
		if (!nextDeadlineTask) return null

		return filteredSubjects.find(
			(subject) => subject.id === nextDeadlineTask.subjectId
		) ?? null
	}, [filteredSubjects, nextDeadlineTask])

	useEffect(() => {
		localStorage.setItem('plans', JSON.stringify(plans))
		localStorage.setItem('studyPlans', JSON.stringify(plans))
	}, [plans])

	useEffect(() => {
		const syncPlans = () => {
			const stored =
				localStorage.getItem('plans') || localStorage.getItem('studyPlans')
			if (stored) {
				setPlans(JSON.parse(stored))
			}
		}

		window.addEventListener('study-plans-updated', syncPlans)
		window.addEventListener('storage', syncPlans)

		return () => {
			window.removeEventListener('study-plans-updated', syncPlans)
			window.removeEventListener('storage', syncPlans)
		}
	}, [])

	useEffect(() => {
		localStorage.setItem('subjects', JSON.stringify(subjects))
	}, [subjects])

	useEffect(() => {
		localStorage.setItem('tasks', JSON.stringify(tasks))
	}, [tasks])

	function handleAddPlan(newPlan) {
		const plan = { id: Date.now(), ...newPlan }
		setPlans((prev) => [...prev, plan])
		setSelectedPlanId(plan.id)
	}

	function handleEditPlan(planId, changes) {
		setPlans((prev) =>
			prev.map((plan) =>
				plan.id === planId ? { ...plan, ...changes } : plan
			)
		)
	}

	function handleDeletePlan(planId) {
		setPlans((prev) => prev.filter((p) => p.id !== planId))
		setSelectedPlanId((prev) => (prev === planId ? null : prev))
		// opcional: remover plano das matérias/tarefas? manter dados para reatribuição manual.
	}

	return (
		<section className="dashboard-content">
			<Header />

			<section className="summary-grid">
				<SummaryCard
					title="Matérias ativas"
					value={filteredSubjects.length}
					description="Total de matérias cadastradas"
					variant="brand"
					icon={
						<svg viewBox="0 0 24 24" fill="none" role="img">
							<path
								d="M4.75 6.75A2.75 2.75 0 0 1 7.5 4h9A2.75 2.75 0 0 1 19.25 6.75v10.5A2.75 2.75 0 0 1 16.5 20h-9a2.75 2.75 0 0 1-2.75-2.75V6.75Z"
								stroke="currentColor"
								strokeWidth="1.7"
							/>
							<path
								d="M8 8.5h8M8 12h8M8 15.5h4.5"
								stroke="currentColor"
								strokeWidth="1.7"
								strokeLinecap="round"
							/>
						</svg>
					}
				/>

				<SummaryCard
					title="Tarefas pendentes"
					value={pendingTasks}
					description="Ainda restam tarefas por fazer"
					variant="warning"
					icon={
						<svg viewBox="0 0 24 24" fill="none" role="img">
							<path
								d="M7.75 6.75h8.5a2.5 2.5 0 0 1 2.5 2.5v7a2.5 2.5 0 0 1-2.5 2.5h-8.5a2.5 2.5 0 0 1-2.5-2.5v-7a2.5 2.5 0 0 1 2.5-2.5Z"
								stroke="currentColor"
								strokeWidth="1.7"
							/>
							<path
								d="M8.5 4.75v3.5M15.5 4.75v3.5M8.75 11.25h6.5"
								stroke="currentColor"
								strokeWidth="1.7"
								strokeLinecap="round"
							/>
						</svg>
					}
				/>

				<SummaryCard
					title="Progresso geral"
					value={`${progressPercent}%`}
					description="Percentual de tarefas concluídas"
					variant="success"
					icon={
						<svg viewBox="0 0 24 24" fill="none" role="img">
							<path
								d="M5 16.25 9.25 12l3 3 6.75-7"
								stroke="currentColor"
								strokeWidth="1.9"
								strokeLinecap="round"
								strokeLinejoin="round"
							/>
							<path
								d="M18 8h1.75v1.75"
								stroke="currentColor"
								strokeWidth="1.9"
								strokeLinecap="round"
								strokeLinejoin="round"
							/>
						</svg>
					}
				/>

				<SummaryCard
					title="Prazo mais próximo"
					value={nextDeadlineTask ? nextDeadlineTask.text : 'Sem prazos'}
					description={
						nextDeadlineTask
							? `${nextDeadlineSubject?.name || 'Sem matéria'} • vence em ${formatDate(nextDeadlineTask.dueDate)}`
							: 'Nenhuma tarefa pendente com prazo definido'
					}
					variant="alert"
					icon={
						<svg viewBox="0 0 24 24" fill="none" role="img">
							<path
								d="M12 3.75a4.75 4.75 0 0 0-4.75 4.75v2.13c0 .62-.2 1.23-.56 1.74l-1.1 1.57a1.75 1.75 0 0 0 1.43 2.76h9.96a1.75 1.75 0 0 0 1.43-2.76l-1.1-1.57a3 3 0 0 1-.56-1.74V8.5A4.75 4.75 0 0 0 12 3.75Z"
								stroke="currentColor"
								strokeWidth="1.7"
							/>
							<path
								d="M9.75 18.25a2.25 2.25 0 0 0 4.5 0"
								stroke="currentColor"
								strokeWidth="1.7"
								strokeLinecap="round"
							/>
						</svg>
					}
				/>
			</section>

			<TodaySubjectRecommendation
				subjects={filteredSubjects}
				tasks={filteredTasks}
				agendaItems={agendaItems}
				plans={plans}
				isOpen={isRecommendationVisible}
				onClose={() => setIsRecommendationVisible(false)}
			/>

				<PlanManager
					plans={plans}
					selectedPlanId={selectedPlanId}
					onSelectPlan={setSelectedPlanId}
					onAddPlan={handleAddPlan}
					onEditPlan={handleEditPlan}
					onDeletePlan={handleDeletePlan}
					isRecommendationVisible={isRecommendationVisible}
					onToggleRecommendation={() => setIsRecommendationVisible((prev) => !prev)}
					subjects={subjects}
					tasks={tasks}
				/>

			<section className="split-grid">
				<SubjectList
					subjects={subjects}
					visibleSubjects={filteredSubjects}
					plans={plans}
					setSubjects={setSubjects}
					isLoadingSubjects={false}
					tasks={filteredTasks}
					activePlanId={planForCreation}
				/>
				<TaskList
					tasks={visibleTasks}
					dispatch={dispatch}
					pendingTasks={pendingTasks}
					completedTasks={completedTasks}
					archivedTasks={archivedTasks}
					subjects={filteredSubjects}
					activePlanId={planForCreation}
					plans={plans}
				/>
			</section>
			<Footer />
		</section>
	)
}

export default Dashboard
