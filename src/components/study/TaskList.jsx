import { useCallback, useState } from 'react'
import Card from '../ui/Card'

function TaskList({ tasks, dispatch, pendingTasks, completedTasks, subjects, activePlanId, plans = [] }) {
  const [newTask, setNewTask] = useState('')
  const [selectedSubjectId, setSelectedSubjectId] = useState('')
  const [dueDate, setDueDate] = useState('')
  const subjectOptions = subjects ?? []
  const today = new Date().toISOString().split('T')[0]
  const subjectNameCounts = subjectOptions.reduce((acc, subject) => {
    const key = subject.name.trim().toLowerCase()
    acc[key] = (acc[key] ?? 0) + 1
    return acc
  }, {})

  function formatDueDate(date) {
    if (!date) return ''

    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(new Date(`${date}T00:00:00`))
  }

  const handleAddTask = useCallback(() => {
    const selectedSubject = subjectOptions.find(
      (subject) => subject.id === Number(selectedSubjectId)
    )
    const resolvedPlanId = selectedSubject?.planId ?? activePlanId ?? null

    if (newTask.trim() === '') return
    if (selectedSubjectId === '') {
      alert('Selecione uma matéria para a tarefa.')
      return
    }
    if (!selectedSubject) {
      alert('A matéria selecionada não foi encontrada.')
      return
    }
    if (dueDate === '') {
      alert('Selecione um prazo para a tarefa.')
      return
    }
    if (dueDate < today) {
      alert('O prazo não pode ser anterior ao dia de hoje.')
      return
    }
    if (!resolvedPlanId) {
      alert('Nao foi possivel identificar o plano desta materia.')
      return
    }

    dispatch({
      type: 'ADD_TASK',
      payload: {
        text: newTask.trim(),
        subjectId: selectedSubject.id,
        planId: resolvedPlanId,
        dueDate
      }
    })

    setNewTask('')
    setSelectedSubjectId('')
    setDueDate('')
  }, [newTask, selectedSubjectId, dueDate, today, activePlanId, dispatch, subjectOptions])

  return (
    <Card>
      <section className="panel-section task-section">
        <h2 className="section-title">Tarefas</h2>

        <div className="task-meta">
          <span className="pill success">✅ Concluídas: {completedTasks}</span>
          <span className="pill info">⏳ Pendentes: {pendingTasks}</span>
        </div>
        <div className="subject-form">
          <select
            className="subject-input"
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}>
            <option value="">Selecione uma matéria</option>
            {subjectOptions.map((subject) => {
              const hasDuplicateName =
                subjectNameCounts[subject.name.trim().toLowerCase()] > 1
              const planName =
                plans.find((plan) => plan.id === subject.planId)?.name || 'Plano sem nome'

              return (
                <option key={subject.id} value={subject.id}>
                  {hasDuplicateName ? `${subject.name} - ${planName}` : subject.name}
                </option>
              )
            })}
          </select>
        </div>
        <div className="subject-form">
          <input
            className="subject-input"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="Nova tarefa"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddTask()
            }}
          />

          <input
            className="subject-input"
            type="date"
            value={dueDate}
            min={today}
            onChange={(e) => setDueDate(e.target.value)}
          />

          <button className="subject-add-button" onClick={handleAddTask}>
            Adicionar
          </button>
        </div>

        <ul className="subject-list task-list">
          {tasks.map((task) => {
            const subject = subjectOptions.find((item) => item.id === task.subjectId)

            return (
              <li
                className={`subject-item task-item ${task.completed ? 'completed' : ''}`}
                key={task.id}
              >
                <div>
                  <span className={`task-text ${task.completed ? 'done' : ''}`}>
                    {task.text}
                  </span>
                  <p className="task-subject-label">
                    {subject ? subject.name : 'Sem matéria'}
                  </p>
                  {task.dueDate ? (
                    <p className="task-subject-label">
                      Prazo: {formatDueDate(task.dueDate)}
                    </p>
                  ) : null}
                </div>

                <div className="chip-group">
                  <button
                    className="subject-remove-button task-check-button"
                    onClick={() =>
                      dispatch({ type: 'TOGGLE_TASK', payload: task.id })
                    }
                  >
                    ✔
                  </button>

                  <button
                    className="subject-remove-button"
                    onClick={() =>
                      dispatch({ type: 'REMOVE_TASK', payload: task.id })
                    }
                  >
                    ✕
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      </section>
    </Card>
  )
}

export default TaskList
