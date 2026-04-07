import { useEffect, useMemo, useState } from 'react'
import Header from '../components/layout/Header'
import SummaryCard from '../components/ui/SummaryCard'
import Footer from '../components/layout/Footer'
import Card from '../components/ui/Card'

const defaultPlanColor = '#c46b2d'
const GRADES_STORAGE_KEY = 'studyGrades'
const DEFAULT_PASSING_SCORE = '6'
const DEFAULT_EVALUATIONS = [
  { id: 'av1', label: 'AV1' },
  { id: 'av2', label: 'AV2' }
]

function readJSON(key, fallback) {
  try {
    const stored = localStorage.getItem(key)
    return stored ? JSON.parse(stored) : fallback
  } catch {
    return fallback
  }
}

function normalizeLabel(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

function slugify(value) {
  return normalizeLabel(value).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

function formatDate(date) {
  if (!date) return ''

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(new Date(`${date}T00:00:00`))
}

function formatScore(value) {
  if (!Number.isFinite(value)) return '-'

  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  })
}

function parseNumber(value) {
  if (value === '' || value === null || value === undefined) return null
  const normalized = String(value).replace(',', '.')
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

function createPlanGradeConfig(subjectIds = []) {
  return {
    passingScore: DEFAULT_PASSING_SCORE,
    evaluations: DEFAULT_EVALUATIONS.map((evaluation) => ({ ...evaluation })),
    selectedSubjectIds: [...subjectIds]
  }
}

function ensureGradebookShape(gradebook, subjects) {
  const safeGradebook = gradebook && typeof gradebook === 'object' ? gradebook : {}
  const plans = safeGradebook.plans && typeof safeGradebook.plans === 'object' ? safeGradebook.plans : {}
  const entries = safeGradebook.entries && typeof safeGradebook.entries === 'object' ? safeGradebook.entries : {}
  let changed = false

  const nextPlans = { ...plans }
  const nextEntries = { ...entries }
  const validSubjectIds = new Set(subjects.map((subject) => String(subject.id)))

  Object.entries(nextPlans).forEach(([planKey, config]) => {
    const planSubjects = subjects
      .filter((subject) => String(subject.planId) === planKey)
      .map((subject) => String(subject.id))

    const safeConfig = config && typeof config === 'object' ? config : {}
    const evaluations = Array.isArray(safeConfig.evaluations) && safeConfig.evaluations.length > 0
      ? safeConfig.evaluations.map((evaluation, index) => ({
          id: evaluation?.id || `${slugify(evaluation?.label || `avaliacao-${index + 1}`) || 'avaliacao'}-${index}`,
          label: evaluation?.label || `Avaliacao ${index + 1}`
        }))
      : DEFAULT_EVALUATIONS.map((evaluation) => ({ ...evaluation }))

    const selectedSubjectIds = Array.isArray(safeConfig.selectedSubjectIds)
      ? safeConfig.selectedSubjectIds
          .map((subjectId) => String(subjectId))
          .filter((subjectId) => planSubjects.includes(subjectId))
      : [...planSubjects]

    const nextConfig = {
      passingScore: safeConfig.passingScore ?? DEFAULT_PASSING_SCORE,
      evaluations,
      selectedSubjectIds
    }

    if (JSON.stringify(nextConfig) !== JSON.stringify(config)) {
      nextPlans[planKey] = nextConfig
      changed = true
    }
  })

  Object.keys(nextEntries).forEach((subjectId) => {
    if (!validSubjectIds.has(String(subjectId))) {
      delete nextEntries[subjectId]
      changed = true
    }
  })

  return {
    changed,
    value: {
      plans: nextPlans,
      entries: nextEntries
    }
  }
}

function Progress() {
  const [plans, setPlans] = useState(() =>
    readJSON('plans', readJSON('studyPlans', []))
  )
  const [subjects, setSubjects] = useState(() => readJSON('subjects', []))
  const [importantDates, setImportantDates] = useState(() => readJSON('importantDates', []))
  const [gradebook, setGradebook] = useState(() =>
    ensureGradebookShape(readJSON(GRADES_STORAGE_KEY, {}), readJSON('subjects', [])).value
  )
  const [selectedPlanId, setSelectedPlanId] = useState('')
  const [newEvaluationName, setNewEvaluationName] = useState('')

  useEffect(() => {
    const syncData = () => {
      const nextPlans = readJSON('plans', readJSON('studyPlans', []))
      const nextSubjects = readJSON('subjects', [])
      const nextImportantDates = readJSON('importantDates', [])
      const nextGradebook = ensureGradebookShape(readJSON(GRADES_STORAGE_KEY, {}), nextSubjects).value

      setPlans(nextPlans)
      setSubjects(nextSubjects)
      setImportantDates(nextImportantDates)
      setGradebook(nextGradebook)
    }

    globalThis.addEventListener('storage', syncData)
    globalThis.addEventListener('study-plans-updated', syncData)
    globalThis.addEventListener('important-dates-updated', syncData)
    return () => {
      globalThis.removeEventListener('storage', syncData)
      globalThis.removeEventListener('study-plans-updated', syncData)
      globalThis.removeEventListener('important-dates-updated', syncData)
    }
  }, [])

  useEffect(() => {
    const normalized = ensureGradebookShape(gradebook, subjects)
    if (normalized.changed) {
      setGradebook(normalized.value)
    }
  }, [gradebook, subjects])

  useEffect(() => {
    localStorage.setItem(GRADES_STORAGE_KEY, JSON.stringify(gradebook))
  }, [gradebook])

  useEffect(() => {
    if (!selectedPlanId) return

    const hasPlan = plans.some((plan) => String(plan.id) === selectedPlanId)
    if (!hasPlan) {
      setSelectedPlanId('')
    }
  }, [plans, selectedPlanId])

  const selectedPlan = useMemo(
    () => plans.find((plan) => String(plan.id) === selectedPlanId) ?? null,
    [plans, selectedPlanId]
  )

  const activePlanSubjects = useMemo(() => {
    if (!selectedPlanId) return []
    return subjects.filter((subject) => String(subject.planId) === selectedPlanId)
  }, [selectedPlanId, subjects])

  const activePlanConfig = useMemo(() => {
    if (!selectedPlanId) return null

    return gradebook.plans[selectedPlanId] || createPlanGradeConfig(activePlanSubjects.map((subject) => String(subject.id)))
  }, [activePlanSubjects, gradebook.plans, selectedPlanId])

  useEffect(() => {
    if (!selectedPlanId) return
    if (gradebook.plans[selectedPlanId]) return

    setGradebook((prev) => ({
      ...prev,
      plans: {
        ...prev.plans,
        [selectedPlanId]: createPlanGradeConfig(activePlanSubjects.map((subject) => String(subject.id)))
      }
    }))
  }, [activePlanSubjects, gradebook.plans, selectedPlanId])

  const allPlanConfigs = useMemo(() => {
    const configs = {}

    plans.forEach((plan) => {
      const planKey = String(plan.id)
      const planSubjects = subjects
        .filter((subject) => String(subject.planId) === planKey)
        .map((subject) => String(subject.id))

      configs[planKey] = gradebook.plans[planKey] || createPlanGradeConfig(planSubjects)
    })

    return configs
  }, [gradebook.plans, plans, subjects])

  const evaluationColumns = useMemo(() => {
    if (selectedPlanId) {
      return activePlanConfig?.evaluations || DEFAULT_EVALUATIONS
    }

    const merged = []
    const seen = new Set()

    Object.values(allPlanConfigs).forEach((config) => {
      config.evaluations.forEach((evaluation) => {
        const key = normalizeLabel(evaluation.label)
        if (!key || seen.has(key)) return
        seen.add(key)
        merged.push({ id: key, label: evaluation.label })
      })
    })

    if (merged.length === 0) {
      return DEFAULT_EVALUATIONS.map((evaluation) => ({ id: normalizeLabel(evaluation.label), label: evaluation.label }))
    }

    return merged
  }, [activePlanConfig, allPlanConfigs, selectedPlanId])

  const visibleSubjects = useMemo(() => {
    const subjectList = selectedPlanId
      ? activePlanSubjects.filter((subject) =>
          activePlanConfig?.selectedSubjectIds?.includes(String(subject.id))
        )
      : subjects

    return [...subjectList].sort((a, b) => {
      const planA = plans.find((plan) => plan.id === a.planId)?.name || ''
      const planB = plans.find((plan) => plan.id === b.planId)?.name || ''
      return planA.localeCompare(planB) || a.name.localeCompare(b.name)
    })
  }, [activePlanConfig?.selectedSubjectIds, activePlanSubjects, plans, selectedPlanId, subjects])

  const proofCardsBySubject = useMemo(() => {
    const map = {}

    importantDates.forEach((item) => {
      const subjectId = String(item.subjectId)
      const evaluationKey = normalizeLabel(item.title)
      if (!subjectId || !evaluationKey) return

      if (!map[subjectId]) map[subjectId] = {}
      if (!map[subjectId][evaluationKey]) map[subjectId][evaluationKey] = []
      map[subjectId][evaluationKey].push(item)
    })

    Object.values(map).forEach((eventMap) => {
      Object.values(eventMap).forEach((items) => {
        items.sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || '') || a.id - b.id)
      })
    })

    return map
  }, [importantDates])

  const gradeRows = useMemo(() => {
    return visibleSubjects.map((subject) => {
      const planKey = String(subject.planId)
      const linkedPlan = plans.find((plan) => String(plan.id) === planKey)
      const planConfig = allPlanConfigs[planKey] || createPlanGradeConfig([String(subject.id)])
      const subjectEntry = gradebook.entries[String(subject.id)] || { scores: {} }
      const passingScore = parseNumber(planConfig.passingScore) ?? parseNumber(DEFAULT_PASSING_SCORE) ?? 0

      const subjectEvaluations = planConfig.evaluations
      const scoresForAverage = subjectEvaluations
        .map((evaluation) => parseNumber(subjectEntry.scores?.[evaluation.id]))
        .filter((value) => value !== null)

      const average = scoresForAverage.length > 0
        ? scoresForAverage.reduce((sum, value) => sum + value, 0) / scoresForAverage.length
        : null

      const missingToPass = average === null ? passingScore : Math.max(passingScore - average, 0)

      return {
        subject,
        linkedPlan,
        planConfig,
        subjectEntry,
        average,
        missingToPass
      }
    })
  }, [allPlanConfigs, gradebook.entries, plans, visibleSubjects])

  const subjectsWithAverage = gradeRows.filter((row) => row.average !== null).length
  const passingRows = gradeRows.filter((row) => row.average !== null && row.average >= (parseNumber(row.planConfig.passingScore) ?? 0)).length
  const pendingProofCards = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    return importantDates.filter((item) => item.dueDate && item.dueDate >= today).length
  }, [importantDates])

  const handlePlanChange = (event) => {
    setSelectedPlanId(event.target.value)
    setNewEvaluationName('')
  }

  const updatePlanConfig = (planKey, updater) => {
    setGradebook((prev) => {
      const currentConfig =
        prev.plans[planKey] ||
        createPlanGradeConfig(
          subjects
            .filter((subject) => String(subject.planId) === planKey)
            .map((subject) => String(subject.id))
        )

      return {
        ...prev,
        plans: {
          ...prev.plans,
          [planKey]: updater(currentConfig)
        }
      }
    })
  }

  const updateEntry = (subjectId, updater) => {
    const subjectKey = String(subjectId)
    setGradebook((prev) => {
      const currentEntry = prev.entries[subjectKey] || { scores: {} }
      return {
        ...prev,
        entries: {
          ...prev.entries,
          [subjectKey]: updater(currentEntry)
        }
      }
    })
  }

  const handlePassingScoreChange = (value) => {
    if (!selectedPlanId) return
    updatePlanConfig(selectedPlanId, (config) => ({ ...config, passingScore: value }))
  }

  const handleEvaluationLabelChange = (evaluationId, value) => {
    if (!selectedPlanId) return

    updatePlanConfig(selectedPlanId, (config) => ({
      ...config,
      evaluations: config.evaluations.map((evaluation) =>
        evaluation.id === evaluationId ? { ...evaluation, label: value } : evaluation
      )
    }))
  }

  const handleAddEvaluation = () => {
    if (!selectedPlanId) return

    const trimmedName = newEvaluationName.trim()
    if (!trimmedName) {
      alert('Informe o nome da nova avaliação.')
      return
    }

    const alreadyExists = activePlanConfig?.evaluations.some(
      (evaluation) => normalizeLabel(evaluation.label) === normalizeLabel(trimmedName)
    )

    if (alreadyExists) {
      alert('Já existe uma coluna com esse nome.')
      return
    }

    updatePlanConfig(selectedPlanId, (config) => ({
      ...config,
      evaluations: [
        ...config.evaluations,
        {
          id: `${slugify(trimmedName) || 'avaliacao'}-${Date.now()}`,
          label: trimmedName
        }
      ]
    }))
    setNewEvaluationName('')
  }

  const handleRemoveEvaluation = (evaluationId) => {
    if (!selectedPlanId || !activePlanConfig) return
    if (activePlanConfig.evaluations.length <= 1) {
      alert('Mantenha pelo menos uma avaliação cadastrada.')
      return
    }

    updatePlanConfig(selectedPlanId, (config) => ({
      ...config,
      evaluations: config.evaluations.filter((evaluation) => evaluation.id !== evaluationId)
    }))

    setGradebook((prev) => {
      const nextEntries = { ...prev.entries }

      Object.entries(nextEntries).forEach(([subjectId, entry]) => {
        const subject = subjects.find((item) => String(item.id) === subjectId)
        if (!subject || String(subject.planId) !== selectedPlanId) return

        const nextScores = { ...(entry.scores || {}) }
        delete nextScores[evaluationId]
        nextEntries[subjectId] = { ...entry, scores: nextScores }
      })

      return {
        ...prev,
        entries: nextEntries
      }
    })
  }

  const handleSubjectSelectionToggle = (subjectId) => {
    if (!selectedPlanId) return
    const subjectKey = String(subjectId)

    updatePlanConfig(selectedPlanId, (config) => {
      const isSelected = config.selectedSubjectIds.includes(subjectKey)
      return {
        ...config,
        selectedSubjectIds: isSelected
          ? config.selectedSubjectIds.filter((id) => id !== subjectKey)
          : [...config.selectedSubjectIds, subjectKey]
      }
    })
  }

  const handleScoreChange = (subjectId, evaluationId, value) => {
    updateEntry(subjectId, (entry) => ({
      ...entry,
      scores: {
        ...(entry.scores || {}),
        [evaluationId]: value
      }
    }))
  }

  return (
    <section className="dashboard-content">
      <Header />

      <section className="summary-grid">
        <SummaryCard
          title="Matérias na tabela"
          value={gradeRows.length}
          description={selectedPlan ? `Filtradas em ${selectedPlan.name}` : 'Todas as matérias cadastradas'}
        />
        <SummaryCard
          title="Médias lançadas"
          value={subjectsWithAverage}
          description="Matérias com pelo menos uma nota informada"
        />
        <SummaryCard
          title="Já atingiram a média"
          value={passingRows}
          description="Matérias atualmente acima da nota de corte"
        />
        <SummaryCard
          title="Provas futuras"
          value={pendingProofCards}
          description="Cards puxados da aba Provas"
          variant="alert"
        />
      </section>

      <Card>
        <section className="panel-section notes-panel">
          <div className="notes-toolbar">
            <div>
              <h2 className="section-title">Notas por matéria</h2>
              <p className="settings-helper">
                Selecione um plano para configurar nota de corte, colunas de avaliação e quais matérias entram na tabela.
              </p>
            </div>

            <div className="notes-toolbar-controls">
              <div className="plan-field-group notes-plan-filter">
                <label className="plan-field-label" htmlFor="notes-plan-filter">Plano</label>
                <select
                  id="notes-plan-filter"
                  className="subject-input"
                  value={selectedPlanId}
                  onChange={handlePlanChange}
                >
                  <option value="">Todos os planos</option>
                  {plans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {selectedPlan ? (
            <div className="notes-config-grid">
              <div className="notes-config-card">
                <div className="notes-config-header">
                  <div>
                    <h3>Configuração do plano</h3>
                    <p>{selectedPlan.name}</p>
                  </div>
                  <span className="pill" style={{ borderColor: selectedPlan.color || defaultPlanColor }}>
                    {activePlanSubjects.length} matérias
                  </span>
                </div>

                <div className="plan-field-group">
                  <label className="plan-field-label" htmlFor="notes-passing-score">Nota de corte</label>
                  <input
                    id="notes-passing-score"
                    className="subject-input"
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="Ex: 6"
                    value={activePlanConfig?.passingScore || ''}
                    onChange={(event) => handlePassingScoreChange(event.target.value)}
                  />
                </div>

                <div className="notes-evaluations-block">
                  <div className="notes-evaluations-header">
                    <div>
                      <h3>Avaliações</h3>
                      <p>AV1 e AV2 já vêm por padrão, mas você pode renomear, remover ou adicionar novas colunas.</p>
                    </div>
                  </div>

                  <div className="notes-evaluation-list">
                    {(activePlanConfig?.evaluations || []).map((evaluation) => (
                      <div className="notes-evaluation-item" key={evaluation.id}>
                        <input
                          className="subject-input"
                          type="text"
                          value={evaluation.label}
                          onChange={(event) => handleEvaluationLabelChange(evaluation.id, event.target.value)}
                          placeholder="Nome da avaliação"
                        />
                        <button
                          type="button"
                          className="subject-remove-button"
                          onClick={() => handleRemoveEvaluation(evaluation.id)}
                          aria-label={`Remover ${evaluation.label}`}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="notes-add-evaluation">
                    <input
                      className="subject-input"
                      type="text"
                      value={newEvaluationName}
                      onChange={(event) => setNewEvaluationName(event.target.value)}
                      placeholder="Ex: Reposição ou Final"
                    />
                    <button type="button" className="subject-add-button" onClick={handleAddEvaluation}>
                      Adicionar coluna
                    </button>
                  </div>
                </div>
              </div>

              <div className="notes-config-card">
                <div className="notes-config-header">
                  <div>
                    <h3>Matérias do plano</h3>
                    <p>Escolha quais matérias aparecem na tabela deste plano.</p>
                  </div>
                </div>

                {activePlanSubjects.length > 0 ? (
                  <div className="notes-subject-selector">
                    {activePlanSubjects.map((subject) => {
                      const isSelected = activePlanConfig?.selectedSubjectIds?.includes(String(subject.id))
                      return (
                        <label key={subject.id} className={`notes-subject-option${isSelected ? ' is-selected' : ''}`}>
                          <input
                            type="checkbox"
                            checked={Boolean(isSelected)}
                            onChange={() => handleSubjectSelectionToggle(subject.id)}
                          />
                          <span>{subject.name}</span>
                        </label>
                      )
                    })}
                  </div>
                ) : (
                  <p className="empty-message">Nenhuma matéria vinculada a este plano ainda.</p>
                )}
              </div>
            </div>
          ) : (
            <div className="notes-all-plans-tip">
              <p>
                Todos os planos estão visíveis. Selecione um plano para definir nota de corte, ajustar as colunas de avaliação e escolher as matérias da tabela.
              </p>
            </div>
          )}
        </section>
      </Card>

      <Card>
        <section className="panel-section notes-table-section">
          <div className="notes-table-header">
            <div>
              <h2 className="section-title">Tabela de notas</h2>
              <p className="settings-helper">
                Os cards de prova aparecem automaticamente quando o campo Avaliação da aba Provas bate com o nome da coluna.
              </p>
            </div>
          </div>

          {gradeRows.length > 0 ? (
            <div className="notes-table-shell">
              <div
                className="notes-table"
                style={{
                  gridTemplateColumns: `minmax(240px, 1.4fr) repeat(${evaluationColumns.length}, minmax(220px, 1fr)) minmax(140px, 0.7fr) minmax(170px, 0.8fr)`
                }}
              >
                <div className="notes-row notes-row-header">
                  <div>Matéria</div>
                  {evaluationColumns.map((evaluation) => (
                    <div key={evaluation.id}>{evaluation.label}</div>
                  ))}
                  <div>Média Final</div>
                  <div>Falta para passar</div>
                </div>

                {gradeRows.map((row) => {
                  const planColor = row.linkedPlan?.color || defaultPlanColor

                  return (
                    <div className="notes-row" key={row.subject.id}>
                      <div className="notes-subject-cell">
                        <span className="progress-subject-label">
                          <span
                            className="plan-color-dot"
                            style={{ '--plan-color': planColor }}
                            aria-hidden="true"
                          />
                          <span className="progress-subject-name">{row.subject.name}</span>
                          <span className="progress-plan-name">{row.linkedPlan?.name || 'Plano sem nome'}</span>
                        </span>
                      </div>

                      {evaluationColumns.map((evaluation) => {
                        const evaluationForSubject = row.planConfig.evaluations.find(
                          (item) =>
                            normalizeLabel(item.label) ===
                            (selectedPlanId ? normalizeLabel(evaluation.label) : evaluation.id)
                        )

                        const scoreValue = evaluationForSubject
                          ? row.subjectEntry.scores?.[evaluationForSubject.id] ?? ''
                          : ''
                        const proofCards = proofCardsBySubject[String(row.subject.id)]?.[
                          selectedPlanId ? normalizeLabel(evaluation.label) : evaluation.id
                        ] || []

                        return (
                          <div className="notes-score-cell" key={`${row.subject.id}-${evaluation.id}`}>
                            {evaluationForSubject ? (
                              <input
                                className="subject-input notes-score-input"
                                type="number"
                                min="0"
                                step="0.1"
                                placeholder="0,0"
                                value={scoreValue}
                                onChange={(event) =>
                                  handleScoreChange(row.subject.id, evaluationForSubject.id, event.target.value)
                                }
                              />
                            ) : (
                              <div className="notes-empty-score">Não usada neste plano</div>
                            )}

                            {proofCards.length > 0 ? (
                              <div className="notes-proof-list">
                                {proofCards.map((item) => (
                                  <article className="notes-proof-card" key={item.id}>
                                    <strong>{formatDate(item.dueDate)}</strong>
                                    <span>{item.notes || 'Sem descrição cadastrada.'}</span>
                                  </article>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        )
                      })}

                      <div className="notes-metric-cell">
                        <strong>{formatScore(row.average)}</strong>
                      </div>

                      <div className="notes-metric-cell">
                        <strong className={row.missingToPass > 0 ? 'notes-missing-score' : 'notes-passing-score'}>
                          {formatScore(row.missingToPass)}
                        </strong>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <p className="empty-message">
              {selectedPlan
                ? 'Nenhuma matéria selecionada para este plano. Marque pelo menos uma matéria acima.'
                : 'Nenhuma matéria cadastrada ainda.'}
            </p>
          )}
        </section>
      </Card>

      <Footer />
    </section>
  )
}

export default Progress
