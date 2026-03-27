import { useEffect, useMemo, useState } from 'react'
import Header from '../components/layout/Header'
import SummaryCard from '../components/ui/SummaryCard'
import Footer from '../components/layout/Footer'
import Card from '../components/ui/Card'

const AGENDA_STORAGE_KEY = 'agendaItems'
const IMPORTANT_DATES_STORAGE_KEY = 'importantDates'
const WEEK_DAYS = [
  { value: '1', label: 'Segunda-feira' },
  { value: '2', label: 'Terça-feira' },
  { value: '3', label: 'Quarta-feira' },
  { value: '4', label: 'Quinta-feira' },
  { value: '5', label: 'Sexta-feira' },
  { value: '6', label: 'Sábado' },
  { value: '0', label: 'Domingo' }
]

function getDayLabel(dayValue) {
  return WEEK_DAYS.find((entry) => entry.value === String(dayValue))?.label || 'Dia não informado'
}

function toDateKey(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function monthLabel(date) {
  return new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    year: 'numeric'
  }).format(date)
}

function buildMonthGrid(monthDate) {
  const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)
  const lastDay = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0)
  const leading = firstDay.getDay()
  const totalDays = lastDay.getDate()
  const totalSlots = Math.ceil((leading + totalDays) / 7) * 7
  const cells = []

  for (let index = 0; index < totalSlots; index += 1) {
    const dayNumber = index - leading + 1
    if (dayNumber < 1 || dayNumber > totalDays) {
      cells.push({ isPlaceholder: true, key: `placeholder-${index}` })
      continue
    }

    const date = new Date(monthDate.getFullYear(), monthDate.getMonth(), dayNumber)
    cells.push({
      key: toDateKey(date),
      isPlaceholder: false,
      dayNumber,
      date,
      dateKey: toDateKey(date),
      weekDay: String(date.getDay())
    })
  }

  return cells
}

function Agenda() {
  const [subjects] = useState(() => {
    const stored = localStorage.getItem('subjects')
    return stored ? JSON.parse(stored) : []
  })

  const currentDay = String(new Date().getDay())

  const [agendaItems, setAgendaItems] = useState(() => {
    const stored = localStorage.getItem(AGENDA_STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  })
  const [importantDates, setImportantDates] = useState(() => {
    const stored = localStorage.getItem(IMPORTANT_DATES_STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  })
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(() => toDateKey(new Date()))
  const [selectedSubjectId, setSelectedSubjectId] = useState('')
  const [customSubject, setCustomSubject] = useState('')
  const [agendaTitle, setAgendaTitle] = useState('')
  const [dayOfWeek, setDayOfWeek] = useState(currentDay)
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [notes, setNotes] = useState('')

  const sortedAgendaItems = useMemo(
    () =>
      [...agendaItems].sort(
        (left, right) =>
          Number(left.dayOfWeek) - Number(right.dayOfWeek) ||
          left.startTime.localeCompare(right.startTime) ||
          left.id - right.id
      ),
    [agendaItems]
  )

  const todayItems = useMemo(
    () => sortedAgendaItems.filter((item) => String(item.dayOfWeek) === currentDay),
    [currentDay, sortedAgendaItems]
  )

  const upcomingItem = useMemo(() => {
    if (sortedAgendaItems.length === 0) return null

    const now = new Date()
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    const nextToday = todayItems.find((item) => item.startTime >= currentTime)
    if (nextToday) return nextToday

    return sortedAgendaItems[0]
  }, [sortedAgendaItems, todayItems])

  const subjectsInAgenda = useMemo(
    () => new Set(sortedAgendaItems.map((item) => item.subjectName.toLowerCase())).size,
    [sortedAgendaItems]
  )

  const importantDatesWithSubject = useMemo(
    () =>
      importantDates
        .map((item) => {
          const linkedSubject = subjects.find((subject) => subject.id === item.subjectId)

          return {
            ...item,
            subjectName: linkedSubject?.name || 'Matéria removida'
          }
        })
        .sort((left, right) => left.dueDate.localeCompare(right.dueDate) || left.id - right.id),
    [importantDates, subjects]
  )

  const pendingImportantDates = useMemo(
    () => importantDatesWithSubject.filter((item) => !item.completed),
    [importantDatesWithSubject]
  )

  const monthGrid = useMemo(() => buildMonthGrid(calendarMonth), [calendarMonth])

  const selectedDateAgendaItems = useMemo(() => {
    const selectedCell = monthGrid.find((cell) => !cell.isPlaceholder && cell.dateKey === selectedCalendarDate)
    if (!selectedCell) return []

    return sortedAgendaItems.filter((item) => String(item.dayOfWeek) === selectedCell.weekDay)
  }, [monthGrid, selectedCalendarDate, sortedAgendaItems])

  const selectedDateImportantDates = useMemo(
    () => importantDatesWithSubject.filter((item) => item.dueDate === selectedCalendarDate),
    [importantDatesWithSubject, selectedCalendarDate]
  )

  useEffect(() => {
    localStorage.setItem(AGENDA_STORAGE_KEY, JSON.stringify(agendaItems))
  }, [agendaItems])

  useEffect(() => {
    const syncAgenda = () => {
      const stored = localStorage.getItem(AGENDA_STORAGE_KEY)
      setAgendaItems(stored ? JSON.parse(stored) : [])
    }

    const syncImportantDates = () => {
      const stored = localStorage.getItem(IMPORTANT_DATES_STORAGE_KEY)
      setImportantDates(stored ? JSON.parse(stored) : [])
    }

    globalThis.addEventListener('storage', syncAgenda)
    globalThis.addEventListener('storage', syncImportantDates)
    globalThis.addEventListener('important-dates-updated', syncImportantDates)

    return () => {
      globalThis.removeEventListener('storage', syncAgenda)
      globalThis.removeEventListener('storage', syncImportantDates)
      globalThis.removeEventListener('important-dates-updated', syncImportantDates)
    }
  }, [])

  function resetForm() {
    setSelectedSubjectId('')
    setCustomSubject('')
    setAgendaTitle('')
    setDayOfWeek(currentDay)
    setStartTime('')
    setEndTime('')
    setNotes('')
  }

  function handleAddAgendaItem(event) {
    event.preventDefault()

    const selectedSubject = subjects.find((subject) => subject.id === Number(selectedSubjectId))
    const resolvedSubjectName = selectedSubject?.name || customSubject.trim()
    const trimmedTitle = agendaTitle.trim()
    const trimmedNotes = notes.trim()

    if (!resolvedSubjectName) {
      alert('Selecione uma matéria cadastrada ou digite uma matéria para adicionar na agenda.')
      return
    }

    if (!trimmedTitle) {
      alert('Adicione um título para este horário de estudo.')
      return
    }

    if (!startTime || !endTime) {
      alert('Defina horário de início e fim.')
      return
    }

    if (endTime <= startTime) {
      alert('O horário de fim precisa ser maior que o horário de início.')
      return
    }

    setAgendaItems((previous) => [
      ...previous,
      {
        id: Date.now(),
        subjectId: selectedSubject?.id ?? null,
        subjectName: resolvedSubjectName,
        title: trimmedTitle,
        dayOfWeek,
        startTime,
        endTime,
        notes: trimmedNotes
      }
    ])

    resetForm()
  }

  function handleRemoveAgendaItem(id) {
    setAgendaItems((previous) => previous.filter((item) => item.id !== id))
  }

  return (
    <section className="dashboard-content">
      <Header />

      <section className="summary-grid">
        <SummaryCard
          title="Horários na agenda"
          value={sortedAgendaItems.length}
          description="Sessões de estudo programadas"
        />
        <SummaryCard
          title="Para hoje"
          value={todayItems.length}
          description={`${getDayLabel(currentDay)} com estudos planejados`}
        />
        <SummaryCard
          title="Matérias na semana"
          value={subjectsInAgenda}
          description="Disciplinas com horário definido"
        />
        <SummaryCard
          title="Provas pendentes"
          value={pendingImportantDates.length}
          description="Avaliações ainda não concluídas"
        />
        <SummaryCard
          title="Próximo horário"
          value={upcomingItem ? `${upcomingItem.startTime} - ${upcomingItem.endTime}` : 'Sem horários'}
          description={
            upcomingItem
              ? `${upcomingItem.subjectName} • ${getDayLabel(upcomingItem.dayOfWeek)}`
              : 'Adicione horários para organizar sua rotina'
          }
          variant="alert"
        />
      </section>

      <section className="split-grid agenda-layout">
        <Card>
          <section className="panel-section">
            <h2 className="section-title">Adicionar horário</h2>
            <p className="agenda-helper">Monte sua semana de estudos por matéria, horário e foco.</p>

            <form className="agenda-form" onSubmit={handleAddAgendaItem}>
              {subjects.length > 0 ? (
                <div className="plan-field-group">
                  <label className="plan-field-label" htmlFor="agenda-subject">Matéria cadastrada</label>
                  <select
                    id="agenda-subject"
                    className="subject-input"
                    value={selectedSubjectId}
                    onChange={(event) => setSelectedSubjectId(event.target.value)}
                  >
                    <option value="">Selecionar matéria</option>
                    {subjects.map((subject) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              <div className="plan-field-group">
                <label className="plan-field-label" htmlFor="agenda-custom-subject">Ou digite a matéria</label>
                <input
                  id="agenda-custom-subject"
                  className="subject-input"
                  type="text"
                  placeholder="Ex: História"
                  value={customSubject}
                  onChange={(event) => setCustomSubject(event.target.value)}
                />
              </div>

              <div className="plan-field-group">
                <label className="plan-field-label" htmlFor="agenda-title">Título do estudo</label>
                <input
                  id="agenda-title"
                  className="subject-input"
                  type="text"
                  placeholder="Ex: Revisão de funções"
                  value={agendaTitle}
                  onChange={(event) => setAgendaTitle(event.target.value)}
                />
              </div>

              <div className="agenda-time-grid">
                <div className="plan-field-group">
                  <label className="plan-field-label" htmlFor="agenda-day">Dia</label>
                  <select
                    id="agenda-day"
                    className="subject-input"
                    value={dayOfWeek}
                    onChange={(event) => setDayOfWeek(event.target.value)}
                  >
                    {WEEK_DAYS.map((day) => (
                      <option key={day.value} value={day.value}>
                        {day.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="plan-field-group">
                  <label className="plan-field-label" htmlFor="agenda-start">Início</label>
                  <input
                    id="agenda-start"
                    className="subject-input"
                    type="time"
                    value={startTime}
                    onChange={(event) => setStartTime(event.target.value)}
                  />
                </div>

                <div className="plan-field-group">
                  <label className="plan-field-label" htmlFor="agenda-end">Fim</label>
                  <input
                    id="agenda-end"
                    className="subject-input"
                    type="time"
                    value={endTime}
                    onChange={(event) => setEndTime(event.target.value)}
                  />
                </div>
              </div>

              <div className="plan-field-group">
                <label className="plan-field-label" htmlFor="agenda-notes">Observações</label>
                <textarea
                  id="agenda-notes"
                  className="subject-input agenda-notes"
                  placeholder="Ex: Priorizar exercícios de fixação"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                />
              </div>

              <div className="agenda-actions">
                <button type="submit" className="subject-add-button">Adicionar à agenda</button>
                <button type="button" className="header-button header-button-secondary" onClick={resetForm}>
                  Limpar
                </button>
              </div>
            </form>
          </section>
        </Card>

        <Card>
          <section className="panel-section">
            <div className="agenda-calendar-header">
              <div>
                <h2 className="section-title">Agenda + Provas</h2>
                <p className="agenda-helper">Calendário integrado com horários da agenda e datas de provas.</p>
              </div>

              <div className="agenda-calendar-controls">
                <button
                  type="button"
                  className="plan-action-btn"
                  onClick={() =>
                    setCalendarMonth(
                      (previous) => new Date(previous.getFullYear(), previous.getMonth() - 1, 1)
                    )
                  }
                >
                  Mes anterior
                </button>
                <strong className="agenda-month-label">{monthLabel(calendarMonth)}</strong>
                <button
                  type="button"
                  className="plan-action-btn"
                  onClick={() =>
                    setCalendarMonth(
                      (previous) => new Date(previous.getFullYear(), previous.getMonth() + 1, 1)
                    )
                  }
                >
                  Proximo mes
                </button>
              </div>
            </div>

            <div className="agenda-calendar-grid" role="grid" aria-label="Calendário mensal">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'].map((label) => (
                <span key={label} className="agenda-calendar-weekday">{label}</span>
              ))}

              {monthGrid.map((cell) => {
                if (cell.isPlaceholder) {
                  return <span key={cell.key} className="agenda-calendar-cell agenda-calendar-cell-placeholder" />
                }

                const agendaCount = sortedAgendaItems.filter(
                  (item) => String(item.dayOfWeek) === cell.weekDay
                ).length
                const importantCount = importantDatesWithSubject.filter(
                  (item) => item.dueDate === cell.dateKey
                ).length
                const isSelected = selectedCalendarDate === cell.dateKey
                const isToday = cell.dateKey === toDateKey(new Date())

                return (
                  <button
                    type="button"
                    key={cell.key}
                    className={`agenda-calendar-cell${isSelected ? ' is-selected' : ''}${isToday ? ' is-today' : ''}`}
                    onClick={() => setSelectedCalendarDate(cell.dateKey)}
                  >
                    <span className="agenda-calendar-day">{cell.dayNumber}</span>
                    <span className="agenda-calendar-markers">
                      {agendaCount > 0 ? (
                        <span className="agenda-marker agenda-marker-study">Estudos: {agendaCount}</span>
                      ) : null}
                      {importantCount > 0 ? (
                        <span className="agenda-marker agenda-marker-proof">Provas: {importantCount}</span>
                      ) : null}
                    </span>
                  </button>
                )
              })}
            </div>

            <div className="agenda-day-details">
              <h3 className="agenda-day-title">
                Detalhes de {new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(`${selectedCalendarDate}T00:00:00`))}
              </h3>

              <div className="agenda-day-columns">
                <div>
                  <h4>Agenda de estudos</h4>
                  {selectedDateAgendaItems.length > 0 ? (
                    <ul className="agenda-mini-list">
                      {selectedDateAgendaItems.map((item) => (
                        <li key={`study-${item.id}`}>
                          <strong>{item.title}</strong>
                          <span>{`${item.startTime} - ${item.endTime} • ${item.subjectName}`}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="empty-message">Sem horário de estudo para este dia.</p>
                  )}
                </div>

                <div>
                  <h4>Provas e datas importantes</h4>
                  {selectedDateImportantDates.length > 0 ? (
                    <ul className="agenda-mini-list">
                      {selectedDateImportantDates.map((item) => (
                        <li key={`proof-${item.id}`}>
                          <strong>{item.title}</strong>
                          <span>{`${item.subjectName}${item.completed ? ' • concluída' : ''}`}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="empty-message">Sem provas cadastradas para este dia.</p>
                  )}
                </div>
              </div>
            </div>

            <h3 className="agenda-list-title">Horários de estudo da semana</h3>

            {sortedAgendaItems.length > 0 ? (
              <ul className="agenda-list">
                {sortedAgendaItems.map((item) => (
                  <li key={item.id} className="agenda-item">
                    <div className="agenda-item-main">
                      <div className="agenda-item-header">
                        <h3>{item.title}</h3>
                        <span className="pill info">{getDayLabel(item.dayOfWeek)}</span>
                      </div>
                      <p className="agenda-item-subject">{item.subjectName}</p>
                      <p className="agenda-item-time">{`${item.startTime} - ${item.endTime}`}</p>
                      {item.notes ? <p className="agenda-item-notes">{item.notes}</p> : null}
                    </div>

                    <button
                      type="button"
                      className="subject-remove-button"
                      onClick={() => handleRemoveAgendaItem(item.id)}
                      aria-label="Remover horário da agenda"
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="empty-message">Nenhum horário cadastrado ainda. Adicione seu primeiro bloco de estudo.</p>
            )}
          </section>
        </Card>
      </section>

      <Footer />
    </section>
  )
}

export default Agenda