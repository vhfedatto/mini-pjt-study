import { useEffect, useMemo, useReducer, useState } from 'react'
import Header from '../components/layout/Header'
import SummaryCard from '../components/ui/SummaryCard'
import SubjectList from '../components/study/SubjectList'
import TaskList from '../components/study/TaskList'
import Footer from '../components/layout/Footer'
import PlanManager from '../components/plans/PlanManager'
import { taskReducer } from '../reducers/taskReducer'

function Dashboard() {
	// Cor padrão usada quando um plano não tem cor definida.
	const defaultPlanColor = '#c46b2d'

	// Formata datas para exibição no padrão brasileiro.
	function formatDate(date) {
		if (!date) return ''

		return new Intl.DateTimeFormat('pt-BR', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric'
		}).format(new Date(`${date}T00:00:00`))
	}

	// Carrega os planos salvos ou cria um plano inicial.
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

	// Carrega as matérias salvas no navegador.
	const [subjects, setSubjects] = useState(() => {
		const stored = localStorage.getItem('subjects')
		return stored ? JSON.parse(stored) : []
	})

	// Carrega as tarefas salvas e delega alterações ao reducer.
	const [tasks, dispatch] = useReducer(taskReducer, [], () => {
		const stored = localStorage.getItem('tasks')
		return stored ? JSON.parse(stored) : []
	})

	// Guarda o plano selecionado no filtro atual.
	const [selectedPlanId, setSelectedPlanId] = useState(null)
	// Define em qual plano novas matérias e tarefas serão criadas.
	const planForCreation = selectedPlanId ?? plans[0]?.id ?? null

	// Garante dados mínimos nos itens antigos salvos no localStorage.
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

	// Filtra as matérias pelo plano selecionado.
	const filteredSubjects = useMemo(
		() =>
			selectedPlanId
				? subjects.filter((subject) => subject.planId === selectedPlanId)
				: subjects,
		[subjects, selectedPlanId]
	)

	// Filtra as tarefas pelo plano selecionado.
	const filteredTasks = useMemo(
		() =>
			selectedPlanId
				? tasks.filter((task) => task.planId === selectedPlanId)
				: tasks,
		[tasks, selectedPlanId]
	)

	// Conta quantas tarefas filtradas ainda estão pendentes.
	const pendingTasks = useMemo(
		() => filteredTasks.filter((task) => !task.completed).length,
		[filteredTasks]
	)
	// Conta quantas tarefas filtradas já foram concluídas.
	const completedTasks = useMemo(
		() => filteredTasks.filter((task) => task.completed).length,
		[filteredTasks]
	)
	// Calcula o percentual de conclusão das tarefas visíveis.
	const progressPercent = useMemo(() => {
		if (filteredTasks.length === 0) return 0
		return Math.round((completedTasks / filteredTasks.length) * 100)
	}, [filteredTasks.length, completedTasks])

	// Encontra a próxima tarefa pendente com prazo definido.
	const nextDeadlineTask = useMemo(() => {
		const pendingWithDeadline = filteredTasks
			.filter((task) => !task.completed && task.dueDate)
			.sort((a, b) => a.dueDate.localeCompare(b.dueDate))

		return pendingWithDeadline[0] ?? null
	}, [filteredTasks])

	// Localiza a matéria ligada à próxima tarefa com prazo.
	const nextDeadlineSubject = useMemo(() => {
		if (!nextDeadlineTask) return null

		return filteredSubjects.find(
			(subject) => subject.id === nextDeadlineTask.subjectId
		) ?? null
	}, [filteredSubjects, nextDeadlineTask])

	// Salva a lista de planos sempre que ela mudar.
	useEffect(() => {
		localStorage.setItem('plans', JSON.stringify(plans))
		localStorage.setItem('studyPlans', JSON.stringify(plans))
	}, [plans])

	// Mantém os planos sincronizados entre abas e componentes.
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

	// Salva as matérias sempre que houver alteração.
	useEffect(() => {
		localStorage.setItem('subjects', JSON.stringify(subjects))
	}, [subjects])

	// Salva as tarefas sempre que houver alteração.
	useEffect(() => {
		localStorage.setItem('tasks', JSON.stringify(tasks))
	}, [tasks])

	// Adiciona um novo plano e já deixa ele selecionado.
	function handleAddPlan(newPlan) {
		const plan = { id: Date.now(), ...newPlan }
		setPlans((prev) => [...prev, plan])
		setSelectedPlanId(plan.id)
	}

	// Atualiza os dados de um plano existente.
	function handleEditPlan(planId, changes) {
		setPlans((prev) =>
			prev.map((plan) =>
				plan.id === planId ? { ...plan, ...changes } : plan
			)
		)
	}

	// Remove um plano da lista e limpa a seleção se necessário.
	function handleDeletePlan(planId) {
		setPlans((prev) => prev.filter((p) => p.id !== planId))
		setSelectedPlanId((prev) => (prev === planId ? null : prev))
		// opcional: remover plano das matérias/tarefas? manter dados para reatribuição manual.
	}

	return (
		<section className="dashboard-content">
			<Header />

			{/* Exibe os indicadores principais do painel. */}
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

				<SummaryCard
					title="Prazo mais proximo"
					value={nextDeadlineTask ? nextDeadlineTask.text : 'Sem prazos'}
					description={
						nextDeadlineTask
							? `${nextDeadlineSubject?.name || 'Sem materia'} • vence em ${formatDate(nextDeadlineTask.dueDate)}`
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

			{/* Gerencia criação, edição, exclusão e seleção dos planos. */}
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

			{/* Mostra a lista de matérias e tarefas do plano ativo. */}
			<section className="split-grid">
				<SubjectList
					subjects={subjects}
					visibleSubjects={filteredSubjects}
					plans={plans}
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
					plans={plans}
				/>
			</section>
			<Footer />
		</section>
	)
}

export default Dashboard
