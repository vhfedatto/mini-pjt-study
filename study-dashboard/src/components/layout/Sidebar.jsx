// Componente funcional
function Sidebar({ activePage = 'dashboard', setActivePage }) {
  const navItems = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'subjects', label: 'Matérias' },
    { key: 'tasks', label: 'Tarefas' },
    { key: 'progress', label: 'Progresso' },
  ]

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <img
          className="sidebar-logo"
          src="/logo-study-strack.svg"
          alt="Logo Study Strack"
        />
        <h2 className="sidebar-title">Study Strack</h2>
      </div>

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