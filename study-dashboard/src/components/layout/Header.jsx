import { useContext, useState } from 'react'
import { ThemeContext } from '../../context/ThemeContext'

function Header() {
  const { theme, toggleTheme } = useContext(ThemeContext)
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false)
  const [planTitle, setPlanTitle] = useState('')
  const [planFocus, setPlanFocus] = useState('')
  const [planDeadline, setPlanDeadline] = useState('')

  function handleCreatePlan(event) {
    event.preventDefault()

    const existingPlans = JSON.parse(localStorage.getItem('studyPlans') || '[]')
    const newPlan = {
      id: Date.now(),
      title: planTitle.trim(),
      focus: planFocus.trim(),
      deadline: planDeadline,
      createdAt: new Date().toISOString()
    }

    localStorage.setItem('studyPlans', JSON.stringify([newPlan, ...existingPlans]))
    window.dispatchEvent(new Event('study-plans-updated'))

    setPlanTitle('')
    setPlanFocus('')
    setPlanDeadline('')
    setIsPlanModalOpen(false)
  }

  return (
    <>
      <header className="header">
        <div>
          <h1 className="header-title">Olá, estudante 👋</h1>
          <p className="header-subtitle">
            Organize sua rotina e acompanhe seu progresso.
          </p>
        </div>

        <div className="header-actions">
          <button
            type="button"
            className="header-button header-button-secondary"
            onClick={toggleTheme}
            aria-label="Alternar modo claro e escuro"
          >
            {theme === 'light' ? 'Modo escuro' : 'Modo claro'}
          </button>
          <button
            type="button"
            className="header-button"
            onClick={() => setIsPlanModalOpen(true)}
          >
            Novo Plano
          </button>
        </div>
      </header>

      {isPlanModalOpen && (
        <div
          className="plan-modal-overlay"
          role="presentation"
          onClick={() => setIsPlanModalOpen(false)}
        >
          <div
            className="plan-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-plan-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="new-plan-title" className="plan-modal-title">Criar novo plano</h2>

            <form className="plan-form" onSubmit={handleCreatePlan}>
              <label className="plan-field-label" htmlFor="plan-title">Nome do plano</label>
              <input
                id="plan-title"
                className="plan-input"
                type="text"
                value={planTitle}
                onChange={(event) => setPlanTitle(event.target.value)}
                placeholder="Ex: Revisão para prova de matemática"
                required
              />

              <label className="plan-field-label" htmlFor="plan-focus">Foco</label>
              <input
                id="plan-focus"
                className="plan-input"
                type="text"
                value={planFocus}
                onChange={(event) => setPlanFocus(event.target.value)}
                placeholder="Ex: Álgebra e geometria"
                required
              />

              <label className="plan-field-label" htmlFor="plan-deadline">Prazo</label>
              <input
                id="plan-deadline"
                className="plan-input"
                type="date"
                value={planDeadline}
                onChange={(event) => setPlanDeadline(event.target.value)}
                required
              />

              <div className="plan-modal-actions">
                <button
                  type="button"
                  className="header-button header-button-secondary"
                  onClick={() => setIsPlanModalOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="header-button">Salvar plano</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

export default Header
