import { useMemo, useState } from 'react'
import Card from '../ui/Card'

function getCurrentAcademicPeriod() {
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth()
  const period = month < 6 ? 1 : 2

  return `${year}.${period}`
}

function PlanManager({
  plans,
  selectedPlanId,
  onSelectPlan,
  onEditPlan,
  onDeletePlan,
  isRecommendationVisible = false,
  onToggleRecommendation,
  subjects = [],
  tasks = []
}) {
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editGoal, setEditGoal] = useState('')
  const [editColor, setEditColor] = useState('#c46b2d')
  const currentAcademicPeriod = useMemo(() => getCurrentAcademicPeriod(), [])

  const cards = useMemo(() => {
    const countFor = (planId) => ({
      subjects: subjects.filter((s) => s.planId === planId).length,
      tasks: tasks.filter((t) => t.planId === planId).length
    })

    return plans.map((plan) => ({ ...plan, ...countFor(plan.id) }))
  }, [plans, subjects, tasks])

  function handleSelectCard(id) {
    onSelectPlan(selectedPlanId === id ? null : id)
  }

  function handleStartEdit(plan) {
    setEditingId(plan.id)
    setEditName(plan.name)
    setEditDescription(plan.description)
    setEditGoal(plan.goal)
    setEditColor(plan.color || '#c46b2d')
  }

  function handleSaveEdit(e) {
    e.preventDefault()
    if (!editingId) return
    onEditPlan?.(editingId, {
      name: editName.trim(),
      description: editDescription.trim(),
      goal: editGoal.trim(),
      color: editColor
    })
    setEditingId(null)
    setEditName('')
    setEditDescription('')
    setEditGoal('')
    setEditColor('#c46b2d')
  }

  function handleCancelEdit() {
    setEditingId(null)
    setEditName('')
    setEditDescription('')
    setEditGoal('')
    setEditColor('#c46b2d')
  }

  return (
    <Card className="plan-manager-card">
      <div className="plan-manager-toolbar">
        <button type="button" className="plan-current-period-button">
          Período atual: {currentAcademicPeriod}
        </button>
      </div>

      {cards.length > 0 ? (
        <div className="plan-card-actions" style={{ marginBottom: '12px' }}>
          <button
            type="button"
            className="plan-action-btn"
            onClick={onToggleRecommendation}
          >
            {isRecommendationVisible
              ? 'Ocultar 📚 Recomendação de Estudo para Hoje'
              : 'Mostrar 📚 Recomendação de Estudo para Hoje'}
          </button>
        </div>
      ) : null}

      <div className="plan-cards">
        {cards.length === 0 ? (
          <p className="plans-empty">Nenhum plano específico criado.</p>
        ) : (
          cards.map((plan) => {
            const isActive = selectedPlanId === plan.id
            const isEditing = editingId === plan.id
            return (
              <div
                key={plan.id}
                className={`plan-card ${isActive ? 'active' : ''}`}
                onClick={(e) => {
                  if (e.target.closest('.plan-card-actions')) return
                  handleSelectCard(plan.id)
                }}
              >
                {isEditing ? (
                  <form className="plan-edit-form" onSubmit={handleSaveEdit}>
                    <input
                      className="subject-input"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Nome do plano"
                    />
                    <input
                      className="subject-input"
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      placeholder="Descrição"
                    />
                    <input
                      className="subject-input"
                      value={editGoal}
                      onChange={(e) => setEditGoal(e.target.value)}
                      placeholder="Meta"
                    />
                    <div className="plan-color-picker">
                      <input
                        className="plan-color-input"
                        type="color"
                        value={editColor}
                        onChange={(e) => setEditColor(e.target.value)}
                        aria-label="Cor do plano"
                      />
                      <span className="plan-color-value">{editColor}</span>
                    </div>

                    <div className="plan-card-actions">
                      <button type="button" className="plan-action-btn" onClick={handleCancelEdit}>
                        Cancelar
                      </button>
                      <button type="submit" className="plan-action-btn">
                        Salvar
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="plan-card-header">
                      <div className="plan-card-title-group">
                        <span
                          className="plan-color-dot"
                          style={{ '--plan-color': plan.color || '#c46b2d' }}
                          aria-hidden="true"
                        />
                        <h3>{plan.name}</h3>
                      </div>
                      <span className="pill info">{plan.goal || 'Sem meta'}</span>
                    </div>
                    <p className="plan-card-desc">{plan.description || 'Sem descrição'}</p>
                    <div className="plan-card-meta">
                      <span className="pill">Matérias: {plan.subjects}</span>
                      <span className="pill success">Tarefas: {plan.tasks}</span>
                    </div>
                    <div className="plan-card-actions" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className="plan-action-btn"
                        onClick={() => handleStartEdit(plan)}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="plan-action-btn plan-action-btn-danger"
                        onClick={() => onDeletePlan?.(plan.id)}
                      >
                        Excluir
                      </button>
                    </div>
                  </>
                )}
              </div>
            )
          })
        )}
      </div>
    </Card>
  )
}

export default PlanManager
