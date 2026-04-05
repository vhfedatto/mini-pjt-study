function GearIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M12 8.9a3.1 3.1 0 1 0 0 6.2 3.1 3.1 0 0 0 0-6.2Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M19.4 15a1 1 0 0 0 .2 1.1l.1.1a1.2 1.2 0 0 1 0 1.7l-1.5 1.5a1.2 1.2 0 0 1-1.7 0l-.1-.1a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9V20a1.2 1.2 0 0 1-1.2 1.2h-2.2A1.2 1.2 0 0 1 10 20v-.2a1 1 0 0 0-.6-.9 1 1 0 0 0-1.1.2l-.1.1a1.2 1.2 0 0 1-1.7 0L5 17.7a1.2 1.2 0 0 1 0-1.7l.1-.1A1 1 0 0 0 5.3 15a1 1 0 0 0-.9-.6H4.2A1.2 1.2 0 0 1 3 13.2v-2.1A1.2 1.2 0 0 1 4.2 10h.2a1 1 0 0 0 .9-.6 1 1 0 0 0-.2-1.1L5 8.2a1.2 1.2 0 0 1 0-1.7L6.5 5a1.2 1.2 0 0 1 1.7 0l.1.1a1 1 0 0 0 1.1.2 1 1 0 0 0 .6-.9V4.2A1.2 1.2 0 0 1 11.2 3h2.1a1.2 1.2 0 0 1 1.2 1.2v.2a1 1 0 0 0 .6.9 1 1 0 0 0 1.1-.2l.1-.1a1.2 1.2 0 0 1 1.7 0L19 6.5a1.2 1.2 0 0 1 0 1.7l-.1.1a1 1 0 0 0-.2 1.1 1 1 0 0 0 .9.6h.2A1.2 1.2 0 0 1 21 11.2v2.1a1.2 1.2 0 0 1-1.2 1.2h-.2a1 1 0 0 0-.9.5Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  )
}

// Componente funcional
function Sidebar({ activePage = 'dashboard', setActivePage, isOpen = true, onToggleSidebar }) {

  const navItems = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'agenda', label: 'Agenda' },
    { key: 'flashcards', label: 'Cadernos' },
    { key: 'important-dates', label: 'Provas' },
    { key: 'progress', label: 'Progresso' },
    { key: 'ranking', label: 'Ranking' },
  ]

  return (
    <aside className={`sidebar${isOpen ? ' is-open' : ' is-collapsed'}`}>
      <div className="sidebar-header">
        <h2 className="sidebar-title">StudyDash</h2>
        <button
          type="button"
          className={`sidebar-inline-toggle${isOpen ? ' is-open' : ''}`}
          aria-label={isOpen ? 'Ocultar menu lateral' : 'Mostrar menu lateral'}
          onClick={onToggleSidebar}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path
              d="m14 6-6 6 6 6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
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

      <div className="sidebar-bottom-actions">
        <button
          type="button"
          className={`sidebar-settings-button${activePage === 'profile' ? ' sidebar-link-active' : ''}`}
          onClick={() => setActivePage?.('profile')}
        >
          <span>Perfil</span>
        </button>

        <button
          type="button"
          className={`sidebar-settings-button${activePage === 'settings' ? ' sidebar-link-active' : ''}`}
          onClick={() => setActivePage?.('settings')}
        >
          <GearIcon />
          <span>Configurações</span>
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
