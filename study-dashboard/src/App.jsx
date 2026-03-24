import { useContext } from 'react'
import { ThemeContext } from './context/ThemeContext'
import Dashboard from './pages/Dashboard'

function App() {
  const { theme } = useContext(ThemeContext)

  return (
    <div className={theme === 'dark' ? 'dark' : ''}>
      <Dashboard />
    </div>
  )
}

export default App