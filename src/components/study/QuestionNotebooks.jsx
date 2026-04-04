import { useEffect, useMemo, useState } from 'react'
import SummaryCard from '../ui/SummaryCard'
import Card from '../ui/Card'

const NOTEBOOKS_STORAGE_KEY = 'question-notebooks'
const OPTION_LABELS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

function safeParse(storageKey) {
  const stored = localStorage.getItem(storageKey)
  if (!stored) return []

  try {
    const parsed = JSON.parse(stored)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function formatNotebookUpdatedAt(value) {
  if (!value) return 'Ainda sem atividade'

  try {
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short'
    }).format(new Date(value))
  } catch {
    return 'Data inválida'
  }
}

function truncateText(text, length = 150) {
  const normalized = text.replaceAll(/\s+/g, ' ').trim()
  if (normalized.length <= length) return normalized
  return `${normalized.slice(0, length - 3)}...`
}

function buildEmptyQuestionForm() {
  return {
    bank: '',
    year: '',
    statement: '',
    supportText: '',
    alternatives: ['', '', '', ''],
    correctAlternative: 'A'
  }
}

function QuestionNotebooks() {
  const [notebooks, setNotebooks] = useState(() => safeParse(NOTEBOOKS_STORAGE_KEY))
  const [selectedNotebookId, setSelectedNotebookId] = useState(null)
  const [view, setView] = useState('library')
  const [newNotebookName, setNewNotebookName] = useState('')
  const [newNotebookDescription, setNewNotebookDescription] = useState('')
  const [isQuestionFormOpen, setIsQuestionFormOpen] = useState(false)
  const [questionForm, setQuestionForm] = useState(() => buildEmptyQuestionForm())

  useEffect(() => {
    localStorage.setItem(NOTEBOOKS_STORAGE_KEY, JSON.stringify(notebooks))
  }, [notebooks])

  const selectedNotebook = useMemo(
    () => notebooks.find((notebook) => notebook.id === selectedNotebookId) ?? null,
    [notebooks, selectedNotebookId]
  )

  const totalQuestions = useMemo(
    () => notebooks.reduce((total, notebook) => total + notebook.questions.length, 0),
    [notebooks]
  )

  const notebooksWithQuestions = useMemo(
    () => notebooks.filter((notebook) => notebook.questions.length > 0).length,
    [notebooks]
  )

  function handleCreateNotebook(event) {
    event.preventDefault()

    const trimmedName = newNotebookName.trim()
    const trimmedDescription = newNotebookDescription.trim()

    if (!trimmedName) {
      alert('Informe um nome para o caderno.')
      return
    }

    const timestamp = Date.now()
    const newNotebook = {
      id: timestamp,
      name: trimmedName,
      description: trimmedDescription,
      createdAt: timestamp,
      updatedAt: timestamp,
      questions: []
    }

    setNotebooks((previous) => [newNotebook, ...previous])
    setSelectedNotebookId(newNotebook.id)
    setView('detail')
    setNewNotebookName('')
    setNewNotebookDescription('')
  }

  function handleAddAlternative() {
    setQuestionForm((previous) => ({
      ...previous,
      alternatives: [...previous.alternatives, '']
    }))
  }

  function handleRemoveAlternative(indexToRemove) {
    setQuestionForm((previous) => {
      if (previous.alternatives.length <= 2) return previous

      const nextAlternatives = previous.alternatives.filter((_, index) => index !== indexToRemove)
      const nextCorrectIndex = Math.min(
        OPTION_LABELS.indexOf(previous.correctAlternative),
        nextAlternatives.length - 1
      )

      return {
        ...previous,
        alternatives: nextAlternatives,
        correctAlternative: OPTION_LABELS[Math.max(nextCorrectIndex, 0)]
      }
    })
  }

  function handleAlternativeChange(indexToUpdate, value) {
    setQuestionForm((previous) => ({
      ...previous,
      alternatives: previous.alternatives.map((alternative, index) =>
        index === indexToUpdate ? value : alternative
      )
    }))
  }

  function resetQuestionForm() {
    setQuestionForm(buildEmptyQuestionForm())
    setIsQuestionFormOpen(false)
  }

  function goToLibrary() {
    setView('library')
    setSelectedNotebookId(null)
    resetQuestionForm()
  }

  function openNotebookDetail(notebookId) {
    setSelectedNotebookId(notebookId)
    setView('detail')
    setIsQuestionFormOpen(false)
  }

  function handleAddQuestion(event) {
    event.preventDefault()
    if (!selectedNotebook) return

    const normalizedStatement = questionForm.statement.trim()
    const normalizedAlternatives = questionForm.alternatives.map((item) => item.trim()).filter(Boolean)

    if (!questionForm.bank.trim() || !questionForm.year.trim()) {
      alert('Informe banca e ano da questão.')
      return
    }

    if (!normalizedStatement) {
      alert('Escreva o enunciado da questão.')
      return
    }

    if (normalizedAlternatives.length < 2) {
      alert('Adicione pelo menos duas alternativas preenchidas.')
      return
    }

    const correctIndex = OPTION_LABELS.indexOf(questionForm.correctAlternative)
    if (correctIndex >= normalizedAlternatives.length) {
      alert('Escolha uma alternativa correta válida.')
      return
    }

    const timestamp = Date.now()
    const newQuestion = {
      id: timestamp,
      bank: questionForm.bank.trim(),
      year: questionForm.year.trim(),
      statement: normalizedStatement,
      supportText: questionForm.supportText.trim(),
      correctAlternative: questionForm.correctAlternative,
      alternatives: normalizedAlternatives.map((text, index) => ({
        label: OPTION_LABELS[index],
        text
      })),
      createdAt: timestamp
    }

    setNotebooks((previous) =>
      previous.map((notebook) =>
        notebook.id === selectedNotebook.id
          ? {
              ...notebook,
              updatedAt: timestamp,
              questions: [newQuestion, ...notebook.questions]
            }
          : notebook
      )
    )

    resetQuestionForm()
  }

  return (
    <>
      <section className="summary-grid">
        <SummaryCard
          title="Cadernos"
          value={notebooks.length}
          description="Coleções para organizar suas questões"
        />
        <SummaryCard
          title="Questões salvas"
          value={totalQuestions}
          description="Itens prontos para treino futuro"
        />
        <SummaryCard
          title="Cadernos ativos"
          value={notebooksWithQuestions}
          description="Cadernos que já possuem questões"
        />
        <SummaryCard
          title="Próximo passo"
          value={selectedNotebook ? 'Treinar' : 'Criar'}
          description={selectedNotebook ? 'Botão de treino já disponível no caderno' : 'Abra um caderno para montar sua base'}
          variant="alert"
        />
      </section>

      {view === 'library' ? (
        <section className="notebooks-library-layout">
          <Card>
            <section className="panel-section">
              <div className="notebooks-library-header">
                <div>
                  <h2 className="section-title">Estante de cadernos</h2>
                  <p className="flashcards-helper">
                    Cada caderno abre uma área própria, mais limpa e focada, para você gerenciar as questões.
                  </p>
                </div>
                <button
                  type="button"
                  className="subject-add-button"
                  onClick={() => setView('create')}
                >
                  Novo caderno
                </button>
              </div>

              <div className="notebooks-shelf">
                {notebooks.map((notebook, index) => (
                  <button
                    key={notebook.id}
                    type="button"
                    className={`notebook-book notebook-book--tone-${index % 4}`}
                    onClick={() => openNotebookDetail(notebook.id)}
                  >
                    <span className="notebook-book-spine" aria-hidden="true" />
                    <span className="notebook-book-topline">Caderno</span>
                    <strong>{notebook.name}</strong>
                    <p>{notebook.description || 'Organize aqui suas questões por tema, banca ou edital.'}</p>
                    <div className="notebook-book-meta">
                      <span>{notebook.questions.length} questão(ões)</span>
                      <span>{formatNotebookUpdatedAt(notebook.updatedAt)}</span>
                    </div>
                  </button>
                ))}

                <button
                  type="button"
                  className="notebook-book notebook-book-add"
                  onClick={() => setView('create')}
                >
                  <span className="notebook-book-plus" aria-hidden="true">
                    <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
                      <path
                        d="M12 5v14M5 12h14"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <strong>Novo caderno</strong>
                  <p>Crie outro volume para separar conteúdos, bancas ou frentes de estudo.</p>
                </button>
              </div>

              {notebooks.length === 0 ? (
                <p className="empty-message">
                  Sua estante ainda está vazia. Use o caderno com `+` para criar o primeiro.
                </p>
              ) : null}
            </section>
          </Card>
        </section>
      ) : null}

      {view === 'create' ? (
        <section className="notebook-page-layout">
          <Card>
            <section className="panel-section">
              <div className="notebook-page-header">
                <div>
                  <button
                    type="button"
                    className="notebook-back-button"
                    onClick={goToLibrary}
                  >
                    Voltar para a estante
                  </button>
                  <h2 className="section-title">Criar novo caderno</h2>
                </div>
              </div>

              <p className="flashcards-helper">
                Dê um nome claro para o volume e deixe a descrição pronta para identificar rapidamente o foco desse caderno.
              </p>

              <div className="split-grid notebooks-layout">
                <form className="flashcards-form" onSubmit={handleCreateNotebook}>
                  <div className="plan-field-group">
                    <label className="plan-field-label" htmlFor="notebook-name">
                      Nome do caderno
                    </label>
                    <input
                      id="notebook-name"
                      className="subject-input"
                      type="text"
                      placeholder="Ex: Constitucional CESPE"
                      value={newNotebookName}
                      onChange={(event) => setNewNotebookName(event.target.value)}
                    />
                  </div>

                  <div className="plan-field-group">
                    <label className="plan-field-label" htmlFor="notebook-description">
                      Descrição
                    </label>
                    <textarea
                      id="notebook-description"
                      className="subject-input notebook-description-input"
                      placeholder="Ex: Questões focadas em controle de constitucionalidade e organização do Estado."
                      value={newNotebookDescription}
                      onChange={(event) => setNewNotebookDescription(event.target.value)}
                    />
                  </div>

                  <div className="flashcards-actions">
                    <button type="submit" className="subject-add-button">
                      Criar caderno
                    </button>
                    <button
                      type="button"
                      className="header-button header-button-secondary"
                      onClick={goToLibrary}
                    >
                      Cancelar
                    </button>
                  </div>
                </form>

                <div className="notebook-preview-panel">
                  <span className="notebook-book-topline">Prévia do caderno</span>
                  <div className="notebook-book notebook-book-preview notebook-book--tone-1">
                    <span className="notebook-book-spine" aria-hidden="true" />
                    <strong>{newNotebookName.trim() || 'Seu próximo caderno'}</strong>
                    <p>
                      {newNotebookDescription.trim() || 'A descrição aparece aqui para você validar rapidamente como ele ficará na estante.'}
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </Card>
        </section>
      ) : null}

      {view === 'detail' && selectedNotebook ? (
        <section className="notebook-page-layout">
          <Card>
            <section className="panel-section">
              <div className="notebook-page-header">
                <div>
                  <button
                    type="button"
                    className="notebook-back-button"
                    onClick={goToLibrary}
                  >
                    Voltar para a estante
                  </button>
                  <h2 className="section-title">{selectedNotebook.name}</h2>
                  <p className="flashcards-helper">
                    {selectedNotebook.description || 'Adicione questões e use este caderno como base para os treinos futuros.'}
                  </p>
                </div>

                <div className="notebook-page-actions">
                  <button
                    type="button"
                    className="subject-add-button"
                    onClick={() => alert('O treinamento deste caderno será implementado posteriormente.')}
                  >
                    Iniciar treinamento
                  </button>
                  <button
                    type="button"
                    className="plan-action-btn"
                    onClick={() => setIsQuestionFormOpen((previous) => !previous)}
                  >
                    {isQuestionFormOpen ? 'Fechar adição' : 'Adicionar questão'}
                  </button>
                </div>
              </div>
            </section>
          </Card>

          <Card>
            <section className="panel-section">
              <div className="notebook-section-heading">
                <div>
                  <h3 className="section-title">Questões do caderno</h3>
                  <p className="flashcards-helper">
                    Veja rapidamente o que já foi salvo e use o primeiro card para adicionar novas questões.
                  </p>
                </div>
              </div>

              <div className="question-cards-grid">
                <button
                  type="button"
                  className={`question-card question-card-add${isQuestionFormOpen ? ' is-active' : ''}`}
                  onClick={() => setIsQuestionFormOpen(true)}
                >
                  <span className="question-card-plus">+</span>
                  <strong>Adicionar nova questão</strong>
                  <p>Abra o formulário e cadastre banca, ano, enunciado, texto de apoio e alternativas.</p>
                </button>

                {selectedNotebook.questions.map((question, index) => (
                  <article key={question.id} className="question-card">
                    <span className="question-card-index">Questão {index + 1}</span>
                    <div className="flashcard-tags">
                      <span className="pill info">{question.bank}</span>
                      <span className="pill">{question.year}</span>
                      <span className="pill success">{question.alternatives.length} alternativas</span>
                    </div>
                    <p className="question-card-statement">{truncateText(question.statement, 180)}</p>
                    {question.supportText ? (
                      <p className="question-card-support">{truncateText(question.supportText, 120)}</p>
                    ) : (
                      <p className="question-card-support">Sem texto de apoio.</p>
                    )}
                  </article>
                ))}
              </div>

              {selectedNotebook.questions.length === 0 ? (
                <p className="empty-message">
                  Este caderno ainda está vazio. O card de adição já está disponível acima para começar o cadastro.
                </p>
              ) : null}
            </section>
          </Card>

          {isQuestionFormOpen ? (
            <Card>
              <section className="panel-section">
                <h2 className="section-title">Adicionar questão</h2>
                <p className="flashcards-helper">
                  Cadastre a questão exatamente como você quer visualizar depois no treino.
                </p>

                <form className="flashcards-form" onSubmit={handleAddQuestion}>
                  <div className="notebook-meta-grid">
                    <div className="plan-field-group">
                      <label className="plan-field-label" htmlFor="question-bank">
                        Banca
                      </label>
                      <input
                        id="question-bank"
                        className="subject-input"
                        type="text"
                        placeholder="Ex: FGV"
                        value={questionForm.bank}
                        onChange={(event) => setQuestionForm((previous) => ({ ...previous, bank: event.target.value }))}
                      />
                    </div>

                    <div className="plan-field-group">
                      <label className="plan-field-label" htmlFor="question-year">
                        Ano
                      </label>
                      <input
                        id="question-year"
                        className="subject-input"
                        type="text"
                        inputMode="numeric"
                        placeholder="Ex: 2025"
                        value={questionForm.year}
                        onChange={(event) => setQuestionForm((previous) => ({ ...previous, year: event.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="plan-field-group">
                    <label className="plan-field-label" htmlFor="question-statement">
                      Enunciado
                    </label>
                    <textarea
                      id="question-statement"
                      className="subject-input notebook-textarea-lg"
                      placeholder="Digite o enunciado completo da questão."
                      value={questionForm.statement}
                      onChange={(event) => setQuestionForm((previous) => ({ ...previous, statement: event.target.value }))}
                    />
                  </div>

                  <div className="plan-field-group">
                    <label className="plan-field-label" htmlFor="question-support-text">
                      Texto de apoio
                    </label>
                    <textarea
                      id="question-support-text"
                      className="subject-input notebook-textarea-md"
                      placeholder="Opcional. Use este campo se a questão tiver texto-base."
                      value={questionForm.supportText}
                      onChange={(event) => setQuestionForm((previous) => ({ ...previous, supportText: event.target.value }))}
                    />
                  </div>

                  <div className="notebook-alternatives-header">
                    <div>
                      <h3 className="notebook-block-title">Alternativas</h3>
                      <p className="flashcards-helper">Você define quantas opções quer manter no cadastro.</p>
                    </div>
                    <button
                      type="button"
                      className="plan-action-btn"
                      onClick={handleAddAlternative}
                    >
                      Adicionar alternativa
                    </button>
                  </div>

                  <div className="notebook-alternatives-list">
                    {questionForm.alternatives.map((alternative, index) => (
                      <div key={OPTION_LABELS[index]} className="notebook-alternative-row">
                        <span className="notebook-alternative-label">{OPTION_LABELS[index]}</span>
                        <input
                          className="subject-input"
                          type="text"
                          placeholder={`Texto da alternativa ${OPTION_LABELS[index]}`}
                          value={alternative}
                          onChange={(event) => handleAlternativeChange(index, event.target.value)}
                        />
                        <button
                          type="button"
                          className="agenda-icon-button"
                          onClick={() => handleRemoveAlternative(index)}
                          aria-label={`Remover alternativa ${OPTION_LABELS[index]}`}
                        >
                          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                            <path
                              d="M6 12h12"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="plan-field-group">
                    <label className="plan-field-label" htmlFor="question-correct-alternative">
                      Alternativa correta
                    </label>
                    <select
                      id="question-correct-alternative"
                      className="subject-input"
                      value={questionForm.correctAlternative}
                      onChange={(event) =>
                        setQuestionForm((previous) => ({
                          ...previous,
                          correctAlternative: event.target.value
                        }))
                      }
                    >
                      {questionForm.alternatives.map((_, index) => (
                        <option key={OPTION_LABELS[index]} value={OPTION_LABELS[index]}>
                          {OPTION_LABELS[index]}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flashcards-actions">
                    <button type="submit" className="subject-add-button">
                      Salvar questão
                    </button>
                    <button
                      type="button"
                      className="header-button header-button-secondary"
                      onClick={resetQuestionForm}
                    >
                      Limpar formulário
                    </button>
                  </div>
                </form>
              </section>
            </Card>
          ) : null}
        </section>
      ) : null}
    </>
  )
}

export default QuestionNotebooks
