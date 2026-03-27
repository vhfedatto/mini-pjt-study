import { useState } from 'react'
import Dashboard from './pages/Dashboard'
import Agenda from './pages/Agenda'
import Progress from './pages/Progress'
import ImportantDates from './pages/ImportantDates'
import Flashcards from './pages/Flashcards'
import Settings from './pages/Settings'
import Sidebar from './components/layout/Sidebar'

function App() {
  const [activePage, setActivePage] = useState('dashboard')

  return (
    <main className="dashboard-layout">
      <Sidebar activePage={activePage} setActivePage={setActivePage} />
      {activePage === 'dashboard' && <Dashboard />}
      {activePage === 'agenda' && <Agenda />}
      {activePage === 'flashcards' && <Flashcards />}
      {activePage === 'progress' && <Progress />}
      {activePage === 'important-dates' && <ImportantDates />}
      {activePage === 'settings' && <Settings />}
      {activePage !== 'dashboard' && activePage !== 'agenda' && activePage !== 'progress' && activePage !== 'flashcards' && activePage !== 'important-dates' && activePage !== 'settings' && (
        <section className="dashboard-content" style={{ padding: '24px' }}>
          <h2>Selecione uma opção no menu lateral</h2>
        </section>
      )}
    </main>
  )
}

export default App
