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

function readNotebooks() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(KEY) || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function persistQuestionResult(notebookId, questionId, isCorrect, difficulty) {
  const notebooks = readNotebooks()
  const updated = notebooks.map((notebook) => {
    if (notebook.id !== notebookId) return notebook

    return {
      ...notebook,
      updatedAt: Date.now(),
      questions: (notebook.questions || []).map((question) => {
        if (question.id !== questionId) return question

        return {
          ...question,
          correctCount: (question.correctCount ?? 0) + (isCorrect ? 1 : 0),
          wrongCount: (question.wrongCount ?? 0) + (isCorrect ? 0 : 1),
          lastDifficulty: difficulty,
          lastReviewedAt: Date.now()
        }
      })
    }
  })

  window.localStorage.setItem(KEY, JSON.stringify(updated))
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

  function handleSelectAlternative(label) {
    if (submitted) return
    setSelectedAlternative(label)
  }

  function toggleCutAlternative(event, label) {
    event.stopPropagation()
    if (submitted) return

    setCutAlternatives((previous) =>
      previous.includes(label)
        ? previous.filter((item) => item !== label)
        : [...previous, label]
    )
  }

  function handleSubmit() {
    if (!currentQuestion || !selectedAlternative || submitted) return
    const nextIsCorrect = selectedAlternative === currentQuestion.correctAlternative
    setIsCorrect(nextIsCorrect)
    setSubmitted(true)
  }

  function handleDifficultyChoice(difficulty) {
    if (!currentQuestion) return

    persistQuestionResult(notebook.id, currentQuestion.id, isCorrect, difficulty)
    setNotebooks(readNotebooks())
    setCurrentIndex((prev) => prev + 1)
    setSelectedAlternative(null)
    setCutAlternatives([])
    setSubmitted(false)
    setIsCorrect(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
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
                              d="M4.5 6.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Zm0 0L19 19m-14.5-1.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5ZM9 15l10-10"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                      </span>
                    ) : null}
                    <span className="question-training-alternative-label">{alternative.displayLabel}</span>
                    <span className="question-training-alternative-text">{alternative.text}</span>
                  </button>
                )
              })}
            </div>

            <div className="question-training-actions">
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
              </div>
            ) : null}
          </article>
        </div>
      ) : null}
    </section>
  )
}

export default QuestionTraining
