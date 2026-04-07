import { useContext } from 'react'
import { ThemeContext } from '../../context/ThemeContext'

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

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle
        cx="12"
        cy="12"
        r="4.2"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M12 2.8v2.4M12 18.8v2.4M21.2 12h-2.4M5.2 12H2.8M18.5 5.5l-1.7 1.7M7.2 16.8l-1.7 1.7M18.5 18.5l-1.7-1.7M7.2 7.2 5.5 5.5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M18.6 14.9A7.8 7.8 0 0 1 9.1 5.4a8.8 8.8 0 1 0 9.5 9.5Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
        transform="translate(2 -2)"
      />
    </svg>
  )
}

// Componente funcional
function Sidebar({ activePage = 'dashboard', setActivePage, isOpen = true, onToggleSidebar }) {
  const { theme, toggleTheme } = useContext(ThemeContext)

  const navItems = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'agenda', label: 'Agenda' },
    { key: 'flashcards', label: 'Cadernos' },
    { key: 'important-dates', label: 'Provas' },
    { key: 'progress', label: 'Notas' },
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
        <div className="sidebar-bottom-row">
          <button
            type="button"
            className={`sidebar-settings-button sidebar-profile-button${activePage === 'profile' ? ' sidebar-link-active' : ''}`}
            onClick={() => setActivePage?.('profile')}
          >
            <span>Perfil</span>
          </button>

          <button
            type="button"
            className="sidebar-theme-toggle"
            onClick={toggleTheme}
            aria-label={theme === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'}
            title={theme === 'light' ? 'Modo claro ativo' : 'Modo escuro ativo'}
          >
            {theme === 'light' ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>

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
