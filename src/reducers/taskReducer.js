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
          completed: false
        }
      ]

    case 'REMOVE_TASK':
      return state.filter((task) => task.id !== action.payload)

    case 'TOGGLE_TASK':
      return state
        .map((task) =>
          task.id === action.payload
            ? { ...task, completed: !task.completed }
            : task
        )
        .sort(
          (a, b) =>
            Number(a.completed) - Number(b.completed) || a.id - b.id
        )

    case 'HYDRATE':
      return action.payload

    default:
      return state
  }
}
