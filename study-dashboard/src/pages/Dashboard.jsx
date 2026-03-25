import { useEffect, useMemo, useReducer, useState } from 'react'
import Header from '../components/layout/Header'
import SummaryCard from '../components/ui/SummaryCard'
import SubjectList from '../components/study/SubjectList'
import TaskList from '../components/study/TaskList'
import { taskReducer } from '../reducers/taskReducer'
import Footer from '../components/layout/Footer'

function Dashboard() {
	const [subjects, setSubjects] = useState(() => {
		const stored = localStorage.getItem('subjects')
		return stored ? JSON.parse(stored) : []
	})
	const [studyPlans, setStudyPlans] = useState(() => {
		const stored = localStorage.getItem('studyPlans')
		return stored ? JSON.parse(stored) : []
	})
	const [editingPlanId, setEditingPlanId] = useState(null)
	const [editPlanTitle, setEditPlanTitle] = useState('')
	const [editPlanFocus, setEditPlanFocus] = useState('')
	const [editPlanDeadline, setEditPlanDeadline] = useState('')
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
		localStorage.setItem('subjects', JSON.stringify(subjects))
	}, [subjects])

	useEffect(() => {
		localStorage.setItem('tasks', JSON.stringify(tasks))
	}, [tasks])

	useEffect(() => {
		const syncPlans = () => {
			const stored = localStorage.getItem('studyPlans')
			setStudyPlans(stored ? JSON.parse(stored) : [])
		}

		window.addEventListener('study-plans-updated', syncPlans)
		window.addEventListener('storage', syncPlans)

		return () => {
			window.removeEventListener('study-plans-updated', syncPlans)
			window.removeEventListener('storage', syncPlans)
		}
	}, [])

	function savePlans(nextPlans) {
		localStorage.setItem('studyPlans', JSON.stringify(nextPlans))
		setStudyPlans(nextPlans)
		window.dispatchEvent(new Event('study-plans-updated'))
	}

	function handleDeletePlan(planId) {
		const nextPlans = studyPlans.filter((plan) => plan.id !== planId)
		savePlans(nextPlans)

		if (editingPlanId === planId) {
			setEditingPlanId(null)
			setEditPlanTitle('')
			setEditPlanFocus('')
			setEditPlanDeadline('')
		}
	}

	function handleStartEdit(plan) {
		setEditingPlanId(plan.id)
		setEditPlanTitle(plan.title)
		setEditPlanFocus(plan.focus)
		setEditPlanDeadline(plan.deadline)
	}

	function handleCancelEdit() {
		setEditingPlanId(null)
		setEditPlanTitle('')
		setEditPlanFocus('')
		setEditPlanDeadline('')
	}

	function handleSaveEdit(planId, event) {
		event.preventDefault()

		const nextPlans = studyPlans.map((plan) => {
			if (plan.id !== planId) return plan

			return {
				...plan,
				title: editPlanTitle.trim(),
				focus: editPlanFocus.trim(),
				deadline: editPlanDeadline
			}
		})

		savePlans(nextPlans)
		handleCancelEdit()
	}

	return (
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
						value={pendingTasks}
						description="Ainda restam tarefas por fazer"
					/>

					<SummaryCard
						title="Progresso geral"
						value={`${progressPercent}%`}
						description="Percentual de tarefas concluídas"
					/>
				</section>

				<section className="custom-card">
					<h2 className="section-title">Planos de estudo</h2>
					{studyPlans.length === 0 ? (
						<p className="plans-empty">Nenhum plano salvo ainda. Clique em Novo Plano para criar o primeiro.</p>
					) : (
						<div className="plans-grid">
							{studyPlans.map((plan) => {
								const formattedDeadline = plan.deadline
									? new Date(`${plan.deadline}T00:00:00`).toLocaleDateString('pt-BR')
									: 'Sem prazo'
								const isEditing = editingPlanId === plan.id

								return (
									<article className="plan-item" key={plan.id}>
										{isEditing ? (
											<form className="plan-edit-form" onSubmit={(event) => handleSaveEdit(plan.id, event)}>
												<input
													className="plan-input"
													type="text"
													value={editPlanTitle}
													onChange={(event) => setEditPlanTitle(event.target.value)}
													required
												/>
												<input
													className="plan-input"
													type="text"
													value={editPlanFocus}
													onChange={(event) => setEditPlanFocus(event.target.value)}
													required
												/>
												<input
													className="plan-input"
													type="date"
													value={editPlanDeadline}
													onChange={(event) => setEditPlanDeadline(event.target.value)}
													required
												/>

												<div className="plan-item-actions">
													<button type="button" className="plan-action-btn" onClick={handleCancelEdit}>
														Cancelar
													</button>
													<button type="submit" className="plan-action-btn">
														Salvar
													</button>
												</div>
											</form>
										) : (
											<>
												<h3 className="plan-item-title">{plan.title}</h3>
												<p className="plan-item-focus">Foco: {plan.focus}</p>
												<p className="plan-item-deadline">Prazo: {formattedDeadline}</p>

												<div className="plan-item-actions">
													<button
														type="button"
														className="plan-action-btn"
														onClick={() => handleStartEdit(plan)}
													>
														Editar
													</button>
													<button
														type="button"
														className="plan-action-btn plan-action-btn-danger"
														onClick={() => handleDeletePlan(plan.id)}
													>
														Excluir
													</button>
												</div>
											</>
										)}
									</article>
								)
							})}
						</div>
					)}
				</section>

        <section className="split-grid">
			<SubjectList
				subjects={subjects}
				setSubjects={setSubjects}
				isLoadingSubjects={false}
				tasks={tasks}
			/>
			<TaskList
				tasks={tasks}
				dispatch={dispatch}
				pendingTasks={pendingTasks}
				completedTasks={completedTasks}
				subjects={subjects}
			/>
        </section>
				<Footer />
			</section>
	)
}

export default Dashboard
