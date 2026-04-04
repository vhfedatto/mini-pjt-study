import { useEffect, useMemo, useRef, useState } from 'react'
import Header from '../components/layout/Header'
import SummaryCard from '../components/ui/SummaryCard'
import Footer from '../components/layout/Footer'
import Card from '../components/ui/Card'

const FLASHCARDS_STORAGE_KEY = 'flashcards'
const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E']
const DIFFICULTY_LABELS = {
  facil: 'Fácil',
  medio: 'Médio',
  dificil: 'Difícil'
}
const STOPWORDS = new Set([
  'a', 'as', 'ao', 'aos', 'com', 'como', 'da', 'das', 'de', 'do', 'dos', 'e',
  'em', 'entre', 'essa', 'esse', 'esta', 'este', 'foi', 'mais', 'na', 'nas',
  'no', 'nos', 'o', 'os', 'ou', 'para', 'por', 'qual', 'que', 'se', 'sem',
  'ser', 'sobre', 'sua', 'suas', 'seu', 'seus', 'tema', 'um', 'uma'
])

function normalizeText(text) {
  return text.replaceAll(/\s+/g, ' ').trim()
}

function normalizeKey(text) {
  return text
    .normalize('NFD')
    .replaceAll(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function splitContentIntoIdeas(content) {
  return content
    .replaceAll('\r', '')
    .split(/\n+/)
    .flatMap((line) => {
      const cleanedLine = line.replace(/^[\s\-*\d.)]+/, '').trim()
      if (!cleanedLine) return []

      return (cleanedLine.match(/[^.!?]+[.!?]?/g) ?? [cleanedLine])
        .map((chunk) => normalizeText(chunk))
        .filter((chunk) => chunk.length >= 24)
    })
}

function extractKeywords(content) {
  const counts = new Map()
  const words = content.match(/[A-Za-zÀ-ÿ]{4,}/g) ?? []

  words.forEach((word) => {
    const key = normalizeKey(word)
    if (STOPWORDS.has(key)) return

    const entry = counts.get(key) ?? { label: word, count: 0 }
    entry.count += 1
    if (word.length > entry.label.length) entry.label = word
    counts.set(key, entry)
  })

  return [...counts.values()]
    .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label, 'pt-BR'))
    .slice(0, 8)
    .map((item) => item.label)
}

function buildQuestion(fragment, index, topic, subjectName) {
  const label = fragment
    .replaceAll(/[^A-Za-zÀ-ÿ0-9\s-]/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 6)
    .join(' ')

  const focus = topic.trim() || subjectName
  const templates = [
    `O que o conteúdo destaca sobre ${label || focus}?`,
    `Como você explicaria ${label || focus} em ${subjectName}?`,
    `Qual é o ponto principal deste trecho sobre ${focus}?`,
    `Que ideia-chave você precisa lembrar sobre ${label || focus}?`
  ]

  return templates[index % templates.length]
}

function shuffleList(list) {
  const copy = [...list]
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    ;[copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]]
  }

  return copy
}

function makeFallbackDistractor(index, subjectName, topic) {
  const focus = topic || subjectName
  const templates = [
    `Afirma que ${focus} não possui conceitos relevantes para revisão.`,
    `Define ${focus} apenas por uma opinião pessoal, sem base no conteúdo.`,
    `Relaciona ${focus} a um tema externo que não aparece no texto.`,
    `Resume ${focus} com uma conclusão contraditória ao material estudado.`,
    `Apresenta ${focus} de forma genérica, sem o ponto principal do conteúdo.`
  ]

  return templates[index % templates.length]
}

function trimOptionText(text) {
  const normalized = normalizeText(text)
  if (normalized.length <= 150) return normalized
  return `${normalized.slice(0, 147)}...`
}

function buildOptions({ correctAnswer, answerPool, difficulty, subjectName, topic }) {
  const uniquePool = [...new Set(answerPool.map((entry) => trimOptionText(entry)))]
  const normalizedCorrect = normalizeKey(correctAnswer)

  let distractors = uniquePool.filter((entry) => normalizeKey(entry) !== normalizedCorrect)

  if (difficulty === 'facil') {
    distractors = distractors.reverse()
  }

  if (difficulty === 'dificil') {
    distractors = shuffleList(distractors)
  }

  while (distractors.length < 4) {
    distractors.push(makeFallbackDistractor(distractors.length, subjectName, topic))
  }

  const rawOptions = [trimOptionText(correctAnswer), ...distractors.slice(0, 4)]
  const shuffledOptions = shuffleList(rawOptions)

  const options = shuffledOptions.map((optionText, index) => ({
    label: OPTION_LABELS[index],
    text: optionText
  }))

  const correctOption = options.find((option) => normalizeKey(option.text) === normalizedCorrect)?.label || 'A'

  return { options, correctOption }
}

function hydrateStoredCard(card) {
  const difficulty = card.difficulty || 'medio'
  if (Array.isArray(card.options) && card.options.length === 5 && card.correctOption) {
    return { ...card, difficulty }
  }

  const { options, correctOption } = buildOptions({
    correctAnswer: card.answer || 'Sem resposta',
    answerPool: [card.answer || 'Sem resposta'],
    difficulty,
    subjectName: card.subjectName || 'Geral',
    topic: card.topic || ''
  })

  return {
    ...card,
    difficulty,
    options,
    correctOption
  }
}

function generateFlashcards({ subjectId, subjectName, topic, content, desiredCount, difficulty }) {
  const ideas = splitContentIntoIdeas(content)
  const keywords = extractKeywords(content)
  const cards = []
  const timestamp = Date.now()
  const trimmedTopic = topic.trim()

  if (ideas.length > 0) {
    cards.push({
      id: timestamp,
      deckId: timestamp,
      subjectId,
      subjectName,
      topic: trimmedTopic,
      difficulty,
      prompt: `Qual é a ideia central de ${trimmedTopic || subjectName}?`,
      answer: ideas.slice(0, 2).join(' '),
      createdAt: timestamp
    })
  }

  ideas.forEach((fragment, index) => {
    if (cards.length >= desiredCount) return

    cards.push({
      id: timestamp + index + 1,
      deckId: timestamp,
      subjectId,
      subjectName,
      topic: trimmedTopic,
      difficulty,
      prompt: buildQuestion(fragment, index, trimmedTopic, subjectName),
      answer: fragment,
      createdAt: timestamp
    })
  })

  keywords.forEach((keyword, index) => {
    if (cards.length >= desiredCount) return

    const relatedIdea = ideas.find((idea) => normalizeKey(idea).includes(normalizeKey(keyword)))
    if (!relatedIdea) return

    cards.push({
      id: timestamp + ideas.length + index + 2,
      deckId: timestamp,
      subjectId,
      subjectName,
      topic: trimmedTopic,
      difficulty,
      prompt: `Como o conceito "${keyword}" aparece em ${trimmedTopic || subjectName}?`,
      answer: relatedIdea,
      createdAt: timestamp
    })
  })

  const baseCards = cards
    .filter((card, index, allCards) => allCards.findIndex((item) => item.prompt === card.prompt) === index)
    .slice(0, desiredCount)

  const answerPool = [...new Set([...ideas, ...baseCards.map((card) => card.answer)])]

  return baseCards.map((card) => {
    const { options, correctOption } = buildOptions({
      correctAnswer: card.answer,
      answerPool,
      difficulty,
      subjectName,
      topic: trimmedTopic
    })

    return {
      ...card,
      options,
      correctOption
    }
  })
}

function Flashcards({ embedded = false }) {
  const [subjects] = useState(() => {
    const stored = localStorage.getItem('subjects')
    return stored ? JSON.parse(stored) : []
  })
  const [flashcards, setFlashcards] = useState(() => {
    const stored = localStorage.getItem(FLASHCARDS_STORAGE_KEY)
    if (!stored) return []

    const parsed = JSON.parse(stored)
    return parsed.map((card) => hydrateStoredCard(card))
  })
  const [selectedSubjectId, setSelectedSubjectId] = useState('')
  const [customSubject, setCustomSubject] = useState('')
  const [topic, setTopic] = useState('')
  const [content, setContent] = useState('')
  const [cardCount, setCardCount] = useState('6')
  const [generationDifficulty, setGenerationDifficulty] = useState('medio')
  const [filterSubject, setFilterSubject] = useState('all')
  const [filterDifficulty, setFilterDifficulty] = useState('all')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedOptions, setSelectedOptions] = useState({})
  const [revealedAnswers, setRevealedAnswers] = useState({})
  const [pointerStartX, setPointerStartX] = useState(null)
  const [dragX, setDragX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [swipeStage, setSwipeStage] = useState('idle')
  const [isSwipeAnimating, setIsSwipeAnimating] = useState(false)
  const swipeTimeoutRef = useRef(null)

  const selectedSubject = useMemo(
    () => subjects.find((subject) => subject.id === Number(selectedSubjectId)) ?? null,
    [selectedSubjectId, subjects]
  )

  const totalDecks = useMemo(
    () => new Set(flashcards.map((card) => card.deckId)).size,
    [flashcards]
  )

  const subjectsWithCards = useMemo(
    () => new Set(flashcards.map((card) => normalizeKey(card.subjectName))).size,
    [flashcards]
  )

  const difficultyCounts = useMemo(() => {
    return flashcards.reduce(
      (accumulator, card) => {
        const key = card.difficulty || 'medio'
        accumulator[key] = (accumulator[key] ?? 0) + 1
        return accumulator
      },
      { facil: 0, medio: 0, dificil: 0 }
    )
  }, [flashcards])

  const subjectFilters = useMemo(() => {
    const uniqueSubjects = []
    const seen = new Set()

    flashcards.forEach((card) => {
      const key = normalizeKey(card.subjectName)
      if (seen.has(key)) return
      seen.add(key)
      uniqueSubjects.push(card.subjectName)
    })

    return uniqueSubjects.sort((left, right) => left.localeCompare(right, 'pt-BR'))
  }, [flashcards])

  const filteredFlashcards = useMemo(() => {
    return flashcards.filter((card) => {
      const matchesSubject =
        filterSubject === 'all' || normalizeKey(card.subjectName) === normalizeKey(filterSubject)
      const matchesDifficulty =
        filterDifficulty === 'all' || (card.difficulty || 'medio') === filterDifficulty

      return matchesSubject && matchesDifficulty
    })
  }, [filterDifficulty, filterSubject, flashcards])

  const currentCard = filteredFlashcards[currentIndex] ?? null

  const answeredCount = useMemo(
    () => filteredFlashcards.filter((card) => revealedAnswers[card.id]).length,
    [filteredFlashcards, revealedAnswers]
  )

  const correctCount = useMemo(
    () =>
      filteredFlashcards.filter(
        (card) => revealedAnswers[card.id] && selectedOptions[card.id] === card.correctOption
      ).length,
    [filteredFlashcards, revealedAnswers, selectedOptions]
  )

  useEffect(() => {
    localStorage.setItem(FLASHCARDS_STORAGE_KEY, JSON.stringify(flashcards))
  }, [flashcards])

  useEffect(() => {
    if (filteredFlashcards.length === 0) {
      setCurrentIndex(0)
      return
    }

    setCurrentIndex((previous) => Math.min(previous, filteredFlashcards.length - 1))
  }, [filteredFlashcards])

  useEffect(() => {
    return () => {
      if (swipeTimeoutRef.current) {
        clearTimeout(swipeTimeoutRef.current)
      }
    }
  }, [])

  function clearSwipeTimeout() {
    if (!swipeTimeoutRef.current) return
    clearTimeout(swipeTimeoutRef.current)
    swipeTimeoutRef.current = null
  }

  function goToNextCard() {
    if (isSwipeAnimating) return

    if (filteredFlashcards.length <= 1) {
      clearSwipeTimeout()
      setDragX(0)
      setIsDragging(false)
      setSwipeStage('idle')
      return
    }

    clearSwipeTimeout()
    setIsSwipeAnimating(true)
    setIsDragging(false)
    setSwipeStage('exit')
    setDragX(-360)

    swipeTimeoutRef.current = setTimeout(() => {
      setCurrentIndex((previous) => (previous + 1) % filteredFlashcards.length)
      setSwipeStage('enter')
      setDragX(220)

      requestAnimationFrame(() => {
        setDragX(0)
      })

      swipeTimeoutRef.current = setTimeout(() => {
        setSwipeStage('idle')
        setIsSwipeAnimating(false)
        swipeTimeoutRef.current = null
      }, 240)
    }, 220)
  }

  function goToPreviousCard() {
    if (isSwipeAnimating) return

    if (filteredFlashcards.length <= 1) {
      clearSwipeTimeout()
      setDragX(0)
      setIsDragging(false)
      setSwipeStage('idle')
      return
    }

    clearSwipeTimeout()
    setIsSwipeAnimating(true)
    setIsDragging(false)
    setSwipeStage('exit')
    setDragX(360)

    swipeTimeoutRef.current = setTimeout(() => {
      setCurrentIndex((previous) =>
        previous === 0 ? filteredFlashcards.length - 1 : previous - 1
      )
      setSwipeStage('enter')
      setDragX(-220)

      requestAnimationFrame(() => {
        setDragX(0)
      })

      swipeTimeoutRef.current = setTimeout(() => {
        setSwipeStage('idle')
        setIsSwipeAnimating(false)
        swipeTimeoutRef.current = null
      }, 240)
    }, 220)
  }

  function handlePointerDown(event) {
    if (filteredFlashcards.length <= 1 || isSwipeAnimating) return

    setPointerStartX(event.clientX)
    setIsDragging(true)
  }

  function handlePointerMove(event) {
    if (pointerStartX === null || isSwipeAnimating) return

    const deltaX = event.clientX - pointerStartX
    setDragX(Math.max(-170, Math.min(170, deltaX)))
  }

  function handlePointerEnd() {
    if (pointerStartX === null || isSwipeAnimating) return

    if (dragX <= -90) {
      goToNextCard()
    } else if (dragX >= 90) {
      goToPreviousCard()
    } else {
      setDragX(0)
      setIsDragging(false)
    }

    setPointerStartX(null)
  }

  function handleChooseOption(optionLabel) {
    if (!currentCard) return

    setSelectedOptions((previous) => ({
      ...previous,
      [currentCard.id]: optionLabel
    }))
  }

  function handleRevealAnswer() {
    if (!currentCard) return

    const selectedOption = selectedOptions[currentCard.id]
    if (!selectedOption) {
      alert('Escolha uma opção de A até E antes de ver a resposta.')
      return
    }

    setRevealedAnswers((previous) => ({
      ...previous,
      [currentCard.id]: true
    }))
  }

  function handleGenerateFlashcards(event) {
    event.preventDefault()

    const resolvedSubjectName = selectedSubject?.name || customSubject.trim()
    const normalizedContent = normalizeText(content)

    if (!resolvedSubjectName) {
      alert('Selecione uma matéria cadastrada ou digite uma matéria para gerar os flashcards.')
      return
    }

    if (normalizedContent.length < 40) {
      alert('Adicione um conteúdo mais completo para gerar perguntas úteis.')
      return
    }

    const generatedCards = generateFlashcards({
      subjectId: selectedSubject?.id ?? null,
      subjectName: resolvedSubjectName,
      topic,
      content: normalizedContent,
      desiredCount: Number(cardCount),
      difficulty: generationDifficulty
    })

    if (generatedCards.length === 0) {
      alert('Não consegui gerar flashcards com esse conteúdo. Tente escrever o conteúdo em frases mais descritivas.')
      return
    }

    setFlashcards((previous) => [...generatedCards, ...previous])
    setFilterSubject('all')
    setFilterDifficulty('all')
    setCurrentIndex(0)
  }

  function handleRemoveCard(cardId) {
    setFlashcards((previous) => previous.filter((card) => card.id !== cardId))
    setSelectedOptions((previous) => {
      const updated = { ...previous }
      delete updated[cardId]
      return updated
    })
    setRevealedAnswers((previous) => {
      const updated = { ...previous }
      delete updated[cardId]
      return updated
    })
  }

  function handleClearForm() {
    setSelectedSubjectId('')
    setCustomSubject('')
    setTopic('')
    setContent('')
    setCardCount('6')
    setGenerationDifficulty('medio')
  }

  function handleClearAllCards() {
    clearSwipeTimeout()
    setFlashcards([])
    setFilterSubject('all')
    setFilterDifficulty('all')
    setCurrentIndex(0)
    setSelectedOptions({})
    setRevealedAnswers({})
    setDragX(0)
    setPointerStartX(null)
    setIsDragging(false)
    setSwipeStage('idle')
    setIsSwipeAnimating(false)
  }

  return (
    <section className="dashboard-content">
      {embedded ? null : <Header />}

      <section className="summary-grid">
        <SummaryCard
          title="Flashcards salvos"
          value={flashcards.length}
          description="Cartões prontos para revisar"
        />
        <SummaryCard
          title="Baralhos gerados"
          value={totalDecks}
          description="Sequências criadas a partir do conteúdo"
        />
        <SummaryCard
          title="Matérias revisadas"
          value={subjectsWithCards}
          description="Disciplinas com perguntas ativas"
        />
        <SummaryCard
          title="Acertos na revisão"
          value={`${correctCount}/${Math.max(answeredCount, 1)}`}
          description={answeredCount > 0 ? 'Cards respondidos corretamente' : 'Responda para acompanhar desempenho'}
          variant="alert"
        />
      </section>

      <section className="split-grid flashcards-layout">
        <Card>
          <section className="panel-section">
            <h2 className="section-title">Gerar flashcards</h2>
            <p className="flashcards-helper">
              Cole um resumo, definição ou trecho da aula. A página transforma esse conteúdo em perguntas de revisão.
            </p>

            <form className="flashcards-form" onSubmit={handleGenerateFlashcards}>
              {subjects.length > 0 ? (
                <div className="plan-field-group">
                  <label className="plan-field-label" htmlFor="flashcard-subject">
                    Matéria cadastrada
                  </label>
                  <select
                    id="flashcard-subject"
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
                <label className="plan-field-label" htmlFor="flashcard-custom-subject">
                  Ou digite a matéria
                </label>
                <input
                  id="flashcard-custom-subject"
                  className="subject-input"
                  type="text"
                  placeholder="Ex: Biologia"
                  value={customSubject}
                  onChange={(event) => setCustomSubject(event.target.value)}
                />
              </div>

              <div className="plan-field-group">
                <label className="plan-field-label" htmlFor="flashcard-topic">
                  Tópico principal
                </label>
                <input
                  id="flashcard-topic"
                  className="subject-input"
                  type="text"
                  placeholder="Ex: Fotossíntese"
                  value={topic}
                  onChange={(event) => setTopic(event.target.value)}
                />
              </div>

              <div className="plan-field-group">
                <label className="plan-field-label" htmlFor="flashcard-count">
                  Quantidade de perguntas
                </label>
                <select
                  id="flashcard-count"
                  className="subject-input"
                  value={cardCount}
                  onChange={(event) => setCardCount(event.target.value)}
                >
                  <option value="4">4 flashcards</option>
                  <option value="6">6 flashcards</option>
                  <option value="8">8 flashcards</option>
                  <option value="10">10 flashcards</option>
                </select>
              </div>

              <div className="plan-field-group">
                <label className="plan-field-label" htmlFor="flashcard-difficulty">
                  Dificuldade dos flashcards
                </label>
                <select
                  id="flashcard-difficulty"
                  className="subject-input"
                  value={generationDifficulty}
                  onChange={(event) => setGenerationDifficulty(event.target.value)}
                >
                  <option value="facil">Fácil</option>
                  <option value="medio">Médio</option>
                  <option value="dificil">Difícil</option>
                </select>
              </div>

              <div className="plan-field-group">
                <label className="plan-field-label" htmlFor="flashcard-content">
                  Conteúdo base
                </label>
                <textarea
                  id="flashcard-content"
                  className="subject-input flashcards-textarea"
                  placeholder="Escreva ou cole aqui o conteúdo que servirá de base para as perguntas."
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                />
              </div>

              <div className="flashcards-actions">
                <button type="submit" className="subject-add-button">
                  Gerar perguntas
                </button>
                <button
                  type="button"
                  className="header-button header-button-secondary"
                  onClick={handleClearForm}
                >
                  Limpar campos
                </button>
              </div>
            </form>
          </section>
        </Card>

        <Card>
          <section className="panel-section">
            <div className="flashcards-toolbar">
              <div>
                <h2 className="section-title">Revisão</h2>
                <p className="flashcards-helper">
                  Escolha uma alternativa de A até E, clique em "Ver resposta" e arraste: esquerda para próximo, direita para voltar.
                </p>
              </div>

              <div className="flashcards-toolbar-actions">
                <select
                  className="subject-input flashcards-filter"
                  value={filterSubject}
                  onChange={(event) => {
                    setFilterSubject(event.target.value)
                    setCurrentIndex(0)
                  }}
                >
                  <option value="all">Todas as matérias</option>
                  {subjectFilters.map((subjectName) => (
                    <option key={subjectName} value={subjectName}>
                      {subjectName}
                    </option>
                  ))}
                </select>

                <select
                  className="subject-input flashcards-filter"
                  value={filterDifficulty}
                  onChange={(event) => {
                    setFilterDifficulty(event.target.value)
                    setCurrentIndex(0)
                  }}
                >
                  <option value="all">Todas as dificuldades</option>
                  <option value="facil">Fácil ({difficultyCounts.facil})</option>
                  <option value="medio">Médio ({difficultyCounts.medio})</option>
                  <option value="dificil">Difícil ({difficultyCounts.dificil})</option>
                </select>

                <button
                  type="button"
                  className="plan-action-btn"
                  onClick={handleClearAllCards}
                  disabled={flashcards.length === 0}
                >
                  Limpar tudo
                </button>
              </div>
            </div>

            {filteredFlashcards.length > 0 ? (
              <div className="flashcards-review-wrapper">
                <p className="flashcard-review-progress">
                  Card {currentIndex + 1} de {filteredFlashcards.length} • Dificuldade {DIFFICULTY_LABELS[currentCard?.difficulty || 'medio']}
                </p>

                <article
                  className={`flashcard-review-card flashcard-review-card--${swipeStage}${isDragging ? ' is-dragging' : ''}`}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerEnd}
                  onPointerLeave={handlePointerEnd}
                  onPointerCancel={handlePointerEnd}
                  style={{
                    transform: `translateX(${dragX}px) rotate(${dragX / 26}deg)`,
                    transition: isDragging
                      ? 'none'
                      : 'transform 0.26s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.22s ease, filter 0.22s ease'
                  }}
                >
                  <div className="flashcard-tags">
                    <span className="pill info">{currentCard?.subjectName}</span>
                    {currentCard?.topic ? <span className="pill">{currentCard.topic}</span> : null}
                    <span className="pill success">{DIFFICULTY_LABELS[currentCard?.difficulty || 'medio']}</span>
                  </div>

                  <span className="flashcard-label">Pergunta</span>
                  <p className="flashcard-content">{currentCard?.prompt}</p>

                  <ul className="flashcard-options-list">
                    {(currentCard?.options ?? []).map((option) => {
                      const selectedOption = selectedOptions[currentCard.id]
                      const isRevealed = Boolean(revealedAnswers[currentCard.id])
                      const isSelected = selectedOption === option.label
                      const isCorrect = currentCard.correctOption === option.label

                      return (
                        <li key={option.label}>
                          <button
                            type="button"
                            className={`flashcard-option-button${isSelected ? ' is-selected' : ''}${isRevealed && isCorrect ? ' is-correct' : ''}${isRevealed && isSelected && !isCorrect ? ' is-wrong' : ''}`}
                            onClick={() => handleChooseOption(option.label)}
                          >
                            <span className="flashcard-option-label">{option.label}</span>
                            <span>{option.text}</span>
                          </button>
                        </li>
                      )
                    })}
                  </ul>

                  <div className="flashcard-review-actions">
                    <button
                      type="button"
                      className="subject-add-button"
                      onClick={handleRevealAnswer}
                      disabled={Boolean(revealedAnswers[currentCard?.id])}
                    >
                      {revealedAnswers[currentCard?.id] ? 'Resposta exibida' : 'Ver resposta'}
                    </button>

                    <button
                      type="button"
                      className="plan-action-btn"
                      onClick={() => handleRemoveCard(currentCard.id)}
                    >
                      Remover card
                    </button>
                  </div>

                  <div className="flashcard-navigation-actions">
                    <button
                      type="button"
                      className="plan-action-btn"
                      onClick={goToPreviousCard}
                    >
                      Anterior
                    </button>
                    <button
                      type="button"
                      className="plan-action-btn"
                      onClick={goToNextCard}
                    >
                      Próximo
                    </button>
                  </div>

                  {revealedAnswers[currentCard?.id] ? (
                    <div className="flashcard-answer-box">
                      <p>
                        <strong>Resposta correta ({currentCard.correctOption}):</strong> {currentCard.answer}
                      </p>
                      <p>
                        <strong>Sua escolha:</strong> {selectedOptions[currentCard.id]}
                      </p>
                    </div>
                  ) : (
                    <p className="flashcard-hint">Arraste para a esquerda para o próximo card ou para a direita para voltar.</p>
                  )}
                </article>
              </div>
            ) : (
              <p className="empty-message">
                {flashcards.length === 0
                  ? 'Nenhum flashcard gerado ainda. Preencha o conteúdo ao lado para começar.'
                  : 'Nenhum flashcard encontrado para o filtro atual.'}
              </p>
            )}
          </section>
        </Card>
      </section>

      {embedded ? null : <Footer />}
    </section>
  )
}

export default Flashcards
