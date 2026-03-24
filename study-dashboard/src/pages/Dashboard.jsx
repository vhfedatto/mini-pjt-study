import { useEffect, useMemo, useReducer, useState } from 'react'
import Sidebar from '../components/layout/Sidebar'
import Header from '../components/layout/Header'
import SummaryCard from '../components/ui/SummaryCard'
import SubjectList from '../components/study/SubjectList'
import TaskList from '../components/study/TaskList'
import { taskReducer } from '../reducers/taskReducer'

function Dashboard() {
	const [subjects, setSubjects] = useState(() => {
		const stored = localStorage.getItem('subjects')
		return stored ? JSON.parse(stored) : []
	})
	const [tasks, dispatch] = useReducer(taskReducer, [], () => {
		const stored = localStorage.getItem('tasks')
		return stored ? JSON.parse(stored) : []
	})
	const [isLoadingSubjects, setIsLoadingSubjects] = useState(true)
	const totalSubjects = useMemo(() => {
		return subjects.length
	}, [subjects])
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
		setIsLoadingSubjects(false)
	}, [])

	useEffect(() => {
		localStorage.setItem('subjects', JSON.stringify(subjects))
	}, [subjects])

	useEffect(() => {
		localStorage.setItem('tasks', JSON.stringify(tasks))
	}, [tasks])

	return (
		<main className="dashboard-layout">
			<Sidebar />

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

        <section className="split-grid">
          <SubjectList
            subjects={subjects}
            setSubjects={setSubjects}
            isLoadingSubjects={isLoadingSubjects}
          />
          <TaskList
						tasks={tasks}
						dispatch={dispatch}
						pendingTasks={pendingTasks}
						completedTasks={completedTasks}
					/>
        </section>
			</section>
		</main>
	)
}

export default Dashboard
