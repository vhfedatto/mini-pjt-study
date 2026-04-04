import { useEffect, useMemo, useRef, useState } from 'react'

const KEY = 'question-notebooks'
const OPT = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
const SESSION_KEY = 'question-training-resume'
const RESET_KEY = 'question-training-answer-history-reset-v1'
const DIREITOS_HUMANOS_RESET_KEY = 'question-training-reset-direitos-humanos-v1'

const DIFFICULTIES = [
  'Muito Difícil',
  'Difícil',
  'Neutro',
  'Fácil',
  'Muito fácil'
]

function ArrowLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="m14 6-6 6 6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ArrowRightIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="m10 6 6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function NotesIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M7 4.75h7.75L19.25 9v10.25A2.75 2.75 0 0 1 16.5 22H7.5A2.75 2.75 0 0 1 4.75 19.25v-11.75A2.75 2.75 0 0 1 7.5 4.75Zm7.25.5v4.5h4.5M8 12h8m-8 3.5h6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="m5 12 4.5 4.5L19 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M7 7 17 17M17 7 7 17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function readNotebooks() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(KEY) || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeNotebooks(notebooks) {
  window.localStorage.setItem(KEY, JSON.stringify(notebooks))
}

function resetDireitosHumanosProgressOnce() {
  if (window.localStorage.getItem(DIREITOS_HUMANOS_RESET_KEY) === 'done') return

  try {
    const notebooks = readNotebooks()
    const updated = notebooks.map((item) => {
      if ((item.name || '').trim().toLowerCase() !== 'direitos humanos') return item

      const orderedQuestions = Array.isArray(item.questions)
        ? [...item.questions].sort((left, right) => (left.createdAt ?? left.id ?? 0) - (right.createdAt ?? right.id ?? 0))
        : []

      return {
        ...item,
        updatedAt: Date.now(),
        attempts: [],
        questions: orderedQuestions.map(({ answerHistory, lastAnswerLabel, lastDifficulty, lastReviewedAt, correctCount, wrongCount, ...question }) => ({
          ...question,
          correctCount: 0,
          wrongCount: 0
        }))
      }
    })

    writeNotebooks(updated)

    const sessions = readResumeSessions()
    const targetNotebook = updated.find((item) => (item.name || '').trim().toLowerCase() === 'direitos humanos')
    if (targetNotebook) {
      delete sessions[String(targetNotebook.id)]
      writeResumeSessions(sessions)
    }

    window.localStorage.setItem(DIREITOS_HUMANOS_RESET_KEY, 'done')
  } catch {
    // Ignore malformed local data and leave current state untouched.
  }
}

function readResumeSessions() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(SESSION_KEY) || '{}')
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writeResumeSessions(value) {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(value))
}

function readResumeSession(notebookId) {
  if (!notebookId) return null
  const sessions = readResumeSessions()
  return sessions[String(notebookId)] ?? null
}

function saveResumeSession(notebookId, value) {
  const sessions = readResumeSessions()
  sessions[String(notebookId)] = value
  writeResumeSessions(sessions)
}

function clearResumeSession(notebookId) {
  const sessions = readResumeSessions()
  delete sessions[String(notebookId)]
  writeResumeSessions(sessions)
}

function ensureAnswerHistoryResetOnce() {
  if (window.localStorage.getItem(RESET_KEY) === 'done') return

  const notebooks = readNotebooks()
  const sanitized = notebooks.map((notebook) => ({
    ...notebook,
    questions: (notebook.questions || []).map(({ answerHistory, lastAnswerLabel, ...question }) => question)
  }))

  writeNotebooks(sanitized)
  writeResumeSessions({})
  window.localStorage.setItem(RESET_KEY, 'done')
}

function createEmptyQuestionSession() {
  return {
    alternativeOrder: [],
    selectedAlternative: null,
    cutAlternatives: [],
    submitted: false,
    isCorrect: false,
    difficulty: null
  }
}

function shuffleLabels(labels) {
  const next = [...labels]

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[next[index], next[swapIndex]] = [next[swapIndex], next[index]]
  }

  return next
}

function getQuestionWrongRate(question) {
  const total = (question.correctCount ?? 0) + (question.wrongCount ?? 0)
  if (!total) return -1
  return (question.wrongCount ?? 0) / total
}

function getDifficultyWeight(question) {
  switch (question.lastDifficulty) {
    case 'Muito Difícil':
      return 5
    case 'Difícil':
      return 4
    case 'Neutro':
      return 3
    case 'Fácil':
      return 2
    case 'Muito fácil':
      return 1
    default:
      return 0
  }
}

function sortQuestionsForTraining(questions) {
  return [...questions].sort((left, right) => {
    const difficultyDiff = getDifficultyWeight(right) - getDifficultyWeight(left)
    if (difficultyDiff !== 0) return difficultyDiff

    const wrongRateDiff = getQuestionWrongRate(right) - getQuestionWrongRate(left)
    if (wrongRateDiff !== 0) return wrongRateDiff

    const wrongCountDiff = (right.wrongCount ?? 0) - (left.wrongCount ?? 0)
    if (wrongCountDiff !== 0) return wrongCountDiff

    return (left.createdAt ?? left.id ?? 0) - (right.createdAt ?? right.id ?? 0)
  })
}

function commitTrainingSession(notebookId, sessionState, orderedQuestions) {
  const notebooks = readNotebooks()
  const updatedAt = Date.now()

  const updated = notebooks.map((notebook) => {
    if (notebook.id !== notebookId) return notebook

    const notebookQuestionNumbers = new Map(
      (notebook.questions || []).map((question, index) => [question.id, index + 1])
    )

    const attemptQuestions = orderedQuestions.map((question) => {
      const questionSession = sessionState[question.id] ?? createEmptyQuestionSession()
      const markedIndex = questionSession.selectedAlternative
        ? questionSession.alternativeOrder.indexOf(questionSession.selectedAlternative)
        : -1

      return {
        questionId: question.id,
        number: notebookQuestionNumbers.get(question.id) ?? 0,
        markedAlternative: markedIndex >= 0 ? OPT[markedIndex] : '-',
        selectedAlternativeValue: questionSession.selectedAlternative ?? null,
        isCorrect: Boolean(questionSession.submitted && questionSession.isCorrect),
        answered: Boolean(questionSession.submitted),
        difficulty: questionSession.difficulty ?? null
      }
    })

    const attempt = {
      id: updatedAt,
      number: (notebook.attempts?.length ?? 0) + 1,
      completedAt: updatedAt,
      totalQuestions: orderedQuestions.length,
      correctQuestions: attemptQuestions.filter((item) => item.answered && item.isCorrect).map((item) => item.number),
      wrongQuestions: attemptQuestions.filter((item) => item.answered && !item.isCorrect).map((item) => item.number),
      questions: attemptQuestions
    }

    return {
      ...notebook,
      updatedAt,
      attempts: [...(notebook.attempts ?? []), attempt],
      questions: (notebook.questions || []).map((question) => {
        const questionSession = sessionState[question.id]
        if (!questionSession?.submitted || !questionSession.selectedAlternative) return question

        return {
          ...question,
          correctCount: (question.correctCount ?? 0) + (questionSession.isCorrect ? 1 : 0),
          wrongCount: (question.wrongCount ?? 0) + (questionSession.isCorrect ? 0 : 1),
          answerHistory: {
            ...(question.answerHistory ?? {}),
            [questionSession.selectedAlternative]: (question.answerHistory?.[questionSession.selectedAlternative] ?? 0) + 1
          },
          lastAnswerLabel: questionSession.selectedAlternative,
          lastDifficulty: questionSession.difficulty ?? question.lastDifficulty ?? null,
          lastReviewedAt: updatedAt
        }
      })
    }
  })

  writeNotebooks(updated)
}

function persistQuestionNotes(notebookId, questionId, notes) {
  const notebooks = readNotebooks()
  const updated = notebooks.map((notebook) => {
    if (notebook.id !== notebookId) return notebook

    return {
      ...notebook,
      updatedAt: Date.now(),
      questions: (notebook.questions || []).map((question) =>
        question.id === questionId
          ? {
              ...question,
              notes
            }
          : question
      )
    }
  })

  writeNotebooks(updated)
}

function QuestionTraining({ notebookId, onExit }) {
  const questionChipRefs = useRef({})
  const [notebooks, setNotebooks] = useState(() => readNotebooks())
  const [currentIndex, setCurrentIndex] = useState(0)
  const [sessionState, setSessionState] = useState({})
  const [sessionAnswerHistory, setSessionAnswerHistory] = useState({})
  const [questionOrder, setQuestionOrder] = useState([])
  const [isNotesOpen, setIsNotesOpen] = useState(false)
  const [notesDraft, setNotesDraft] = useState('')
  const [isExitPromptOpen, setIsExitPromptOpen] = useState(false)

  useEffect(() => {
    resetDireitosHumanosProgressOnce()
    ensureAnswerHistoryResetOnce()
    const nextNotebooks = readNotebooks()
    const resume = readResumeSession(notebookId)
    const notebook = nextNotebooks.find((item) => item.id === notebookId)
    const notebookQuestions = notebook?.questions ?? []
    const sortedQuestions = sortQuestionsForTraining(notebookQuestions)
    const sortedIds = sortedQuestions.map((question) => question.id)
    const resumedOrder = Array.isArray(resume?.questionOrder) ? resume.questionOrder : []
    const mergedOrder = resumedOrder.filter((id) => sortedIds.includes(id))
    const missingIds = sortedIds.filter((id) => !mergedOrder.includes(id))
    const nextQuestionOrder = [...mergedOrder, ...missingIds]
    const questionsLength = notebookQuestions.length

    setNotebooks(nextNotebooks)
    setSessionState(resume?.sessionState ?? {})
    setQuestionOrder(nextQuestionOrder)
    setCurrentIndex(Math.min(resume?.currentIndex ?? 0, questionsLength))
    setIsNotesOpen(false)
    setIsExitPromptOpen(false)
    setSessionAnswerHistory({})
  }, [notebookId])

  const notebook = useMemo(
    () => notebooks.find((item) => item.id === notebookId) ?? null,
    [notebooks, notebookId]
  )
  const questions = useMemo(() => {
    const notebookQuestions = notebook?.questions ?? []
    if (!notebookQuestions.length) return []

    const byId = new Map(notebookQuestions.map((question) => [question.id, question]))
    const preferredOrder = questionOrder.length ? questionOrder : sortQuestionsForTraining(notebookQuestions).map((question) => question.id)
    const ordered = preferredOrder.map((id) => byId.get(id)).filter(Boolean)
    const missing = notebookQuestions.filter((question) => !preferredOrder.includes(question.id))
    return [...ordered, ...missing]
  }, [notebook, questionOrder])
  const currentQuestion = questions[currentIndex] ?? null
  const currentSession = currentQuestion ? sessionState[currentQuestion.id] ?? createEmptyQuestionSession() : null
  const selectedAlternative = currentSession?.selectedAlternative ?? null
  const cutAlternatives = currentSession?.cutAlternatives ?? []
  const submitted = currentSession?.submitted ?? false
  const isCorrect = currentSession?.isCorrect ?? false
  const requiresDifficulty = submitted && !currentSession?.difficulty
  const allQuestionsSubmitted = questions.length > 0 && questions.every((question) => sessionState[question.id]?.submitted)
  const isSummaryView = questions.length > 0 && currentIndex === questions.length
  const hasSessionProgress = Object.values(sessionState).some((entry) => entry?.selectedAlternative || entry?.submitted)

  useEffect(() => {
    if (!currentQuestion) return
    if (currentSession?.alternativeOrder?.length) return

    const labels = (currentQuestion.alternatives || []).map((alternative) => alternative.label)

    setSessionState((previous) => ({
      ...previous,
      [currentQuestion.id]: {
        ...createEmptyQuestionSession(),
        ...(previous[currentQuestion.id] ?? {}),
        alternativeOrder: shuffleLabels(labels)
      }
    }))
  }, [currentQuestion, currentSession?.alternativeOrder])

  const displayAlternatives = useMemo(() => {
    if (!currentQuestion) return []

    const alternativesByLabel = Object.fromEntries(currentQuestion.alternatives.map((alternative) => [alternative.label, alternative]))
    const order = currentSession?.alternativeOrder?.length
      ? currentSession.alternativeOrder
      : currentQuestion.alternatives.map((alternative) => alternative.label)

    return order
      .map((label, index) => {
        const alternative = alternativesByLabel[label]
        if (!alternative) return null
        return {
          ...alternative,
          displayLabel: OPT[index]
        }
      })
      .filter(Boolean)
  }, [currentQuestion, currentSession?.alternativeOrder])

  const correctDisplayedAlternative = useMemo(
    () => displayAlternatives.find((alternative) => alternative.label === currentQuestion?.correctAlternative) ?? null,
    [displayAlternatives, currentQuestion?.correctAlternative]
  )

  const totalAnswers = useMemo(
    () => {
      const persisted = currentQuestion?.answerHistory ?? {}
      const runtime = currentQuestion ? sessionAnswerHistory[currentQuestion.id] ?? {} : {}
      return OPT.reduce((sum, label) => sum + (persisted[label] ?? 0) + (runtime[label] ?? 0), 0)
    },
    [currentQuestion, sessionAnswerHistory]
  )

  const summaryStats = useMemo(() => {
    const answered = questions.filter((question) => sessionState[question.id]?.submitted)
    const correct = answered.filter((question) => sessionState[question.id]?.isCorrect).length
    const wrong = answered.length - correct
    const accuracy = answered.length ? Math.round((correct / answered.length) * 100) : 0

    return {
      total: questions.length,
      answered: answered.length,
      correct,
      wrong,
      accuracy
    }
  }, [questions, sessionState])

  useEffect(() => {
    setNotesDraft(currentQuestion?.notes ?? '')
    setIsNotesOpen(false)
  }, [currentQuestion?.id])

  useEffect(() => {
    const currentQuestionId = currentQuestion?.id
    if (!currentQuestionId) return

    const chip = questionChipRefs.current[currentQuestionId]
    if (!chip) return

    chip.scrollIntoView({
      behavior: 'smooth',
      inline: 'center',
      block: 'nearest'
    })
  }, [currentQuestion?.id, currentIndex])

  function refreshNotebooks() {
    setNotebooks(readNotebooks())
  }

  function updateQuestionSession(questionId, updater) {
    setSessionState((previous) => {
      const current = previous[questionId] ?? createEmptyQuestionSession()
      return {
        ...previous,
        [questionId]: updater(current)
      }
    })
  }

  function handleSelectAlternative(label) {
    if (!currentQuestion || submitted) return

    updateQuestionSession(currentQuestion.id, (previous) => ({
      ...previous,
      selectedAlternative: label,
      cutAlternatives: previous.cutAlternatives.filter((item) => item !== label)
    }))
  }

  function toggleCutAlternative(event, label) {
    event.stopPropagation()
    if (!currentQuestion || submitted) return

    updateQuestionSession(currentQuestion.id, (previous) => ({
      ...previous,
      selectedAlternative: previous.selectedAlternative === label ? null : previous.selectedAlternative,
      cutAlternatives: previous.cutAlternatives.includes(label)
        ? previous.cutAlternatives.filter((item) => item !== label)
        : [...previous.cutAlternatives, label]
    }))
  }

  function handleSubmit() {
    if (!currentQuestion || !selectedAlternative || submitted) return

    setSessionAnswerHistory((previous) => ({
      ...previous,
      [currentQuestion.id]: {
        ...(previous[currentQuestion.id] ?? {}),
        [selectedAlternative]: ((previous[currentQuestion.id] ?? {})[selectedAlternative] ?? 0) + 1
      }
    }))

    updateQuestionSession(currentQuestion.id, (previous) => ({
      ...previous,
      submitted: true,
      isCorrect: selectedAlternative === currentQuestion.correctAlternative,
      cutAlternatives: []
    }))
  }

  function handleDifficultyChoice(difficulty) {
    if (!currentQuestion || !submitted) return
    const nextSessionState = {
      ...sessionState,
      [currentQuestion.id]: {
        ...currentSession,
        difficulty
      }
    }

    updateQuestionSession(currentQuestion.id, (previous) => ({
      ...previous,
      difficulty
    }))

    const isLastQuestion = currentIndex === questions.length - 1
    const hasAnsweredQuestionAhead = questions
      .slice(currentIndex + 1)
      .some((question) => nextSessionState[question.id]?.submitted)

    if (isLastQuestion || hasAnsweredQuestionAhead) {
      const nextUnansweredIndex = questions.findIndex((question, index) =>
        index > currentIndex && !nextSessionState[question.id]?.submitted
      )

      if (nextUnansweredIndex !== -1) {
        setCurrentIndex(nextUnansweredIndex)
      } else {
        const firstUnansweredIndex = questions.findIndex((question) => !nextSessionState[question.id]?.submitted)
        setCurrentIndex(firstUnansweredIndex === -1 ? questions.length : firstUnansweredIndex)
      }
    } else {
      setCurrentIndex((prev) => prev + 1)
    }

    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleSaveNotes() {
    if (!currentQuestion) return
    persistQuestionNotes(notebook.id, currentQuestion.id, notesDraft.trim())
    refreshNotebooks()
    setIsNotesOpen(false)
  }

  function handleGoToQuestion(index) {
    if (requiresDifficulty && index !== currentIndex) return
    const boundedIndex = Math.max(0, Math.min(index, questions.length))
    setCurrentIndex(boundedIndex)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleAttemptExit() {
    if (!hasSessionProgress) {
      onExit()
      return
    }

    setIsExitPromptOpen(true)
  }

  function handleDiscardAndExit() {
    clearResumeSession(notebookId)
    setIsExitPromptOpen(false)
    onExit()
  }

  function handleSaveForLater() {
    saveResumeSession(notebookId, { currentIndex, sessionState, questionOrder })
    setIsExitPromptOpen(false)
    onExit()
  }

  function handleCommitAndExit() {
    commitTrainingSession(notebook.id, sessionState, questions)
    clearResumeSession(notebook.id)
    refreshNotebooks()
    setIsExitPromptOpen(false)
    onExit()
  }

  return (
    <section className={`question-training-shell${submitted ? (isCorrect ? ' is-success' : ' is-error') : ''}`}>
      <div className="question-training-topbar">
        <button type="button" className="question-training-exit" onClick={handleAttemptExit}>
          <span className="question-training-exit-icon">
            <ArrowLeftIcon />
          </span>
          Sair do treino
        </button>

        {notebook ? (
          <div className="question-training-context-card">
            <button
              type="button"
              className="question-training-nav-button"
              onClick={() => handleGoToQuestion(currentIndex - 1)}
              disabled={currentIndex === 0 || requiresDifficulty}
            >
              <span className="question-training-nav-icon">
                <ArrowLeftIcon />
              </span>
              Anterior
            </button>

            <div className="question-training-index-list" aria-label={`Navegacao das questoes do caderno ${notebook.name}`}>
              {questions.map((question, index) => {
                const questionSession = sessionState[question.id]
                const statusClass = `${questionSession?.submitted
                  ? questionSession.isCorrect ? ' is-correct' : ' is-wrong'
                  : ' is-pending'}${index === currentIndex ? ' is-current' : ''}`

                return (
                  <button
                    key={question.id}
                    type="button"
                    className={`question-training-index-chip${statusClass}`}
                    onClick={() => handleGoToQuestion(index)}
                    aria-label={`Ir para a questao ${index + 1}`}
                    disabled={requiresDifficulty && index !== currentIndex}
                    ref={(element) => {
                      if (element) questionChipRefs.current[question.id] = element
                      else delete questionChipRefs.current[question.id]
                    }}
                  >
                    {index + 1}
                  </button>
                )
              })}

              <button
                type="button"
                className={`question-training-index-chip question-training-index-chip-gabarito${isSummaryView ? ' is-current' : ' is-pending'}`}
                onClick={() => handleGoToQuestion(questions.length)}
                disabled={requiresDifficulty}
                aria-label="Abrir gabarito"
              >
                G
              </button>
            </div>

            <button
              type="button"
              className="question-training-nav-button"
              onClick={() => handleGoToQuestion(currentIndex + 1)}
              disabled={currentIndex >= questions.length || requiresDifficulty}
            >
              Proxima
              <span className="question-training-nav-icon">
                <ArrowRightIcon />
              </span>
            </button>
          </div>
        ) : null}
      </div>

      {!notebook || questions.length === 0 ? (
        <div className="question-training-empty">
          <strong>Nenhuma questão disponível para treino.</strong>
          <p>Adicione questões a este caderno antes de iniciar a sessão.</p>
        </div>
      ) : null}

      {isSummaryView ? (
        <div className="question-training-stage">
          <article className="question-training-card question-training-summary-card">
            <header className="question-training-summary-header">
              <div>
                <h2 className="question-training-summary-title">Gabarito</h2>
                <p className="question-training-summary-helper">Clique em qualquer questão para revisar sua resposta antes de salvar.</p>
              </div>
              <button type="button" className="question-training-summary-close" onClick={handleCommitAndExit}>
                Fechar aba e salvar
              </button>
            </header>

            <div className="question-training-summary-stats">
              <div className="question-training-summary-stat">
                <span>Total</span>
                <strong>{summaryStats.total}</strong>
              </div>
              <div className="question-training-summary-stat">
                <span>Acertos</span>
                <strong>{summaryStats.correct}</strong>
              </div>
              <div className="question-training-summary-stat">
                <span>Erros</span>
                <strong>{summaryStats.wrong}</strong>
              </div>
              <div className="question-training-summary-stat">
                <span>Aproveitamento</span>
                <strong>{summaryStats.accuracy}%</strong>
              </div>
            </div>

            <div className="question-training-summary-list">
              {questions.map((question, index) => {
                const questionSession = sessionState[question.id] ?? createEmptyQuestionSession()
                const isAnswered = Boolean(questionSession.submitted)
                const markedDisplayLabel = questionSession.selectedAlternative
                  ? OPT[Math.max(0, questionSession.alternativeOrder.indexOf(questionSession.selectedAlternative))]
                  : '-'

                return (
                  <button
                    key={question.id}
                    type="button"
                    className={`question-training-summary-item${isAnswered ? (questionSession.isCorrect ? ' is-correct' : ' is-wrong') : ' is-neutral'}`}
                    onClick={() => handleGoToQuestion(index)}
                  >
                    <span className="question-training-summary-item-number">{index + 1}</span>
                    <span className="question-training-summary-item-answer">
                      {isAnswered ? `Marcada: ${markedDisplayLabel}` : 'Não respondida'}
                    </span>
                    <span className="question-training-summary-item-status">
                      <span className="question-training-summary-item-icon">
                        {isAnswered ? (questionSession.isCorrect ? <CheckIcon /> : <XIcon />) : null}
                      </span>
                      {isAnswered ? (questionSession.isCorrect ? 'Acertou' : 'Errou') : 'Neutra'}
                    </span>
                    <span className="question-training-summary-item-difficulty">
                      {isAnswered ? `Dificuldade: ${questionSession.difficulty ?? '-'}` : 'Dificuldade: -'}
                    </span>
                  </button>
                )
              })}
            </div>
          </article>
        </div>
      ) : null}

      {currentQuestion && !isSummaryView ? (
        <div className="question-training-stage">
          <article className="question-training-card">
            <header className="question-training-card-header">
              <div className="question-training-meta">
                <span className="question-training-pill">{currentQuestion.bank}</span>
                <span className="question-training-pill">{currentQuestion.year}</span>
              </div>
              <span className="question-training-progress">
                Questão {currentIndex + 1} de {questions.length}
              </span>
            </header>

            <div className="question-training-statement-block">
              <span className="question-training-number">Questão {currentIndex + 1}</span>
              <h1 className="question-training-statement">{currentQuestion.statement}</h1>
              {currentQuestion.supportText ? <p className="question-training-support">{currentQuestion.supportText}</p> : null}
            </div>

            <div className="question-training-alternatives">
              {displayAlternatives.map((alternative) => {
                const isSelected = selectedAlternative === alternative.label
                const isRight = submitted && alternative.label === currentQuestion.correctAlternative
                const isWrongSelection = submitted && isSelected && alternative.label !== currentQuestion.correctAlternative
                const isCut = cutAlternatives.includes(alternative.label)
                const answerCount = (currentQuestion.answerHistory?.[alternative.label] ?? 0) + ((sessionAnswerHistory[currentQuestion.id] ?? {})[alternative.label] ?? 0)
                const answerPercentage = totalAnswers > 0 ? Math.round((answerCount / totalAnswers) * 100) : 0

                return (
                  <button
                    key={alternative.label}
                    type="button"
                    className={`question-training-alternative${isSelected ? ' is-selected' : ''}${isRight ? ' is-right' : ''}${isWrongSelection ? ' is-wrong' : ''}${isCut ? ' is-cut' : ''}`}
                    onClick={() => handleSelectAlternative(alternative.label)}
                  >
                    {!submitted ? (
                      <span className="question-training-cut-action-wrapper">
                        <button
                          type="button"
                          className={`question-training-cut-action${isCut ? ' is-active' : ''}`}
                          onClick={(event) => toggleCutAlternative(event, alternative.label)}
                          aria-label={isCut ? `Restaurar alternativa ${alternative.displayLabel}` : `Cortar alternativa ${alternative.displayLabel}`}
                        >
                          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                            <path
                              d="M6.25 7.25a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5Zm0 0L18.5 19.5m-12.25-2.75a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5ZM10.5 14.5l8-8"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.9"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                      </span>
                    ) : null}
                    <span className="question-training-alternative-label">{alternative.displayLabel}</span>
                    <span className="question-training-alternative-text">{alternative.text}</span>
                    {submitted ? <span className="question-training-alternative-stats">{answerPercentage}%</span> : null}
                  </button>
                )
              })}
            </div>

            <div className="question-training-actions">
              <button type="button" className="question-training-notes-trigger" onClick={() => setIsNotesOpen(true)}>
                <span className="question-training-notes-trigger-icon">
                  <NotesIcon />
                </span>
                Notas da questão
              </button>
              <button
                type="button"
                className="question-training-submit"
                disabled={!selectedAlternative || submitted}
                onClick={handleSubmit}
              >
                Enviar resposta
              </button>
            </div>

            {submitted ? (
              <div className="question-training-feedback">
                <p className="question-training-feedback-text">
                  {isCorrect ? 'Resposta correta.' : `Resposta incorreta. Alternativa correta: ${correctDisplayedAlternative?.displayLabel ?? '-'}.`}
                </p>

                <div className="question-training-difficulty-row">
                  {DIFFICULTIES.map((difficulty) => (
                    <button
                      key={difficulty}
                      type="button"
                      className={`question-training-difficulty${currentSession?.difficulty === difficulty ? ' is-active' : ''}`}
                      onClick={() => handleDifficultyChoice(difficulty)}
                    >
                      {difficulty}
                    </button>
                  ))}
                </div>

                {currentQuestion.notes ? (
                  <div className="question-training-notes-preview">
                    <strong>Notas da questão</strong>
                    <p>{currentQuestion.notes}</p>
                  </div>
                ) : null}
              </div>
            ) : null}
          </article>
        </div>
      ) : null}

      {isNotesOpen && currentQuestion ? (
        <div className="plan-modal-overlay" onClick={() => setIsNotesOpen(false)}>
          <div
            className="plan-modal question-training-notes-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="question-training-notes-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="important-date-modal-header">
              <div>
                <h2 id="question-training-notes-title" className="plan-modal-title">Notas da questão</h2>
                <p className="flashcards-helper">Registre observações, pegadinhas ou lembretes para revisar depois.</p>
              </div>
              <button type="button" className="modal-close-button" onClick={() => setIsNotesOpen(false)} aria-label="Fechar notas da questão">
                ×
              </button>
            </div>

            <div className="plan-field-group">
              <label className="plan-field-label" htmlFor="question-training-notes-input">Notas</label>
              <textarea
                id="question-training-notes-input"
                className="subject-input question-training-notes-input"
                value={notesDraft}
                onChange={(event) => setNotesDraft(event.target.value)}
                placeholder="Ex: atenção ao fundamento legal, exceção da regra, detalhe cobrado pela banca."
              />
            </div>

            <div className="flashcards-actions overlay-question-actions">
              <button type="button" className="subject-add-button" onClick={handleSaveNotes}>Salvar notas</button>
              <button type="button" className="header-button header-button-secondary" onClick={() => setIsNotesOpen(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      ) : null}

      {isExitPromptOpen ? (
        <div className="plan-modal-overlay" onClick={() => setIsExitPromptOpen(false)}>
          <div
            className="plan-modal question-training-exit-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="question-training-exit-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="important-date-modal-header">
              <div>
                <h2 id="question-training-exit-title" className="plan-modal-title">Suas marcações ainda não estão salvas</h2>
                <p className="flashcards-helper">
                  {allQuestionsSubmitted
                    ? 'Se sair agora, finalize salvando o resumo ou descarte esta sessão.'
                    : 'Voce pode salvar o progresso para continuar depois ou sair e recomecar do zero.'}
                </p>
              </div>
              <button type="button" className="modal-close-button" onClick={() => setIsExitPromptOpen(false)} aria-label="Fechar aviso de saída">
                ×
              </button>
            </div>

            <div className="question-training-exit-actions">
              <button
                type="button"
                className="subject-add-button"
                onClick={allQuestionsSubmitted ? handleCommitAndExit : handleSaveForLater}
              >
                {allQuestionsSubmitted ? 'Salvar e sair' : 'Salvar progresso'}
              </button>
              <button type="button" className="header-button header-button-secondary" onClick={handleDiscardAndExit}>
                Comecar do 0
              </button>
              <button type="button" className="plan-action-btn" onClick={() => setIsExitPromptOpen(false)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}

export default QuestionTraining
