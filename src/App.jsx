import { useState } from 'react'
import Dashboard from './pages/Dashboard'
import Progress from './pages/Progress'
import Subjects from './pages/Subjects'
import Tasks from './pages/Tasks'
import ImportantDates from './pages/ImportantDates'
import Sidebar from './components/layout/Sidebar'

function App() {
  const [activePage, setActivePage] = useState('dashboard')

  return (
    <main className="dashboard-layout">
      <Sidebar activePage={activePage} setActivePage={setActivePage} />
      {activePage === 'dashboard' && <Dashboard />}
      {activePage === 'subjects' && <Subjects />}
      {activePage === 'tasks' && <Tasks />}
      {activePage === 'progress' && <Progress />}
      {activePage === 'important-dates' && <ImportantDates />}
      {activePage !== 'dashboard' && activePage !== 'progress' && activePage !== 'subjects' && activePage !== 'tasks' && activePage !== 'important-dates' && (
        <section className="dashboard-content" style={{ padding: '24px' }}>
          <h2>Selecione uma opção no menu lateral</h2>
        </section>
      )}
    </main>
  )
}

export default App
