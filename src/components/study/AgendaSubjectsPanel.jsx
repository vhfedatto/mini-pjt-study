import { useMemo } from 'react'
import Card from '../ui/Card'

function AgendaSubjectsPanel({ subjects = [], tasks = [], agendaItems = [], plans = [], selectedDate = '' }) {
  const defaultPlanColor = '#c46b2d'

  const subjectsWithInfo = useMemo(() => {
    return subjects.map((subject) => {
      const linkedPlan = plans.find((p) => p.id === subject.planId)
      
      const allTasks = tasks.filter((t) => t.subjectId === subject.id)
      const pendingTasks = allTasks.filter((t) => !t.completed)
      const tasksForSelectedDate = pendingTasks.filter(
        (t) => t.dueDate <= selectedDate
      )
      
      const agendaForSubject = agendaItems.filter(
        (item) =>
          item.subjectId === subject.id &&
          item.dateKeys.includes(selectedDate)
      )

      const studyHours = agendaForSubject.reduce((total, item) => {
        if (item.startTime && item.endTime) {
          const [startHour, startMin] = item.startTime.split(':').map(Number)
          const [endHour, endMin] = item.endTime.split(':').map(Number)
          const duration = (endHour - startHour) + (endMin - startMin) / 60
          return total + Math.max(0, duration)
        }
        return total
      }, 0)

      return {
        id: subject.id,
        name: subject.name,
        planId: subject.planId,
        planName: linkedPlan?.name || 'Sem plano',
        planColor: linkedPlan?.color || defaultPlanColor,
        totalTasks: allTasks.length,
        pendingTasks: pendingTasks.length,
        tasksForDate: tasksForSelectedDate.length,
        agendaItemsCount: agendaForSubject.length,
        agendaItems: agendaForSubject,
        studyHours: parseFloat(studyHours.toFixed(2))
      }
    })
      .filter((subject) => subject.totalTasks > 0 || subject.agendaItemsCount > 0)
      .sort((a, b) => {
        // Priorizar matérias com tarefas para o dia
        if (a.tasksForDate !== b.tasksForDate) {
          return b.tasksForDate - a.tasksForDate
        }
        // Depois por tarefas pendentes totais
        if (a.pendingTasks !== b.pendingTasks) {
          return b.pendingTasks - a.pendingTasks
        }
        // Por ordem alfabética
        return a.name.localeCompare(b.name)
      })
  }, [subjects, tasks, agendaItems, plans, selectedDate])

  if (subjectsWithInfo.length === 0) {
    return (
      <Card>
        <section className="panel-section agenda-subjects-panel">
          <h3 className="section-title">📚 Matérias</h3>
          <p className="empty-message">
            Nenhuma matéria com tarefas ou eventos agendados.
          </p>
        </section>
      </Card>
    )
  }

  return (
    <Card>
      <section className="panel-section agenda-subjects-panel">
        <h3 className="section-title">📚 Matérias</h3>

        <div className="agenda-subjects-list">
          {subjectsWithInfo.map((subject) => (
            <div key={subject.id} className="agenda-subject-card">
              <div className="subject-card-header">
                <div className="subject-card-title">
                  <span
                    className="subject-color-dot"
                    style={{ backgroundColor: subject.planColor }}
                    aria-hidden="true"
                  />
                  <div className="subject-info">
                    <h4>{subject.name}</h4>
                    <span className="subject-plan">{subject.planName}</span>
                  </div>
                </div>
              </div>

              <div className="subject-card-content">
                {subject.tasksForDate > 0 && (
                  <div className="task-indicator urgent">
                    <span className="indicator-icon">⚠️</span>
                    <span className="indicator-text">
                      {subject.tasksForDate} tarefa{subject.tasksForDate !== 1 ? 's' : ''} vencendo
                    </span>
                  </div>
                )}

                {subject.pendingTasks > 0 && (
                  <div className="task-indicator pending">
                    <span className="indicator-icon">📋</span>
                    <span className="indicator-text">
                      {subject.pendingTasks} pendente{subject.pendingTasks !== 1 ? 's' : ''}
                    </span>
                  </div>
                )}

                {subject.agendaItemsCount > 0 && (
                  <div className="task-indicator scheduled">
                    <span className="indicator-icon">📅</span>
                    <span className="indicator-text">
                      {subject.studyHours}h de estudo agendado
                    </span>
                  </div>
                )}

                {subject.agendaItemsCount > 0 && (
                  <div className="agenda-items-mini">
                    {subject.agendaItems.map((item) => (
                      <div key={item.id} className="mini-event">
                        <span className="mini-time">
                          {item.startTime} - {item.endTime}
                        </span>
                        <span className="mini-title">{item.eventName}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <style>{`
          .agenda-subjects-list {
            display: flex;
            flex-direction: column;
            gap: 12px;
            margin-top: 12px;
          }

          .agenda-subject-card {
            border: 1px solid rgba(0, 0, 0, 0.1);
            border-radius: 6px;
            padding: 12px;
            background: rgba(255, 255, 255, 0.5);
            transition: all 0.2s ease;
          }

          .agenda-subject-card:hover {
            background: rgba(255, 255, 255, 0.8);
            border-color: rgba(0, 0, 0, 0.2);
          }

          .subject-card-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 12px;
            margin-bottom: 8px;
          }

          .subject-card-title {
            display: flex;
            align-items: center;
            gap: 8px;
            flex: 1;
          }

          .subject-color-dot {
            width: 12px;
            height: 12px;
            border-radius: 3px;
            flex-shrink: 0;
          }

          .subject-info {
            display: flex;
            flex-direction: column;
            gap: 2px;
            min-width: 0;
          }

          .subject-info h4 {
            margin: 0;
            font-size: 0.95em;
            font-weight: 600;
            word-break: break-word;
          }

          .subject-plan {
            font-size: 0.75em;
            color: var(--color-text-secondary, #999);
            text-transform: uppercase;
          }

          .subject-card-content {
            display: flex;
            flex-direction: column;
            gap: 6px;
          }

          .task-indicator {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 0.85em;
            padding: 4px 8px;
            border-radius: 4px;
          }

          .task-indicator.urgent {
            background: rgba(255, 152, 0, 0.1);
            color: #f57c00;
          }

          .task-indicator.pending {
            background: rgba(33, 150, 243, 0.1);
            color: #1976d2;
          }

          .task-indicator.scheduled {
            background: rgba(76, 175, 80, 0.1);
            color: #388e3c;
          }

          .indicator-icon {
            flex-shrink: 0;
            font-size: 0.9em;
          }

          .indicator-text {
            font-weight: 500;
          }

          .agenda-items-mini {
            margin-top: 2px;
            padding-top: 6px;
            border-top: 1px solid rgba(0, 0, 0, 0.05);
            display: flex;
            flex-direction: column;
            gap: 4px;
          }

          .mini-event {
            display: flex;
            gap: 8px;
            font-size: 0.8em;
            align-items: flex-start;
          }

          .mini-time {
            background: rgba(0, 0, 0, 0.05);
            padding: 2px 6px;
            border-radius: 3px;
            font-weight: 600;
            font-family: monospace;
            flex-shrink: 0;
          }

          .mini-title {
            flex: 1;
            word-break: break-word;
            color: var(--color-text-secondary, #666);
          }

          @media (max-width: 768px) {
            .agenda-subjects-list {
              gap: 8px;
            }

            .agenda-subject-card {
              padding: 10px;
            }

            .subject-info h4 {
              font-size: 0.9em;
            }
          }
        `}</style>
      </section>
    </Card>
  )
}

export default AgendaSubjectsPanel
