// Componente funcional
function Sidebar({ activePage = 'dashboard', setActivePage }) {
  const navItems = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'subjects', label: 'Agenda' },
    { key: 'tasks', label: 'Flashcards' },
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

export default Sidebar;
