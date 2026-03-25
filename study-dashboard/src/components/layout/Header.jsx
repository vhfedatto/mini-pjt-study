import { useContext, useState } from 'react'
import { ThemeContext } from '../../context/ThemeContext'

function Header() {
  const { theme, toggleTheme } = useContext(ThemeContext)
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false)
  const [planTitle, setPlanTitle] = useState('')
  const [planDescription, setPlanDescription] = useState('')
  const [planGoal, setPlanGoal] = useState('')

  function handleCreatePlan(event) {
    event.preventDefault()

    const existingPlans = JSON.parse(localStorage.getItem('studyPlans') || '[]')
    const newPlan = {
      id: Date.now(),
      name: planTitle.trim(),
      description: planDescription.trim(),
      goal: planGoal.trim(),
      createdAt: new Date().toISOString()
    }

    const updatedPlans = [newPlan, ...existingPlans]
    localStorage.setItem('studyPlans', JSON.stringify(updatedPlans))
    localStorage.setItem('plans', JSON.stringify(updatedPlans))
    window.dispatchEvent(new Event('study-plans-updated'))

    setPlanTitle('')
    setPlanDescription('')
    setPlanGoal('')
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
              <div className="plan-field-group">
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
              </div>

              <div className="plan-field-group">
                <label className="plan-field-label" htmlFor="plan-description">Descrição</label>
                <input
                  id="plan-description"
                  className="plan-input"
                  type="text"
                  value={planDescription}
                  onChange={(event) => setPlanDescription(event.target.value)}
                  placeholder="Ex: Conteúdos, contexto ou objetivo do plano"
                  required
                />
              </div>

              <div className="plan-field-group">
                <label className="plan-field-label" htmlFor="plan-goal">Meta</label>
                <textarea
                  id="plan-goal"
                  className="plan-input plan-textarea"
                  value={planGoal}
                  onChange={(event) => setPlanGoal(event.target.value)}
                  placeholder="Ex: Estudar 2h por dia durante 2 semanas"
                  required
                />
              </div>

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
