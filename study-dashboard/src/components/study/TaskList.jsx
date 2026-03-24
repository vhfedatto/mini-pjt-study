import { useCallback, useEffect, useMemo, useReducer, useState } from 'react'
import { taskReducer } from '../../reducers/taskReducer'
import Card from '../ui/Card'

function TaskList() {
  const [tasks, dispatch] = useReducer(
    taskReducer,
    [],
    () => {
      const stored = localStorage.getItem('tasks')
      return stored ? JSON.parse(stored) : []
    }
  )
  const [newTask, setNewTask] = useState('')

  const completedTasks = useMemo(() => {
    return tasks.filter((task) => task.completed).length
  }, [tasks])

  const pendingTasks = useMemo(() => {
    return tasks.filter((task) => !task.completed).length
  }, [tasks])

  const handleAddTask = useCallback(() => {
    if (newTask.trim() === '') return

    dispatch({
      type: 'ADD_TASK',
      payload: newTask
    })

    setNewTask('')
  }, [newTask, dispatch])

  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks))
  }, [tasks])

  return (
    <Card>
      <h2 className="section-title">Tarefas</h2>

      <div className="task-meta">
        <span className="pill success">✅ Concluídas: {completedTasks}</span>
        <span className="pill info">⏳ Pendentes: {pendingTasks}</span>
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

        <button className="subject-add-button" onClick={handleAddTask}>
          Adicionar
        </button>
      </div>

      <ul className="subject-list">
        {tasks.map((task) => (
          <li
            className={`subject-item task-item ${
              task.completed ? 'completed' : ''
            }`}
            key={task.id}
          >
            <span className={`task-text ${task.completed ? 'done' : ''}`}>
              {task.text}
            </span>

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
        ))}
      </ul>
    </Card>
  )
}

export default TaskList
