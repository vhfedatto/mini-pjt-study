import { useEffect, useMemo, useReducer, useState } from 'react'
import Header from '../components/layout/Header'
import SummaryCard from '../components/ui/SummaryCard'
import SubjectList from '../components/study/SubjectList'
import TaskList from '../components/study/TaskList'
import Footer from '../components/layout/Footer'
import PlanManager from '../components/plans/PlanManager'
import { taskReducer } from '../reducers/taskReducer'

function Dashboard() {
	const [plans, setPlans] = useState(() => {
		const stored =
			localStorage.getItem('plans') || localStorage.getItem('studyPlans')
		if (stored) return JSON.parse(stored)

		return [
			{
				id: Date.now(),
				name: 'Plano Geral',
				description: 'Organize todos os seus estudos aqui',
				goal: 'Manter o ritmo'
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

	const [selectedPlanId, setSelectedPlanId] = useState(null)
	const planForCreation = selectedPlanId ?? plans[0]?.id ?? null

	useEffect(() => {
		const defaultPlanId = plans[0]?.id
		if (!defaultPlanId) return

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
	}, [plans, subjects, tasks])

	const filteredSubjects = useMemo(
		() =>
			selectedPlanId
				? subjects.filter((subject) => subject.planId === selectedPlanId)
				: subjects,
		[subjects, selectedPlanId]
	)

	const filteredTasks = useMemo(
		() =>
			selectedPlanId
				? tasks.filter((task) => task.planId === selectedPlanId)
				: tasks,
		[tasks, selectedPlanId]
	)

	const pendingTasks = useMemo(
		() => filteredTasks.filter((task) => !task.completed).length,
		[filteredTasks]
	)
	const completedTasks = useMemo(
		() => filteredTasks.filter((task) => task.completed).length,
		[filteredTasks]
	)
	const progressPercent = useMemo(() => {
		if (filteredTasks.length === 0) return 0
		return Math.round((completedTasks / filteredTasks.length) * 100)
	}, [filteredTasks.length, completedTasks])

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
				/>

				<SummaryCard
					title="Tarefas pendentes"
					value={pendingTasks}
					description="Ainda restam tarefas por fazer"
				/>

				<SummaryCard
					title="Progresso geral"
					value={`${progressPercent}%`}
					description="Percentual de tarefas concluídas"
				/>
			</section>

				<PlanManager
					plans={plans}
					selectedPlanId={selectedPlanId}
					onSelectPlan={setSelectedPlanId}
					onAddPlan={handleAddPlan}
					onEditPlan={handleEditPlan}
					onDeletePlan={handleDeletePlan}
					subjects={subjects}
					tasks={tasks}
				/>

			<section className="split-grid">
				<SubjectList
					subjects={subjects}
					visibleSubjects={filteredSubjects}
					setSubjects={setSubjects}
					isLoadingSubjects={false}
					tasks={tasks}
					activePlanId={planForCreation}
				/>
				<TaskList
					tasks={filteredTasks}
					dispatch={dispatch}
					pendingTasks={pendingTasks}
					completedTasks={completedTasks}
					subjects={filteredSubjects}
					activePlanId={planForCreation}
				/>
			</section>
			<Footer />
		</section>
	)
}

export default Dashboard
