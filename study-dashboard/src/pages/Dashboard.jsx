import { useEffect, useMemo, useState } from 'react'
import Sidebar from '../components/layout/Sidebar'
import Header from '../components/layout/Header'
import SummaryCard from '../components/ui/SummaryCard'
import SubjectList from '../components/study/SubjectList'
import TaskList from '../components/study/TaskList'

function Dashboard() {
	const [subjects, setSubjects] = useState(() => {
		const stored = localStorage.getItem('subjects')
		return stored ? JSON.parse(stored) : []
	})
	const [isLoadingSubjects, setIsLoadingSubjects] = useState(true)
	const totalSubjects = useMemo(() => {
		return subjects.length
	}, [subjects])

	useEffect(() => {
		setIsLoadingSubjects(false)
	}, [])

	useEffect(() => {
		localStorage.setItem('subjects', JSON.stringify(subjects))
	}, [subjects])

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
						value="14"
						description="Ainda restam tarefas"
					/>

					<SummaryCard
						title="Progresso geral"
						value="72%"
						description="Seu desempenho está ótimo"
					/>
				</section>

        <section className="split-grid">
          <SubjectList
            subjects={subjects}
            setSubjects={setSubjects}
            isLoadingSubjects={isLoadingSubjects}
          />
          <TaskList />
        </section>
			</section>
		</main>
	)
}

export default Dashboard
