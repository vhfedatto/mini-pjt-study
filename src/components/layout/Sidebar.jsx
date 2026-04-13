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

function DashboardIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M4.75 12.25h6.5v7h-6.5Zm8 0h6.5v7h-6.5Zm-8-7h14.5v5.5H4.75Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M7 3.75v2.5M17 3.75v2.5M4.75 8.25h14.5M6.75 5.75h10.5A1.75 1.75 0 0 1 19 7.5v10.75A1.75 1.75 0 0 1 17.25 20H6.75A1.75 1.75 0 0 1 5 18.25V7.5A1.75 1.75 0 0 1 6.75 5.75Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CoursesIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M5.75 5.5a1.75 1.75 0 0 1 1.75-1.75h8.75A2.75 2.75 0 0 1 19 6.5v12.25a.75.75 0 0 1-1.17.62l-2.33-1.55a.75.75 0 0 0-.83 0l-2.33 1.55a.75.75 0 0 1-.83 0l-2.33-1.55a.75.75 0 0 0-.83 0L6.17 19.4A.75.75 0 0 1 5 18.78Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9 7.5h5.5M9 10.5h3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function NotebookIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M7 4.75h9.5A2.75 2.75 0 0 1 19.25 7.5v9A2.75 2.75 0 0 1 16.5 19.25H7.75A2.75 2.75 0 0 1 5 16.5V6.75A2 2 0 0 1 7 4.75Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8.75 8.25h7M8.75 11.75h7M8.75 15.25h4.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ExamIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M7 4.75h7.75L19.25 9v10.25A2.75 2.75 0 0 1 16.5 22H7.5A2.75 2.75 0 0 1 4.75 19.25v-11.75A2.75 2.75 0 0 1 7.5 4.75Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14.25 5.25v4.5h4.5M8.75 13l1.8 1.8 4.7-4.7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function NotesIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M6.75 4.75h10.5A1.75 1.75 0 0 1 19 6.5v11A1.75 1.75 0 0 1 17.25 19.25H6.75A1.75 1.75 0 0 1 5 17.5v-11A1.75 1.75 0 0 1 6.75 4.75Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8.5 15.5 11 13l1.8 1.8 2.7-3.3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ProgressIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M5.5 18.25h13"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7.25 16V12.5M12 16V8.25M16.75 16v-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="m7.25 9.75 4.2-3.25 2.65 1.9 2.66-3.15"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function RankingIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M7 19.25h10M8.75 19.25v-5.5M12 19.25v-9M15.25 19.25v-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8.75 7.75 12 4.75l3.25 3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// Componente funcional
function Sidebar({ activePage = 'dashboard', setActivePage, isOpen = true, onToggleSidebar }) {
  const { theme, toggleTheme } = useContext(ThemeContext)

  const navItems = [
    { key: 'dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
    { key: 'agenda', label: 'Agenda', icon: <CalendarIcon /> },
    { key: 'courses', label: 'Matérias', icon: <CoursesIcon /> },
    { key: 'flashcards', label: 'Cadernos', icon: <NotebookIcon /> },
    { key: 'important-dates', label: 'Provas', icon: <ExamIcon /> },
    { key: 'progress', label: 'Notas', icon: <NotesIcon /> },
    { key: 'study-progress', label: 'Progresso', icon: <ProgressIcon /> },
    { key: 'ranking', label: 'Ranking', icon: <RankingIcon /> },
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
            <span className="sidebar-nav-icon" aria-hidden="true">{item.icon}</span>
            <span>{item.label}</span>
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
