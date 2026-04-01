import { useMemo } from 'react'
import { calculateTodaySubject, suggestStudyHours } from '../../utils/smartSubjectPlanner'

function TodaySubjectRecommendation({ subjects = [], tasks = [], agendaItems = [], plans = [], isOpen = false, onClose }) {
  const recommendation = useMemo(() => {
    const subject = calculateTodaySubject(subjects, tasks, agendaItems)
    if (!subject) return null

    const hours = suggestStudyHours(subject, tasks, agendaItems)
    const plan = plans.find((p) => p.id === subject.planId)

    return {
      subject,
      hours,
      plan
    }
  }, [subjects, tasks, agendaItems, plans])

  if (!isOpen) return null

  const hasData = !!recommendation
  const subject = recommendation?.subject
  const hours = recommendation?.hours
  const plan = recommendation?.plan

  return (
    <div
      className="plan-modal-overlay"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="plan-modal recommendation-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="recommendation-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="important-date-modal-header">
          <h2 id="recommendation-modal-title" className="plan-modal-title">
            📚 Recomendação de Estudo para Hoje
          </h2>
          <button
            type="button"
            className="subject-remove-button"
            onClick={onClose}
            aria-label="Fechar recomendação"
          >
            ✕
          </button>
        </div>

        {hasData ? (
          <div className="recommendation-highlight">
            <div className="recommendation-subject">
              <div className="recommendation-header">
                <span
                  className="plan-color-dot"
                  style={{ '--plan-color': plan?.color || '#c46b2d' }}
                  aria-hidden="true"
                />
                <h3>{subject.name}</h3>
              </div>

              <div className="recommendation-details">
                <div className="detail-item">
                  <span className="detail-label">Plano:</span>
                  <span className="detail-value">{plan?.name || 'Sem plano'}</span>
                </div>

                <div className="detail-item">
                  <span className="detail-label">Tempo sugerido:</span>
                  <span className="detail-value recommendation-study-hours">
                    {hours.suggestedHours} hora{hours.suggestedHours !== 1 ? 's' : ''}
                  </span>
                </div>

                {hours.hoursStudiedToday > 0 ? (
                  <div className="detail-item">
                    <span className="detail-label">Já estudou hoje:</span>
                    <span className="detail-value recommendation-already-studied">
                      {hours.hoursStudiedToday}h
                    </span>
                  </div>
                ) : null}

                <div className="detail-item">
                  <span className="detail-label">Tarefas:</span>
                  <span className="detail-value">
                    {hours.urgentTasks} urgentes • {hours.pendingTasks} pendentes
                  </span>
                </div>
              </div>

              <p className="recommendation-message">
                {hours.urgentTasks > 0
                  ? '⚠️ Você tem tarefas vencendo hoje. Priorize esta matéria!'
                  : hours.pendingTasks > 5
                    ? '📖 Muitas tarefas pendentes. Organize seu tempo com isso em mente.'
                    : '✅ Continue em dia com seus estudos!'}
              </p>
            </div>
          </div>
        ) : (
          <p className="empty-message">
            Adicione matérias e tarefas para receber recomendações personalizadas.
          </p>
        )}
      </div>
    </div>
  )
}

export default TodaySubjectRecommendation
