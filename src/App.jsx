import { useEffect, useState } from 'react'
import Dashboard from './pages/Dashboard'
import Agenda from './pages/Agenda'
import Progress from './pages/Progress'
import ImportantDates from './pages/ImportantDates'
import Treinos from './pages/Treinos'
import Settings from './pages/Settings'
import Profile from './pages/Profile'
import Ranking from './pages/Ranking'
import Login from './pages/Login'
import Sidebar from './components/layout/Sidebar'

const SIDEBAR_BREAKPOINT = 1180

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.localStorage.getItem('studydash-session') === 'authenticated'
  })
  const [activePage, setActivePage] = useState('dashboard')
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window === 'undefined') return true
    return window.innerWidth > SIDEBAR_BREAKPOINT
  })

  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    function syncSidebarWithViewport() {
      if (window.innerWidth > SIDEBAR_BREAKPOINT) {
        setIsSidebarOpen(true)
      }
    }

    window.addEventListener('resize', syncSidebarWithViewport)

    return () => {
      window.removeEventListener('resize', syncSidebarWithViewport)
    }
  }, [])

  if (!isAuthenticated) {
    return <Login onLoginSuccess={() => setIsAuthenticated(true)} />
  }

  function toggleSidebar() {
    setIsSidebarOpen((prev) => !prev)
  }

  function handleNavigate(pageKey) {
    setActivePage(pageKey)
    if (typeof window !== 'undefined' && window.innerWidth <= SIDEBAR_BREAKPOINT) {
      setIsSidebarOpen(false)
    }
  }

  function handleLogout() {
    window.localStorage.removeItem('studydash-session')
    setIsAuthenticated(false)
    setActivePage('dashboard')
  }

  return (
    <main className="dashboard-layout">
      <button
        type="button"
        className={`sidebar-toggle${isSidebarOpen ? ' is-open' : ''}`}
        aria-label={isSidebarOpen ? 'Fechar menu' : 'Abrir menu'}
        onClick={toggleSidebar}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path
            d="M4 7h16M4 12h16M4 17h12"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <Sidebar
        activePage={activePage}
        setActivePage={handleNavigate}
        isOpen={isSidebarOpen}
        onToggleSidebar={toggleSidebar}
      />

      {isSidebarOpen ? (
        <div
          className="sidebar-backdrop is-visible"
          role="presentation"
          onClick={() => setIsSidebarOpen(false)}
        />
      ) : null}

      {activePage === 'dashboard' && <Dashboard />}
      {activePage === 'agenda' && <Agenda />}
      {activePage === 'flashcards' && <Treinos />}
      {activePage === 'progress' && <Progress />}
      {activePage === 'ranking' && <Ranking />}
      {activePage === 'important-dates' && <ImportantDates />}
      {activePage === 'profile' && <Profile />}
      {activePage === 'settings' && <Settings onLogout={handleLogout} />}
      {activePage !== 'dashboard' && activePage !== 'agenda' && activePage !== 'progress' && activePage !== 'ranking' && activePage !== 'flashcards' && activePage !== 'important-dates' && activePage !== 'profile' && activePage !== 'settings' && (
        <section className="dashboard-content" style={{ padding: '24px' }}>
          <h2>Selecione uma opção no menu lateral</h2>
        </section>
      )}
    </main>
  )
}

export default App
