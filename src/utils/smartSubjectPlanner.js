/**
 * Calcula qual matéria estudar hoje baseado em:
 * - Quantidade de tarefas pendentes
 * - Última vez que estudou cada matéria
 * - Equilíbrio de horas de estudo entre matérias
 */

export function calculateTodaySubject(subjects, tasks, agendaItems = []) {
  if (!subjects || subjects.length === 0) return null

  const today = new Date().toISOString().split('T')[0]

  // Mapear tarefas por matéria
  const tasksBySubject = {}
  const lastStudyDateBySubject = {}

  subjects.forEach((subject) => {
    tasksBySubject[subject.id] = {
      id: subject.id,
      name: subject.name,
      planId: subject.planId,
      pendingCount: 0,
      completedCount: 0,
      totalDaysWithoutStudy: 0,
      priorityScore: 0
    }
  })

  // Contar tarefas por matéria
  tasks.forEach((task) => {
    if (tasksBySubject[task.subjectId]) {
      if (task.completed) {
        tasksBySubject[task.subjectId].completedCount += 1
        // Atualizar última data de estudo
        lastStudyDateBySubject[task.subjectId] = new Date(task.completedAt || task.dueDate || today)
      } else {
        tasksBySubject[task.subjectId].pendingCount += 1
      }
    }
  })

  // Calcular horas de estudo dos itens de agenda
  const studyHoursBySubject = {}
  agendaItems.forEach((item) => {
    if (item.subjectId && item.eventName?.toLowerCase().includes('estud')) {
      if (!studyHoursBySubject[item.subjectId]) {
        studyHoursBySubject[item.subjectId] = 0
      }

      if (item.startTime && item.endTime) {
        const [startHour, startMin] = item.startTime.split(':').map(Number)
        const [endHour, endMin] = item.endTime.split(':').map(Number)
        const duration = (endHour - startHour) + (endMin - startMin) / 60
        studyHoursBySubject[item.subjectId] += Math.max(0, duration)
      }
    }
  })

  // Calcular score de prioridade para cada matéria
  Object.values(tasksBySubject).forEach((subject) => {
    const lastStudy = lastStudyDateBySubject[subject.id] || new Date(0)
    const daysSinceLastStudy = Math.floor(
      (new Date(today) - lastStudy) / (1000 * 60 * 60 * 24)
    )

    subject.totalDaysWithoutStudy = daysSinceLastStudy
    const studyHours = studyHoursBySubject[subject.id] || 0

    // Score = (tarefas pendentes * 3) + (dias sem estudar) - (horas estudadas)
    subject.priorityScore =
      subject.pendingCount * 3 + daysSinceLastStudy - studyHours * 0.5

    // Bônus se tem tarefas vencidas ou vencendo hoje
    const tasksForToday = tasks.filter(
      (t) => t.subjectId === subject.id && !t.completed && t.dueDate <= today
    )
    subject.priorityScore += tasksForToday.length * 5
  })

  // Retornar matéria com maior score
  const sorted = Object.values(tasksBySubject).sort(
    (a, b) => b.priorityScore - a.priorityScore
  )

  return sorted[0] || null
}

/**
 * Calcula quantas horas estudar baseado em:
 * - Quantidade de tarefas pendentes
 * - Dificuldade estimada
 * - Horas já estudadas hoje
 */
export function suggestStudyHours(subject, tasks, agendaItems = []) {
  if (!subject) return 1

  const today = new Date().toISOString().split('T')[0]

  // Contar tarefas pendentes dessa matéria
  const pendingTasks = tasks.filter(
    (t) => t.subjectId === subject.id && !t.completed
  )

  // Contar tarefas vencidas/vencendo hoje
  const urgentTasks = pendingTasks.filter((t) => t.dueDate <= today)

  // Calcular horas já estudadas hoje
  const studiedHoursToday = agendaItems
    .filter(
      (item) =>
        item.subjectId === subject.id &&
        item.dateKeys?.includes(today) &&
        item.eventName?.toLowerCase().includes('estud')
    )
    .reduce((total, item) => {
      if (item.startTime && item.endTime) {
        const [startHour, startMin] = item.startTime.split(':').map(Number)
        const [endHour, endMin] = item.endTime.split(':').map(Number)
        const duration = (endHour - startHour) + (endMin - startMin) / 60
        return total + Math.max(0, duration)
      }
      return total
    }, 0)

  // Suggestão: 1 hora base + 0.5 por tarefa urgente + 1 hora se tiver muitas pendentes
  let suggested = 1 // Base
  suggested += urgentTasks.length * 0.5 // Tarefas vencendo
  suggested += pendingTasks.length > 5 ? 1 : pendingTasks.length * 0.2 // Volume

  // Máximo 4 horas e mínimo 1 hora
  suggested = Math.max(1, Math.min(4, suggested))

  // Arredondar para 0.5 hora (30 minutos)
  suggested = Math.round(suggested * 2) / 2

  return {
    suggestedHours: suggested,
    hoursStudiedToday: parseFloat(studiedHoursToday.toFixed(2)),
    pendingTasks: pendingTasks.length,
    urgentTasks: urgentTasks.length
  }
}

/**
 * Organiza matérias em ordem de prioridade com sugestões de estudo
 */
export function getSmartSchedule(subjects, tasks, agendaItems = []) {
  const schedule = subjects
    .map((subject) => {
      const todaySubject = {
        ...subject,
        isToday: false
      }

      const recommendation = calculateTodaySubject([subject], tasks, agendaItems)
      if (recommendation?.id === subject.id) {
        todaySubject.isToday = true
      }

      const hours = suggestStudyHours(subject, tasks, agendaItems)
      return {
        ...todaySubject,
        priorityScore: recommendation?.priorityScore || 0,
        studyRecommendation: hours
      }
    })
    .sort((a, b) => b.priorityScore - a.priorityScore)

  return schedule
}
