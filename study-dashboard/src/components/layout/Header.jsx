import { useContext } from 'react'
import { ThemeContext } from '../../context/ThemeContext'

function Header() {
  const { theme, toggleTheme } = useContext(ThemeContext)

  return (
    <header className="header">
      <div>
        <h1 className="header-title">Olá, estudante 👋</h1>
        <p className="header-subtitle">
          Organize sua rotina e acompanhe seu progresso.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        <button className="header-button" onClick={toggleTheme}>
          {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
        </button>

        <button className="header-button">Novo Plano</button>
      </div>
    </header>
  )
}

export default Header