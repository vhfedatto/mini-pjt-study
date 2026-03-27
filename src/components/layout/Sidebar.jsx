import PropTypes from 'prop-types'

// Componente funcional
function Sidebar(props) {
  const { activePage = 'dashboard', setActivePage } = props

  const navItems = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'agenda', label: 'Agenda' },
    { key: 'subjects', label: 'Matérias' },
    { key: 'tasks', label: 'Tarefas' },
    { key: 'flashcards', label: 'Flashcards' },
    { key: 'important-dates', label: 'Provas' },
    { key: 'progress', label: 'Progresso' },
  ]

  return (
    <aside className="sidebar">
      <h2 className="sidebar-title">StudyDash</h2>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setActivePage?.(item.key)}
            className={activePage === item.key ? 'sidebar-link-active' : ''}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </aside>
  )
}

Sidebar.propTypes = {
  activePage: PropTypes.string,
  setActivePage: PropTypes.func.isRequired
}

export default Sidebar
