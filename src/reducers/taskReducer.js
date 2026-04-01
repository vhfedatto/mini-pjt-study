export function taskReducer(state, action) {
  switch (action.type) {
    case 'ADD_TASK':
      return [
        ...state,
        {
          id: Date.now(),
          text: action.payload.text,
          subjectId: action.payload.subjectId,
          planId: action.payload.planId,
          dueDate: action.payload.dueDate,
          completed: false,
          archived: false
        }
      ]

    case 'REMOVE_TASK':
      return state.filter((task) => task.id !== action.payload)

    case 'TOGGLE_TASK':
      return state
        .map((task) =>
          task.id === action.payload
            ? {
                ...task,
                completed: !task.completed,
                archived: task.completed ? false : task.archived
              }
            : task
        )
        .sort(
          (a, b) =>
            Number(a.completed) - Number(b.completed) || a.id - b.id
        )

    case 'ARCHIVE_TASK':
      return state.map((task) =>
        task.id === action.payload && task.completed
          ? { ...task, archived: true }
          : task
      )

    case 'UNARCHIVE_TASK':
      return state.map((task) =>
        task.id === action.payload
          ? { ...task, archived: false, completed: true }
          : task
      )

    case 'HYDRATE':
      return action.payload.map((task) => ({
        ...task,
        archived: Boolean(task.archived)
      }))

    default:
      return state
  }
}
