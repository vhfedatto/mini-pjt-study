import { useEffect, useMemo, useState } from 'react'

const KEY = 'question-notebooks'
const OPT = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

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
      <path
        d="m14 6-6 6 6 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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

function getNotebookBannerClass(color) {
  return color ? `notebook-detail-banner--${color}` : ''
}

function readNotebooks() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(KEY) || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeQuestionUpdate(notebookId, questionId, updater) {
  const notebooks = readNotebooks()
  const updated = notebooks.map((notebook) => {
    if (notebook.id !== notebookId) return notebook

    return {
      ...notebook,
      updatedAt: Date.now(),
      questions: (notebook.questions || []).map((question) =>
        question.id === questionId ? updater(question) : question
      )
    }
  })

  window.localStorage.setItem(KEY, JSON.stringify(updated))
}

function persistQuestionResult(notebookId, questionId, isCorrect, difficulty) {
  writeQuestionUpdate(notebookId, questionId, (question) => ({
    ...question,
    correctCount: (question.correctCount ?? 0) + (isCorrect ? 1 : 0),
    wrongCount: (question.wrongCount ?? 0) + (isCorrect ? 0 : 1),
    lastDifficulty: difficulty,
    lastReviewedAt: Date.now()
  }))
}

function persistQuestionAnswer(notebookId, questionId, selectedLabel) {
  writeQuestionUpdate(notebookId, questionId, (question) => ({
    ...question,
    answerHistory: {
      ...(question.answerHistory ?? {}),
      [selectedLabel]: (question.answerHistory?.[selectedLabel] ?? 0) + 1
    },
    lastAnswerLabel: selectedLabel
  }))
}

function persistQuestionNotes(notebookId, questionId, notes) {
  writeQuestionUpdate(notebookId, questionId, (question) => ({
    ...question,
    notes
  }))
}

function shuffleAlternatives(alternatives) {
  const next = [...alternatives]

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[next[index], next[swapIndex]] = [next[swapIndex], next[index]]
  }

  return next.map((alternative, index) => ({
    ...alternative,
    displayLabel: OPT[index]
  }))
}

function QuestionTraining({ notebookId, onExit }) {
  const [notebooks, setNotebooks] = useState(() => readNotebooks())
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAlternative, setSelectedAlternative] = useState(null)
  const [cutAlternatives, setCutAlternatives] = useState([])
  const [submitted, setSubmitted] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [isNotesOpen, setIsNotesOpen] = useState(false)
  const [notesDraft, setNotesDraft] = useState('')

  useEffect(() => {
    setNotebooks(readNotebooks())
  }, [notebookId])

  const notebook = useMemo(
    () => notebooks.find((item) => item.id === notebookId) ?? null,
    [notebooks, notebookId]
  )
  const questions = notebook?.questions ?? []
  const currentQuestion = questions[currentIndex] ?? null
  const isFinished = questions.length > 0 && currentIndex >= questions.length

  const displayAlternatives = useMemo(
    () => (currentQuestion ? shuffleAlternatives(currentQuestion.alternatives) : []),
    [currentQuestion?.id]
  )

  const correctDisplayedAlternative = useMemo(
    () => displayAlternatives.find((alternative) => alternative.label === currentQuestion?.correctAlternative) ?? null,
    [displayAlternatives, currentQuestion?.correctAlternative]
  )

  const totalAnswers = useMemo(
    () => Object.values(currentQuestion?.answerHistory ?? {}).reduce((sum, value) => sum + value, 0),
    [currentQuestion?.answerHistory]
  )

  useEffect(() => {
    setNotesDraft(currentQuestion?.notes ?? '')
    setIsNotesOpen(false)
  }, [currentQuestion?.id])

  function refreshNotebooks() {
    setNotebooks(readNotebooks())
  }

  function handleSelectAlternative(label) {
    if (submitted) return
    setCutAlternatives((previous) => previous.filter((item) => item !== label))
    setSelectedAlternative(label)
  }

  function toggleCutAlternative(event, label) {
    event.stopPropagation()
    if (submitted) return
    if (selectedAlternative === label) return

    setCutAlternatives((previous) =>
      previous.includes(label)
        ? previous.filter((item) => item !== label)
        : [...previous, label]
    )
  }

  function handleSubmit() {
    if (!currentQuestion || !selectedAlternative || submitted) return

    persistQuestionAnswer(notebook.id, currentQuestion.id, selectedAlternative)
    const nextIsCorrect = selectedAlternative === currentQuestion.correctAlternative

    setCutAlternatives([])
    setIsCorrect(nextIsCorrect)
    setSubmitted(true)
    refreshNotebooks()
  }

  function handleDifficultyChoice(difficulty) {
    if (!currentQuestion) return

    persistQuestionResult(notebook.id, currentQuestion.id, isCorrect, difficulty)
    refreshNotebooks()
    setCurrentIndex((prev) => prev + 1)
    setSelectedAlternative(null)
    setCutAlternatives([])
    setSubmitted(false)
    setIsCorrect(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleSaveNotes() {
    if (!currentQuestion) return
    persistQuestionNotes(notebook.id, currentQuestion.id, notesDraft.trim())
    refreshNotebooks()
    setIsNotesOpen(false)
  }

  return (
    <section className={`question-training-shell${submitted ? (isCorrect ? ' is-success' : ' is-error') : ''}`}>
      <div className="question-training-topbar">
        <button type="button" className="question-training-exit" onClick={onExit}>
          <span className="question-training-exit-icon">
            <ArrowLeftIcon />
          </span>
          Sair do treino
        </button>
        {notebook ? (
          <div className="question-training-context-card">
            <div className={`question-training-context-banner ${getNotebookBannerClass(notebook.color)}`} aria-hidden="true" />
            <p>Você está resolvendo questões de: <b>{notebook.name}</b></p>
          </div>
        ) : null}
      </div>

      {!notebook || questions.length === 0 ? (
        <div className="question-training-empty">
          <strong>Nenhuma questão disponível para treino.</strong>
          <p>Adicione questões a este caderno antes de iniciar a sessão.</p>
        </div>
      ) : null}

      {isFinished ? (
        <div className="question-training-empty question-training-finish">
          <span className="question-training-finish-badge">Treino concluído</span>
          <strong>Você respondeu todas as questões deste caderno.</strong>
          <p>Saia do treino para voltar à aba das questões e iniciar uma nova rodada quando quiser.</p>
        </div>
      ) : null}

      {currentQuestion && !isFinished ? (
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
              {currentQuestion.supportText ? (
                <p className="question-training-support">{currentQuestion.supportText}</p>
              ) : null}
            </div>

            <div className="question-training-alternatives">
              {displayAlternatives.map((alternative) => {
                const isSelected = selectedAlternative === alternative.label
                const isRight = submitted && alternative.label === currentQuestion.correctAlternative
                const isWrongSelection = submitted && isSelected && alternative.label !== currentQuestion.correctAlternative
                const isCut = cutAlternatives.includes(alternative.label)
                const answerCount = currentQuestion.answerHistory?.[alternative.label] ?? 0
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
                          disabled={selectedAlternative === alternative.label}
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
                    {submitted ? (
                      <span className="question-training-alternative-stats">{answerPercentage}%</span>
                    ) : null}
                  </button>
                )
              })}
            </div>

            <div className="question-training-actions">
              <button
                type="button"
                className="question-training-notes-trigger"
                onClick={() => setIsNotesOpen(true)}
              >
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
                      className="question-training-difficulty"
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
              <button
                type="button"
                className="modal-close-button"
                onClick={() => setIsNotesOpen(false)}
                aria-label="Fechar notas da questão"
              >
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
              <button type="button" className="subject-add-button" onClick={handleSaveNotes}>
                Salvar notas
              </button>
              <button type="button" className="header-button header-button-secondary" onClick={() => setIsNotesOpen(false)}>
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
