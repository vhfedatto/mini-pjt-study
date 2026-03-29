import { useEffect, useMemo, useState } from 'react'
import Header from '../components/layout/Header'
import SummaryCard from '../components/ui/SummaryCard'
import Footer from '../components/layout/Footer'
import Card from '../components/ui/Card'

const AGENDA_STORAGE_KEY = 'agendaItems'
const IMPORTANT_DATES_STORAGE_KEY = 'importantDates'
const CALENDAR_WEEK_DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab']
const REPEAT_OPTIONS = [
  { value: 'none', label: 'Nao repetir' },
  { value: 'every-x-days', label: 'Repetir a cada X dias' },
  { value: 'weekly', label: 'Toda semana' },
  { value: 'weekdays', label: 'Todos os dias uteis' },
  { value: 'weekends', label: 'Apenas fins de semana' },
  { value: 'specific-weekdays', label: 'Dias da semana especificos' }
]

function toDateKey(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatDateLabel(dateKey, options = { day: '2-digit', month: '2-digit', year: 'numeric' }) {
  return new Intl.DateTimeFormat('pt-BR', options).format(new Date(`${dateKey}T00:00:00`))
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
      dateKey: toDateKey(date)
    })
  }

  return cells
}

function getNextDateKeyForWeekDay(weekDay) {
  const today = new Date()
  const normalizedWeekDay = Number(weekDay)
  const offset = (normalizedWeekDay - today.getDay() + 7) % 7
  const nextDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset)
  return toDateKey(nextDate)
}

function sortDateKeys(dateKeys) {
  return [...new Set(dateKeys)].sort((left, right) => left.localeCompare(right))
}

function addDays(dateKey, amount) {
  const date = new Date(`${dateKey}T00:00:00`)
  date.setDate(date.getDate() + amount)
  return toDateKey(date)
}

function getWeekDayValue(dateKey) {
  return new Date(`${dateKey}T00:00:00`).getDay()
}

function buildRecurringDateKeys({
  selectedDateKeys,
  repeatMode,
  repeatUntil,
  repeatIntervalDays,
  repeatWeekDays
}) {
  const baseDateKeys = sortDateKeys(selectedDateKeys)

  if (repeatMode === 'none' || !repeatUntil || baseDateKeys.length === 0) {
    return baseDateKeys
  }

  const firstDateKey = baseDateKeys[0]
  if (repeatUntil < firstDateKey) return baseDateKeys

  if (repeatMode === 'every-x-days') {
    const interval = Math.max(1, Number(repeatIntervalDays) || 1)
    const generated = []

    baseDateKeys.forEach((startDateKey) => {
      let nextDateKey = startDateKey
      while (nextDateKey <= repeatUntil) {
        generated.push(nextDateKey)
        nextDateKey = addDays(nextDateKey, interval)
      }
    })

    return sortDateKeys(generated)
  }

  const allowedWeekDays =
    repeatMode === 'weekly'
      ? [...new Set(baseDateKeys.map((dateKey) => getWeekDayValue(dateKey)))]
      : repeatMode === 'weekdays'
        ? [1, 2, 3, 4, 5]
        : repeatMode === 'weekends'
          ? [0, 6]
          : repeatMode === 'specific-weekdays'
            ? repeatWeekDays.map(Number)
            : []

  if (allowedWeekDays.length === 0) {
    return baseDateKeys
  }

  const generated = []
  let cursor = firstDateKey

  while (cursor <= repeatUntil) {
    if (allowedWeekDays.includes(getWeekDayValue(cursor))) {
      generated.push(cursor)
    }
    cursor = addDays(cursor, 1)
  }

  return sortDateKeys([...baseDateKeys, ...generated])
}

function normalizeAgendaItems(items) {
  if (!Array.isArray(items)) return []

  return items
    .map((item) => {
      const normalizedDateKeys = Array.isArray(item.dateKeys)
        ? sortDateKeys(item.dateKeys)
        : item.dateKey
          ? [item.dateKey]
          : item.dayOfWeek !== undefined
            ? [getNextDateKeyForWeekDay(item.dayOfWeek)]
            : []

      return {
        id: item.id ?? Date.now(),
        subjectId: item.subjectId ?? null,
        subjectName: item.subjectName ?? '',
        eventName: item.eventName ?? item.title ?? '',
        dateKeys: normalizedDateKeys,
        completed: Boolean(item.completed),
        startTime: item.startTime ?? '',
        endTime: item.endTime ?? '',
        notes: item.notes ?? ''
      }
    })
    .filter((item) => item.eventName && item.startTime && item.endTime && item.dateKeys.length > 0)
}

function getAgendaItemPrimaryDate(item) {
  return item.dateKeys[0] ?? '9999-12-31'
}

function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M4 20h4l10.5-10.5a2.12 2.12 0 0 0-3-3L5 17v3Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="m13.5 6.5 4 4"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="m5 12 4.2 4.2L19 6.5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  )
}

function Agenda() {
  const [subjects] = useState(() => {
    const stored = localStorage.getItem('subjects')
    return stored ? JSON.parse(stored) : []
  })
  const todayKey = toDateKey(new Date())

  const [agendaItems, setAgendaItems] = useState(() => {
    const stored = localStorage.getItem(AGENDA_STORAGE_KEY)
    return normalizeAgendaItems(stored ? JSON.parse(stored) : [])
  })
  const [importantDates, setImportantDates] = useState(() => {
    const stored = localStorage.getItem(IMPORTANT_DATES_STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  })
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(todayKey)
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false)
  const [editingAgendaItemId, setEditingAgendaItemId] = useState(null)
  const [selectedSubjectId, setSelectedSubjectId] = useState('')
  const [eventName, setEventName] = useState('')
  const [dateInput, setDateInput] = useState(todayKey)
  const [selectedDateKeys, setSelectedDateKeys] = useState([todayKey])
  const [repeatMode, setRepeatMode] = useState('none')
  const [repeatUntil, setRepeatUntil] = useState('')
  const [repeatIntervalDays, setRepeatIntervalDays] = useState('2')
  const [repeatWeekDays, setRepeatWeekDays] = useState([])
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [notes, setNotes] = useState('')

  const sortedAgendaItems = useMemo(
    () =>
      [...agendaItems].sort(
        (left, right) =>
          getAgendaItemPrimaryDate(left).localeCompare(getAgendaItemPrimaryDate(right)) ||
          left.startTime.localeCompare(right.startTime) ||
          left.id - right.id
      ),
    [agendaItems]
  )

  const todayItems = useMemo(
    () => sortedAgendaItems.filter((item) => item.dateKeys.includes(todayKey)),
    [sortedAgendaItems, todayKey]
  )

  const upcomingItem = useMemo(() => {
    if (sortedAgendaItems.length === 0) return null

    const now = new Date()
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    const futureOccurrences = sortedAgendaItems
      .flatMap((item) =>
        item.dateKeys.map((dateKey) => ({
          ...item,
          dateKey
        }))
      )
      .filter((item) => item.dateKey > todayKey || (item.dateKey === todayKey && item.endTime >= currentTime))
      .sort(
        (left, right) =>
          left.dateKey.localeCompare(right.dateKey) ||
          left.startTime.localeCompare(right.startTime) ||
          left.id - right.id
      )

    return futureOccurrences[0] ?? null
  }, [sortedAgendaItems, todayKey])

  const subjectsInAgenda = useMemo(
    () => new Set(sortedAgendaItems.filter((item) => item.subjectName).map((item) => item.subjectName.toLowerCase())).size,
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

  const selectedDateAgendaItems = useMemo(
    () => sortedAgendaItems.filter((item) => item.dateKeys.includes(selectedCalendarDate)),
    [selectedCalendarDate, sortedAgendaItems]
  )

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
      setAgendaItems(normalizeAgendaItems(stored ? JSON.parse(stored) : []))
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

  useEffect(() => {
    if (!isAddEventModalOpen) return undefined

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isAddEventModalOpen])

  function resetForm() {
    setEditingAgendaItemId(null)
    setSelectedSubjectId('')
    setEventName('')
    setDateInput(todayKey)
    setSelectedDateKeys([todayKey])
    setRepeatMode('none')
    setRepeatUntil('')
    setRepeatIntervalDays('2')
    setRepeatWeekDays([])
    setStartTime('')
    setEndTime('')
    setNotes('')
  }

  function handleAddSelectedDate() {
    if (!dateInput) return

    setSelectedDateKeys((previous) => sortDateKeys([...previous, dateInput]))
  }

  function handleRemoveSelectedDate(dateKeyToRemove) {
    setSelectedDateKeys((previous) => previous.filter((dateKey) => dateKey !== dateKeyToRemove))
  }

  function handleToggleRepeatWeekDay(weekDay) {
    setRepeatWeekDays((previous) =>
      previous.includes(weekDay)
        ? previous.filter((value) => value !== weekDay)
        : [...previous, weekDay].sort((left, right) => left - right)
    )
  }

  function handleAddAgendaItem(event) {
    event.preventDefault()

    const selectedSubject = subjects.find((subject) => subject.id === Number(selectedSubjectId))
    const trimmedEventName = eventName.trim()
    const trimmedNotes = notes.trim()

    if (!trimmedEventName) {
      alert('Adicione um nome para o evento.')
      return
    }

    if (selectedDateKeys.length === 0) {
      alert('Selecione pelo menos uma data para o evento.')
      return
    }

    if (repeatMode !== 'none' && !repeatUntil) {
      alert('Defina ate quando o evento deve se repetir.')
      return
    }

    if (repeatMode !== 'none' && repeatUntil < selectedDateKeys[0]) {
      alert('A data final da repeticao precisa ser igual ou maior que a primeira data selecionada.')
      return
    }

    if (repeatMode === 'specific-weekdays' && repeatWeekDays.length === 0) {
      alert('Selecione ao menos um dia da semana para repetir o evento.')
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

    const finalDateKeys = buildRecurringDateKeys({
      selectedDateKeys,
      repeatMode,
      repeatUntil,
      repeatIntervalDays,
      repeatWeekDays
    })

    const existingItem = editingAgendaItemId
      ? agendaItems.find((item) => item.id === editingAgendaItemId)
      : null

    const nextItem = {
      id: editingAgendaItemId ?? Date.now(),
      subjectId: selectedSubject?.id ?? null,
      subjectName: selectedSubject?.name ?? '',
      eventName: trimmedEventName,
      dateKeys: finalDateKeys,
      completed: existingItem?.completed ?? false,
      startTime,
      endTime,
      notes: trimmedNotes
    }

    setAgendaItems((previous) =>
      editingAgendaItemId
        ? previous.map((item) => (item.id === editingAgendaItemId ? nextItem : item))
        : [...previous, nextItem]
    )

    resetForm()
    setIsAddEventModalOpen(false)
  }

  function handleEditAgendaItem(item) {
    setEditingAgendaItemId(item.id)
    setSelectedSubjectId(item.subjectId ? String(item.subjectId) : '')
    setEventName(item.eventName)
    setDateInput(item.dateKeys[0] ?? todayKey)
    setSelectedDateKeys(item.dateKeys)
    setRepeatMode('none')
    setRepeatUntil('')
    setRepeatIntervalDays('2')
    setRepeatWeekDays([])
    setStartTime(item.startTime)
    setEndTime(item.endTime)
    setNotes(item.notes ?? '')
    setIsAddEventModalOpen(true)
  }

  function handleRemoveAgendaItem(id) {
    setAgendaItems((previous) => previous.filter((item) => item.id !== id))
  }

  function handleToggleAgendaItemCompleted(id) {
    setAgendaItems((previous) =>
      previous.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    )
  }

  return (
    <section className="dashboard-content">
      <Header />

      <section className="summary-grid">
        <SummaryCard
          title="Eventos na agenda"
          value={sortedAgendaItems.length}
          description="Blocos agendados em datas específicas"
        />
        <SummaryCard
          title="Para hoje"
          value={todayItems.length}
          description={`${formatDateLabel(todayKey, { weekday: 'long', day: '2-digit', month: '2-digit' })} com eventos planejados`}
        />
        <SummaryCard
          title="Matérias na agenda"
          value={subjectsInAgenda}
          description="Disciplinas vinculadas aos eventos"
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
              ? `${upcomingItem.eventName} • ${formatDateLabel(upcomingItem.dateKey)}`
              : 'Adicione eventos para organizar sua rotina'
          }
          variant="alert"
        />
      </section>

      <section className="split-grid agenda-layout">
        <Card>
          <section className="panel-section">
            <div className="agenda-calendar-header">
              <h2 className="section-title-agenda">Agenda</h2>
              
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
              <button
                type="button"
                className="header-button agenda-add-trigger"
                onClick={() => setIsAddEventModalOpen(true)}
              >
                Novo evento
              </button>
            </div>

            <div className="agenda-calendar-grid" role="grid" aria-label="Calendário mensal">
              {CALENDAR_WEEK_DAYS.map((label) => (
                <span key={label} className="agenda-calendar-weekday">{label}</span>
              ))}

              {monthGrid.map((cell) => {
                if (cell.isPlaceholder) {
                  return <span key={cell.key} className="agenda-calendar-cell agenda-calendar-cell-placeholder" />
                }

                const agendaCount = sortedAgendaItems.filter((item) => item.dateKeys.includes(cell.dateKey)).length
                const importantCount = importantDatesWithSubject.filter((item) => item.dueDate === cell.dateKey).length
                const isSelected = selectedCalendarDate === cell.dateKey
                const isToday = cell.dateKey === todayKey

                return (
                  <button
                    type="button"
                    key={cell.key}
                    className={`agenda-calendar-cell${isSelected ? ' is-selected' : ''}${isToday ? ' is-today' : ''}`}
                    onClick={() => {
                      setSelectedCalendarDate(cell.dateKey)
                      setDateInput(cell.dateKey)
                    }}
                  >
                    <span className="agenda-calendar-day">{cell.dayNumber}</span>
                    <span className="agenda-calendar-markers">
                      {agendaCount > 0 ? (
                        <span className="agenda-marker agenda-marker-study">Eventos: {agendaCount}</span>
                      ) : null}
                      {importantCount > 0 ? (
                        <span className="agenda-marker agenda-marker-proof">Provas: {importantCount}</span>
                      ) : null}
                    </span>
                  </button>
                )
              })}
            </div>

          </section>
        </Card>

        <section className="agenda-sidebar-column">
          <Card>
            <section className="panel-section agenda-panel-section agenda-day-details">
              <h3 className="agenda-day-title">
                Detalhes de {formatDateLabel(selectedCalendarDate)}
              </h3>

              <div className="agenda-day-columns">
                <div>
                  <h4>Eventos da agenda</h4>
                  {selectedDateAgendaItems.length > 0 ? (
                    <ul className="agenda-mini-list">
                      {selectedDateAgendaItems.map((item) => (
                        <li
                          key={`study-${item.id}`}
                          className={`agenda-detail-item${item.completed ? ' is-completed' : ''}`}
                        >
                          <div className="agenda-detail-copy">
                            <strong className="agenda-detail-title">{item.eventName}</strong>
                            <span className="agenda-detail-description">
                              {`${item.startTime} - ${item.endTime}${item.subjectName ? ` • ${item.subjectName}` : ''}`}
                            </span>
                          </div>
                          <div className="agenda-detail-actions">
                            <button
                              type="button"
                              className={`agenda-check-button${item.completed ? ' is-completed' : ''}`}
                              onClick={() => handleToggleAgendaItemCompleted(item.id)}
                              aria-label={item.completed ? 'Marcar evento como pendente' : 'Marcar evento como concluido'}
                            >
                              <CheckIcon />
                            </button>
                            <button
                              type="button"
                              className="agenda-icon-button"
                              onClick={() => handleEditAgendaItem(item)}
                              aria-label="Editar evento"
                            >
                              <PencilIcon />
                            </button>
                            <button
                              type="button"
                              className="subject-remove-button"
                              onClick={() => handleRemoveAgendaItem(item.id)}
                              aria-label="Remover evento da agenda"
                            >
                              ✕
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="empty-message">Sem evento cadastrado para este dia.</p>
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
            </section>
          </Card>
        </section>
      </section>

      {isAddEventModalOpen ? (
        <div
          className="plan-modal-overlay"
          role="presentation"
          onClick={() => setIsAddEventModalOpen(false)}
        >
          <div
            className="plan-modal agenda-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="agenda-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="important-date-modal-header">
              <div>
                <h2 id="agenda-modal-title" className="plan-modal-title">
                  {editingAgendaItemId ? 'Editar evento' : 'Adicionar evento'}
                </h2>
                <p className="agenda-helper">Selecione uma ou mais datas e salve o evento apenas nesses dias.</p>
              </div>
              <button
                type="button"
                className="subject-remove-button"
                onClick={() => setIsAddEventModalOpen(false)}
              >
                ✕
              </button>
            </div>

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
                    <option value="">Sem matéria específica</option>
                    {subjects.map((subject) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              <div className="plan-field-group">
                <label className="plan-field-label" htmlFor="agenda-event-name">Nome do evento</label>
                <input
                  id="agenda-event-name"
                  className="subject-input"
                  type="text"
                  placeholder="Ex: Revisão final, Simulado, Grupo de estudos"
                  value={eventName}
                  onChange={(event) => setEventName(event.target.value)}
                />
              </div>

              <div className="plan-field-group">
                <label className="plan-field-label" htmlFor="agenda-date-input">Datas do evento</label>
                <div className="agenda-date-builder">
                  <input
                    id="agenda-date-input"
                    className="subject-input"
                    type="date"
                    value={dateInput}
                    onChange={(event) => setDateInput(event.target.value)}
                  />
                  <button
                    type="button"
                    className="header-button header-button-secondary agenda-inline-button"
                    onClick={handleAddSelectedDate}
                  >
                    Adicionar data
                  </button>
                </div>
                <p className="agenda-helper agenda-helper-inline">
                  Escolha quantos dias quiser. O evento será salvo apenas nas datas selecionadas.
                </p>
                <div className="agenda-selected-dates">
                  {selectedDateKeys.map((dateKey) => (
                    <button
                      type="button"
                      key={dateKey}
                      className="agenda-date-chip"
                      onClick={() => handleRemoveSelectedDate(dateKey)}
                      aria-label={`Remover ${formatDateLabel(dateKey)} da seleção`}
                    >
                      {formatDateLabel(dateKey)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="plan-field-group">
                <label className="plan-field-label" htmlFor="agenda-repeat-mode">Repeticao</label>
                <select
                  id="agenda-repeat-mode"
                  className="subject-input"
                  value={repeatMode}
                  onChange={(event) => setRepeatMode(event.target.value)}
                >
                  {REPEAT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {repeatMode !== 'none' ? (
                <div className="agenda-repeat-panel">
                  <div className="plan-field-group">
                    <label className="plan-field-label" htmlFor="agenda-repeat-until">Repetir ate</label>
                    <input
                      id="agenda-repeat-until"
                      className="subject-input"
                      type="date"
                      value={repeatUntil}
                      min={selectedDateKeys[0]}
                      onChange={(event) => setRepeatUntil(event.target.value)}
                    />
                  </div>

                  {repeatMode === 'every-x-days' ? (
                    <div className="plan-field-group">
                      <label className="plan-field-label" htmlFor="agenda-repeat-interval">Pular quantos dias</label>
                      <input
                        id="agenda-repeat-interval"
                        className="subject-input"
                        type="number"
                        min="1"
                        value={repeatIntervalDays}
                        onChange={(event) => setRepeatIntervalDays(event.target.value)}
                      />
                    </div>
                  ) : null}

                  {repeatMode === 'specific-weekdays' ? (
                    <div className="plan-field-group">
                      <span className="plan-field-label">Dias da semana</span>
                      <div className="agenda-weekday-picker">
                        {CALENDAR_WEEK_DAYS.map((label, index) => (
                          <button
                            type="button"
                            key={label}
                            className={`agenda-weekday-chip${repeatWeekDays.includes(index) ? ' is-active' : ''}`}
                            onClick={() => handleToggleRepeatWeekDay(index)}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}

              <div className="agenda-time-grid">
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
                <button type="submit" className="subject-add-button">
                  {editingAgendaItemId ? 'Salvar alteracoes' : 'Adicionar à agenda'}
                </button>
                <button type="button" className="header-button header-button-secondary" onClick={resetForm}>
                  Limpar
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <Footer />
    </section>
  )
}

export default Agenda
