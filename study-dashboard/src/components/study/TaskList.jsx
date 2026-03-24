import { useReducer, useState } from 'react'
import { taskReducer } from '../../reducers/taskReducer'
import Card from '../ui/Card'

function TaskList() {
  const [tasks, dispatch] = useReducer(taskReducer, [])
  const [newTask, setNewTask] = useState('')

  function handleAddTask() {
    if (newTask.trim() === '') return

    dispatch({
      type: 'ADD_TASK',
      payload: newTask
    })

    setNewTask('')
  }

  return (
    <Card>
      <h2 className="section-title">Tarefas</h2>

      <div className="subject-form">
        <input
          className="subject-input"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          placeholder="Nova tarefa"
        />

        <button className="subject-add-button" onClick={handleAddTask}>
          Adicionar
        </button>
      </div>

      <ul className="subject-list">
        {tasks.map((task) => (
          <li className="subject-item" key={task.id}>
            <span
              style={{
                textDecoration: task.completed ? 'line-through' : 'none'
              }}
            >
              {task.text}
            </span>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="subject-remove-button"
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