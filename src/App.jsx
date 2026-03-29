import { useState } from 'react'
import Dashboard from './pages/Dashboard'
import Agenda from './pages/Agenda'
import Progress from './pages/Progress'
import ImportantDates from './pages/ImportantDates'
import Flashcards from './pages/Flashcards'
import Settings from './pages/Settings'
import Sidebar from './components/layout/Sidebar'

function App() {
  // Controla qual página está visível na área principal.
  const [activePage, setActivePage] = useState('dashboard')
  // Define se a sidebar começa aberta ou fechada conforme a largura da tela.
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window === 'undefined') return true
    return window.innerWidth > 1080
  })

  // Alterna a visibilidade da sidebar.
  function toggleSidebar() {
    setIsSidebarOpen((prev) => !prev)
  }

  // Troca a página ativa ao navegar pelo menu.
  function handleNavigate(pageKey) {
    setActivePage(pageKey)
  }

  return (
    <main className="dashboard-layout">
      {/* Botão que abre e fecha o menu lateral. */}
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

      {/* Menu lateral com a navegação principal da aplicação. */}
      <Sidebar
        activePage={activePage}
        setActivePage={handleNavigate}
        isOpen={isSidebarOpen}
        onToggleSidebar={toggleSidebar}
      />

      {/* Fundo visual exibido quando a sidebar está aberta. */}
      {isSidebarOpen ? <div className="sidebar-backdrop is-visible" /> : null}

      {/* Renderiza a página correspondente à opção selecionada. */}
      {activePage === 'dashboard' && <Dashboard />}
      {activePage === 'agenda' && <Agenda />}
      {activePage === 'flashcards' && <Flashcards />}
      {activePage === 'progress' && <Progress />}
      {activePage === 'important-dates' && <ImportantDates />}
      {activePage === 'settings' && <Settings />}

      {/* Mostra uma mensagem padrão se nenhuma rota conhecida estiver ativa. */}
      {activePage !== 'dashboard' && activePage !== 'agenda' && activePage !== 'progress' && activePage !== 'flashcards' && activePage !== 'important-dates' && activePage !== 'settings' && (
        <section className="dashboard-content" style={{ padding: '24px' }}>
          <h2>Selecione uma opção no menu lateral</h2>
        </section>
      )}
    </main>
  )
}

export default App
