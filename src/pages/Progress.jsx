import { useEffect, useMemo, useState } from 'react'
import SummaryCard from '../components/ui/SummaryCard'
import Footer from '../components/layout/Footer'
import Card from '../components/ui/Card'

const defaultPlanColor = '#c46b2d'
const GRADES_STORAGE_KEY = 'studyGrades'
const GRADES_BACKUP_STORAGE_KEY = 'studyGrades_backup'
const DEFAULT_PASSING_SCORE = '6'
const DEFAULT_EVALUATIONS = [
  { id: 'av1', label: 'AV1' },
  { id: 'av2', label: 'AV2' }
]
const DEFAULT_GRADING_STYLE = 'numeric'
const LETTER_GRADE_VALUES = {
  A: 10,
  B: 8,
  C: 7,
  D: 6,
  E: 4,
  F: 2
}
const LETTER_GRADE_ORDER = ['A', 'B', 'C', 'D', 'E', 'F']

function GearIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M12 8.9a3.1 3.1 0 1 0 0 6.2 3.1 3.1 0 0 0 0-6.2Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M19.4 15a1 1 0 0 0 .2 1.1l.1.1a1.2 1.2 0 0 1 0 1.7l-1.5 1.5a1.2 1.2 0 0 1-1.7 0l-.1-.1a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9V20a1.2 1.2 0 0 1-1.2 1.2h-2.2A1.2 1.2 0 0 1 10 20v-.2a1 1 0 0 0-.6-.9 1 1 0 0 0-1.1.2l-.1.1a1.2 1.2 0 0 1-1.7 0L5 17.7a1.2 1.2 0 0 1 0-1.7l.1-.1A1 1 0 0 0 5.3 15a1 1 0 0 0-.9-.6H4.2A1.2 1.2 0 0 1 3 13.2v-2.1A1.2 1.2 0 0 1 4.2 10h.2a1 1 0 0 0 .9-.6 1 1 0 0 0-.2-1.1L5 8.2a1.2 1.2 0 0 1 0-1.7L6.5 5a1.2 1.2 0 0 1 1.7 0l.1.1a1 1 0 0 0 1.1.2 1 1 0 0 0 .6-.9V4.2A1.2 1.2 0 0 1 11.2 3h2.1a1.2 1.2 0 0 1 1.2 1.2v.2a1 1 0 0 0 .6.9 1 1 0 0 0 1.1-.2l.1-.1a1.2 1.2 0 0 1 1.7 0L19 6.5a1.2 1.2 0 0 1 0 1.7l-.1.1a1 1 0 0 0-.2 1.1 1 1 0 0 0 .9.6h.2A1.2 1.2 0 0 1 21 11.2v2.1a1.2 1.2 0 0 1-1.2 1.2h-.2a1 1 0 0 0-.9.5Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  )
}

function DragHandleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M9 6.5h.01M9 12h.01M9 17.5h.01M15 6.5h.01M15 12h.01M15 17.5h.01"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="3"
      />
    </svg>
  )
}

function NotesHeader() {
  return (
    <header className="notes-page-header">
      <div className="notes-page-header-copy">
        <span className="notes-page-header-eyebrow">Painel acadêmico</span>
        <h1 className="notes-page-header-title">Notas</h1>
        <p className="notes-page-header-subtitle">
          Acompanhe médias, provas futuras e a evolução de cada matéria em um só lugar.
        </p>
      </div>
    </header>
  )
}

function ChevronDownIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="m6 9 6 6 6-6"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  )
}

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

function formatScoreInput(value) {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 4)
  if (!digits) return ''
  let formatted = ''

  if (digits.length === 1) formatted = digits
  else if (digits.length === 2) formatted = `${digits[0]},${digits[1]}`
  else if (digits.length === 3) formatted = `${digits.slice(0, 2)},${digits[2]}`
  else formatted = `${digits.slice(0, 2)},${digits.slice(2)}`

  const parsed = parseNumber(formatted)
  if (parsed !== null && parsed > 10) return '10'
  return formatted
}

function formatLetterInput(value) {
  const letter = String(value || '')
    .toUpperCase()
    .replace(/[^A-F]/g, '')
  return letter.slice(0, 1)
}

function parseGradeValue(value, gradingStyle) {
  if (gradingStyle === 'letter') {
    const letter = formatLetterInput(value)
    return letter ? LETTER_GRADE_VALUES[letter] ?? null : null
  }

  return parseNumber(value)
}

function formatAverageDisplay(value, gradingStyle) {
  if (!Number.isFinite(value)) return '-'
  if (gradingStyle === 'letter') return toLetterGrade(value)
  return formatScore(value)
}

function toLetterGrade(value) {
  if (!Number.isFinite(value)) return '-'
  if (value >= 9) return 'A'
  if (value >= 8) return 'B'
  if (value >= 7) return 'C'
  if (value >= 6) return 'D'
  if (value >= 4) return 'E'
  return 'F'
}

function formatMissingDisplay(missingToPass, passingScoreValue, gradingStyle) {
  if (gradingStyle === 'letter') {
    return missingToPass > 0 ? `Meta ${formatLetterInput(passingScoreValue) || 'D'}` : 'Aprovado'
  }

  return formatScore(missingToPass)
}

function createPlanGradeConfig(subjectIds = []) {
  return {
    passingScore: DEFAULT_PASSING_SCORE,
    evaluations: DEFAULT_EVALUATIONS.map((evaluation) => ({ ...evaluation })),
    selectedSubjectIds: [...subjectIds],
    subjectOrder: [...subjectIds]
  }
}

function isLockedEvaluation(evaluationId) {
  return evaluationId === 'av1' || evaluationId === 'av2'
}

function ensureGradebookShape(gradebook, subjects) {
  const safeGradebook = gradebook && typeof gradebook === 'object' ? gradebook : {}
  const settings = safeGradebook.settings && typeof safeGradebook.settings === 'object'
    ? safeGradebook.settings
    : {}
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

    const subjectOrder = Array.isArray(safeConfig.subjectOrder)
      ? [
          ...safeConfig.subjectOrder
            .map((subjectId) => String(subjectId))
            .filter((subjectId, index, array) => planSubjects.includes(subjectId) && array.indexOf(subjectId) === index),
          ...planSubjects.filter((subjectId) => !safeConfig.subjectOrder.map((value) => String(value)).includes(subjectId))
        ]
      : [...planSubjects]

    const nextConfig = {
      passingScore: safeConfig.passingScore ?? DEFAULT_PASSING_SCORE,
      evaluations,
      selectedSubjectIds,
      subjectOrder
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
      settings: {
        gradingStyle: settings.gradingStyle || DEFAULT_GRADING_STYLE
      },
      plans: nextPlans,
      entries: nextEntries
    }
  }
}

function readGradebook(subjects) {
  const primary = ensureGradebookShape(readJSON(GRADES_STORAGE_KEY, {}), subjects)
  if (primary.value && typeof primary.value === 'object') return primary.value

  const backup = ensureGradebookShape(readJSON(GRADES_BACKUP_STORAGE_KEY, {}), subjects)
  return backup.value
}

function Progress() {
  const [plans, setPlans] = useState(() =>
    readJSON('plans', readJSON('studyPlans', []))
  )
  const [subjects, setSubjects] = useState(() => readJSON('subjects', []))
  const [importantDates, setImportantDates] = useState(() => readJSON('importantDates', []))
  const [gradebook, setGradebook] = useState(() => readGradebook(readJSON('subjects', [])))
  const [selectedPlanId, setSelectedPlanId] = useState('')
  const [newEvaluationName, setNewEvaluationName] = useState('')
  const [isConfigOpen, setIsConfigOpen] = useState(false)
  const [isHiddenPlansOpen, setIsHiddenPlansOpen] = useState(false)
  const [expandedHiddenPlanId, setExpandedHiddenPlanId] = useState('')
  const [draggedSubject, setDraggedSubject] = useState(null)
  const [dragTargetSubjectId, setDragTargetSubjectId] = useState('')

  useEffect(() => {
    const syncData = () => {
      const nextPlans = readJSON('plans', readJSON('studyPlans', []))
      const nextSubjects = readJSON('subjects', [])
      const nextImportantDates = readJSON('importantDates', [])
      const nextGradebook = readGradebook(nextSubjects)

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
    const normalized = ensureGradebookShape(gradebook, subjects).value
    localStorage.setItem(GRADES_STORAGE_KEY, JSON.stringify(normalized))
    localStorage.setItem(GRADES_BACKUP_STORAGE_KEY, JSON.stringify(normalized))
  }, [gradebook, subjects])

  useEffect(() => {
    if (!selectedPlanId) return

    const hasPlan = plans.some((plan) => String(plan.id) === selectedPlanId)
    if (!hasPlan) {
      setSelectedPlanId('')
    }
  }, [plans, selectedPlanId])

  const gradingStyle = gradebook.settings?.gradingStyle || DEFAULT_GRADING_STYLE
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

  const getOrderedSubjectIds = (planKey) => {
    const planSubjects = subjects
      .filter((subject) => String(subject.planId) === String(planKey))
      .map((subject) => String(subject.id))
    const config = allPlanConfigs[String(planKey)] || createPlanGradeConfig(planSubjects)
    const configuredOrder = Array.isArray(config.subjectOrder) ? config.subjectOrder.map((subjectId) => String(subjectId)) : []

    return [
      ...configuredOrder.filter((subjectId, index, array) => planSubjects.includes(subjectId) && array.indexOf(subjectId) === index),
      ...planSubjects.filter((subjectId) => !configuredOrder.includes(subjectId))
    ]
  }

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
    const getSubjectOrderIndex = (subject) => {
      const orderedIds = getOrderedSubjectIds(subject.planId)
      const index = orderedIds.indexOf(String(subject.id))
      return index === -1 ? Number.MAX_SAFE_INTEGER : index
    }

    if (selectedPlanId) {
      return activePlanSubjects
        .filter((subject) => activePlanConfig?.selectedSubjectIds?.includes(String(subject.id)))
        .sort((a, b) => getSubjectOrderIndex(a) - getSubjectOrderIndex(b) || a.name.localeCompare(b.name))
    }

    return subjects
      .filter((subject) => {
        const planKey = String(subject.planId)
        const planConfig = allPlanConfigs[planKey] || createPlanGradeConfig([String(subject.id)])
        return planConfig.selectedSubjectIds.includes(String(subject.id))
      })
      .sort((a, b) => {
        const planA = plans.find((plan) => String(plan.id) === String(a.planId))?.name || ''
        const planB = plans.find((plan) => String(plan.id) === String(b.planId))?.name || ''
        return planA.localeCompare(planB) || getSubjectOrderIndex(a) - getSubjectOrderIndex(b) || a.name.localeCompare(b.name)
      })
  }, [activePlanConfig?.selectedSubjectIds, activePlanSubjects, allPlanConfigs, plans, selectedPlanId, subjects])

  const proofCardsBySubject = useMemo(() => {
    const map = {}

    importantDates.forEach((item) => {
      if (item.completed) return

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
      const passingScore = parseGradeValue(planConfig.passingScore, gradingStyle)
        ?? parseGradeValue(DEFAULT_PASSING_SCORE, gradingStyle)
        ?? 0

      const subjectEvaluations = planConfig.evaluations
      const parsedScores = subjectEvaluations.map((evaluation) =>
        parseGradeValue(subjectEntry.scores?.[evaluation.id], gradingStyle)
      )
      const filledScores = parsedScores.filter((value) => value !== null)
      const totalEvaluations = subjectEvaluations.length
      const totalScore = filledScores.reduce((sum, value) => sum + value, 0)
      const remainingEvaluations = totalEvaluations - filledScores.length
      const average = totalEvaluations > 0 ? totalScore / totalEvaluations : null
      const totalNeededToPass = Math.max((passingScore * totalEvaluations) - totalScore, 0)
      const missingToPass = remainingEvaluations > 0
        ? totalNeededToPass / remainingEvaluations
        : totalNeededToPass

      return {
        subject,
        linkedPlan,
        planConfig,
        subjectEntry,
        average,
        missingToPass,
        filledScoresCount: filledScores.length,
        remainingEvaluations
      }
    })
  }, [allPlanConfigs, gradebook.entries, plans, visibleSubjects])

  const gradeRowsByPlan = useMemo(() => {
    return gradeRows.reduce((accumulator, row) => {
      const planKey = String(row.subject.planId)
      if (!accumulator[planKey]) accumulator[planKey] = []
      accumulator[planKey].push(row)
      return accumulator
    }, {})
  }, [gradeRows])

  const hiddenPlans = useMemo(() => {
    return plans
      .map((plan) => {
        const planKey = String(plan.id)
        const planSubjects = subjects.filter((subject) => String(subject.planId) === planKey)
        const planConfig =
          allPlanConfigs[planKey] || createPlanGradeConfig(planSubjects.map((subject) => String(subject.id)))
        const selectedPlanSubjects = planSubjects.filter((subject) =>
          planConfig.selectedSubjectIds.includes(String(subject.id))
        )

        return {
          plan,
          planSubjects,
          selectedPlanSubjects
        }
      })
      .filter(({ planSubjects, selectedPlanSubjects }) => planSubjects.length > 0 && selectedPlanSubjects.length === 0)
  }, [allPlanConfigs, plans, subjects])

  useEffect(() => {
    if (!isHiddenPlansOpen) return

    if (hiddenPlans.length === 0) {
      handleCloseHiddenPlans()
      return
    }

    if (
      expandedHiddenPlanId &&
      !hiddenPlans.some(({ plan }) => String(plan.id) === expandedHiddenPlanId)
    ) {
      setExpandedHiddenPlanId(String(hiddenPlans[0].plan.id))
    }
  }, [expandedHiddenPlanId, hiddenPlans, isHiddenPlansOpen])

  const subjectsWithAverage = gradeRows.filter((row) => row.filledScoresCount > 0).length
  const passingRows = gradeRows.filter(
    (row) =>
      row.average !== null &&
      row.average >= (parseGradeValue(row.planConfig.passingScore, gradingStyle) ?? 0)
  ).length
  const pendingProofCards = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    return importantDates.filter((item) => item.dueDate && item.dueDate >= today && !item.completed).length
  }, [importantDates])

  const handlePlanChange = (planId) => {
    setSelectedPlanId((currentPlanId) => (currentPlanId === planId ? '' : planId))
    setNewEvaluationName('')
    setIsConfigOpen(false)
  }

  const handleOpenHiddenPlans = () => {
    setExpandedHiddenPlanId(hiddenPlans[0]?.plan?.id ? String(hiddenPlans[0].plan.id) : '')
    setIsHiddenPlansOpen(true)
  }

  const handleCloseHiddenPlans = () => {
    setIsHiddenPlansOpen(false)
    setExpandedHiddenPlanId('')
  }

  const handleHiddenPlanSubjectToggle = (planId, subjectId) => {
    const planKey = String(planId)
    const subjectKey = String(subjectId)

    updatePlanConfig(planKey, (config) => {
      const isSelected = config.selectedSubjectIds.includes(subjectKey)
      return {
        ...config,
        selectedSubjectIds: isSelected
          ? config.selectedSubjectIds.filter((id) => id !== subjectKey)
          : [...config.selectedSubjectIds, subjectKey],
        subjectOrder: config.subjectOrder?.includes(subjectKey)
          ? config.subjectOrder
          : [...(config.subjectOrder || []), subjectKey]
      }
    })
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
    updatePlanConfig(selectedPlanId, (config) => ({
      ...config,
      passingScore: gradingStyle === 'letter' ? formatLetterInput(value) : formatScoreInput(value)
    }))
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
    if (isLockedEvaluation(evaluationId)) {
      alert('AV1 e AV2 são colunas obrigatórias e não podem ser removidas.')
      return
    }
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
        const nextConfirmedScores = { ...(entry.confirmedScores || {}) }
        delete nextScores[evaluationId]
        delete nextConfirmedScores[evaluationId]
        nextEntries[subjectId] = { ...entry, scores: nextScores, confirmedScores: nextConfirmedScores }
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
          : [...config.selectedSubjectIds, subjectKey],
        subjectOrder: config.subjectOrder?.includes(subjectKey)
          ? config.subjectOrder
          : [...(config.subjectOrder || []), subjectKey]
      }
    })
  }

  const handleSubjectDragStart = (subjectId, planId) => {
    setDraggedSubject({ subjectId: String(subjectId), planId: String(planId) })
    setDragTargetSubjectId(String(subjectId))
  }

  const handleSubjectDragOver = (event, subjectId, planId) => {
    event.preventDefault()
    if (!draggedSubject || draggedSubject.planId !== String(planId)) return
    if (dragTargetSubjectId !== String(subjectId)) {
      setDragTargetSubjectId(String(subjectId))
    }
  }

  const handleSubjectDragEnd = () => {
    setDraggedSubject(null)
    setDragTargetSubjectId('')
  }

  const handleSubjectDrop = (event, targetSubjectId, planId) => {
    event.preventDefault()
    const planKey = String(planId)
    const targetKey = String(targetSubjectId)

    if (!draggedSubject || draggedSubject.planId !== planKey || draggedSubject.subjectId === targetKey) {
      handleSubjectDragEnd()
      return
    }

    const currentOrder = getOrderedSubjectIds(planKey)
    const draggedIndex = currentOrder.indexOf(draggedSubject.subjectId)
    const targetIndex = currentOrder.indexOf(targetKey)

    if (draggedIndex === -1 || targetIndex === -1) {
      handleSubjectDragEnd()
      return
    }

    const nextOrder = [...currentOrder]
    const [movedSubjectId] = nextOrder.splice(draggedIndex, 1)
    nextOrder.splice(targetIndex, 0, movedSubjectId)

    updatePlanConfig(planKey, (config) => ({
      ...config,
      subjectOrder: nextOrder
    }))

    handleSubjectDragEnd()
  }

  const handleScoreChange = (subjectId, evaluationId, value) => {
    updateEntry(subjectId, (entry) => ({
      ...entry,
      scores: {
        ...(entry.scores || {}),
        [evaluationId]: gradingStyle === 'letter' ? formatLetterInput(value) : formatScoreInput(value)
      }
    }))
  }

  const toggleScoreConfirmed = (subjectId, evaluationId) => {
    updateEntry(subjectId, (entry) => {
      const currentValue = entry.scores?.[evaluationId] ?? ''
      if (!String(currentValue).trim()) return entry

      const confirmedScores = {
        ...(entry.confirmedScores || {}),
        [evaluationId]: !entry.confirmedScores?.[evaluationId]
      }

      return {
        ...entry,
        confirmedScores
      }
    })
  }

  const handleGradingStyleChange = (value) => {
    setGradebook((prev) => ({
      ...prev,
      settings: {
        ...(prev.settings || {}),
        gradingStyle: value
      }
    }))
  }

  return (
    <section className="dashboard-content dashboard-content--notes">
      <NotesHeader />

      <section className="summary-grid summary-grid--notas">
        <SummaryCard
          className="summary-card--notas-materias"
          title="Matérias na tabela"
          value={gradeRows.length}
          description={selectedPlan ? `Filtradas em ${selectedPlan.name}` : 'Todas as matérias cadastradas'}
          icon={
            <svg viewBox="0 0 24 24" fill="none" role="img">
              <path d="M5.5 6.5A2.5 2.5 0 0 1 8 4h10.5v14.25A1.75 1.75 0 0 1 16.75 20H8A2.5 2.5 0 0 0 5.5 22V6.5Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
              <path d="M8.5 8.25h7M8.5 11.75h7M8.5 15.25h4.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            </svg>
          }
        />
        <SummaryCard
          className="summary-card--notas-medias"
          title="Médias lançadas"
          value={subjectsWithAverage}
          description="Matérias com pelo menos uma nota informada"
          icon={
            <svg viewBox="0 0 24 24" fill="none" role="img">
              <path d="M5.5 17.5 9.5 13.5l3 3 6-7" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M17.5 9.5H19v1.5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          }
        />
        <SummaryCard
          className="summary-card--notas-aprovadas"
          title="Já atingiram a média"
          value={passingRows}
          description="Matérias atualmente acima da nota de corte"
          icon={
            <svg viewBox="0 0 24 24" fill="none" role="img">
              <path d="m6 12.5 3.5 3.5L18 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" stroke="currentColor" strokeWidth="1.7" />
            </svg>
          }
        />
        <SummaryCard
          className="summary-card--notas-provas"
          title="Provas futuras"
          value={pendingProofCards}
          description="Cards puxados da aba Provas"
          variant="alert"
          icon={
            <svg viewBox="0 0 24 24" fill="none" role="img">
              <path d="M7 4.75h7.75L19.25 9v10.25A2.75 2.75 0 0 1 16.5 22H7.5A2.75 2.75 0 0 1 4.75 19.25v-11.75A2.75 2.75 0 0 1 7.5 4.75Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
              <path d="M14.25 5.25v4.5h4.5M8.5 14h7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            </svg>
          }
        />
      </section>

      <Card className="notes-panel-card">
        <section className="panel-section notes-panel">
          <div className="notes-toolbar">
            <div>
              <h2 className="section-title">Notas por matéria</h2>
              <p className="settings-helper">
                Selecione um plano pelos cards abaixo. A edição da tabela fica concentrada no botão de configurações.
              </p>
            </div>

            <div className="notes-toolbar-controls">
              <button
                type="button"
                className="notes-hidden-plans-trigger"
                onClick={handleOpenHiddenPlans}
                disabled={hiddenPlans.length === 0}
              >
                <span>Planos ocultos</span>
                <span className="notes-hidden-plans-count">{hiddenPlans.length}</span>
              </button>
              <button
                type="button"
                className="notes-settings-trigger"
                onClick={() => setIsConfigOpen(true)}
                aria-label={selectedPlan ? `Abrir configurações de ${selectedPlan.name}` : 'Abrir configurações da tabela'}
                title="Configurações da tabela"
              >
                <GearIcon />
              </button>
            </div>
          </div>

          <div className="notes-plan-cards">
            {plans.map((plan) => {
              const subjectCount = subjects.filter((subject) => String(subject.planId) === String(plan.id)).length
              const isActive = selectedPlanId === String(plan.id)

              return (
                <button
                  key={plan.id}
                  type="button"
                  className={`notes-plan-card${isActive ? ' is-active' : ''}`}
                  onClick={() => handlePlanChange(String(plan.id))}
                >
                  <div className="notes-plan-card-header">
                    <div className="notes-plan-card-title">
                      <span
                        className="plan-color-dot"
                        style={{ '--plan-color': plan.color || defaultPlanColor }}
                        aria-hidden="true"
                      />
                      <h3>{plan.name}</h3>
                    </div>
                  </div>
                  <div className="notes-plan-card-meta">
                    <span className="pill">Matérias: {subjectCount}</span>
                  </div>
                </button>
              )
            })}
          </div>
        </section>
      </Card>

      {isConfigOpen ? (
        <div
          className="plan-modal-overlay"
          role="presentation"
          onClick={() => setIsConfigOpen(false)}
        >
          <div
            className="plan-modal notes-config-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="notes-config-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="notes-config-modal-header">
              <div>
                <h2 id="notes-config-title" className="plan-modal-title">Configurações da tabela</h2>
                <p className="settings-helper">
                  Ajuste configurações gerais e, quando houver um plano selecionado, as configurações específicas dele.
                </p>
              </div>
              <button
                type="button"
                className="modal-close-button"
                onClick={() => setIsConfigOpen(false)}
                aria-label="Fechar configurações"
              >
                ×
              </button>
            </div>

            <div className="notes-config-grid">
              <div className="notes-config-card">
                <div className="notes-config-header">
                  <div>
                    <h3>Configurações gerais</h3>
                    <p>Definem o estilo de avaliação usado em toda a tabela.</p>
                  </div>
                </div>

                <div className="plan-field-group">
                  <label className="plan-field-label" htmlFor="notes-grading-style">Estilo de avaliação</label>
                  <select
                    id="notes-grading-style"
                    className="subject-input"
                    value={gradingStyle}
                    onChange={(event) => handleGradingStyleChange(event.target.value)}
                  >
                    <option value="numeric">Numeric Grading Scale (0-10)</option>
                    <option value="letter">Letter Grading System (A-F)</option>
                  </select>
                </div>
              </div>

              {selectedPlan ? (
                <>
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
                    type="text"
                    inputMode={gradingStyle === 'letter' ? 'text' : 'decimal'}
                    placeholder={gradingStyle === 'letter' ? 'Ex: D' : 'Ex: 6'}
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
                </>
              ) : (
                <div className="notes-config-card">
                  <div className="notes-config-header">
                    <div>
                      <h3>Configurações por plano</h3>
                      <p>Selecione um card de plano para editar nota de corte, avaliações e matérias visíveis.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {isHiddenPlansOpen ? (
        <div
          className="plan-modal-overlay"
          role="presentation"
          onClick={handleCloseHiddenPlans}
        >
          <div
            className="plan-modal notes-hidden-plans-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="notes-hidden-plans-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="notes-config-modal-header">
              <div>
                <h2 id="notes-hidden-plans-title" className="plan-modal-title">Planos ocultos da tabela</h2>
                <p className="settings-helper">
                  Esses planos não aparecem na tela principal porque nenhuma matéria está selecionada para a tabela.
                </p>
              </div>
              <button
                type="button"
                className="modal-close-button"
                onClick={handleCloseHiddenPlans}
                aria-label="Fechar planos ocultos"
              >
                ×
              </button>
            </div>

            {hiddenPlans.length > 0 ? (
              <div className="notes-hidden-plans-list">
                {hiddenPlans.map(({ plan, planSubjects }) => {
                  const planKey = String(plan.id)
                  const isExpanded = expandedHiddenPlanId === planKey

                  return (
                    <article key={plan.id} className="notes-hidden-plan-card">
                      <div className="notes-hidden-plan-header">
                        <div className="notes-plan-card-title">
                          <span
                            className="plan-color-dot"
                            style={{ '--plan-color': plan.color || defaultPlanColor }}
                            aria-hidden="true"
                          />
                          <div className="notes-hidden-plan-copy">
                            <h3>{plan.name}</h3>
                            <p>{planSubjects.length} matéria{planSubjects.length !== 1 ? 's' : ''} disponível{planSubjects.length !== 1 ? 'eis' : ''}</p>
                          </div>
                        </div>

                        <button
                          type="button"
                          className={`notes-hidden-plan-toggle${isExpanded ? ' is-open' : ''}`}
                          onClick={() => setExpandedHiddenPlanId((current) => (current === planKey ? '' : planKey))}
                        >
                          <span>Editar matérias</span>
                          <span className="notes-hidden-plan-toggle-icon" aria-hidden="true">
                            <ChevronDownIcon />
                          </span>
                        </button>
                      </div>

                      {isExpanded ? (
                        <div className="notes-hidden-plan-subjects">
                          {planSubjects.map((subject) => (
                            <label key={subject.id} className="notes-subject-option">
                              <input
                                type="checkbox"
                                checked={Boolean(allPlanConfigs[planKey]?.selectedSubjectIds?.includes(String(subject.id)))}
                                onChange={() => handleHiddenPlanSubjectToggle(plan.id, subject.id)}
                              />
                              <span>{subject.name}</span>
                            </label>
                          ))}
                        </div>
                      ) : null}
                    </article>
                  )
                })}
              </div>
            ) : (
              <p className="empty-message">Todos os planos com matérias já estão visíveis na tabela.</p>
            )}
          </div>
        </div>
      ) : null}

      <Card className="notes-table-card">
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
            selectedPlanId ? (
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
                        <div
                          className={`notes-subject-cell notes-subject-cell-draggable${draggedSubject?.subjectId === String(row.subject.id) ? ' is-dragging' : ''}${dragTargetSubjectId === String(row.subject.id) && draggedSubject?.subjectId !== String(row.subject.id) && draggedSubject?.planId === String(row.subject.planId) ? ' is-drop-target' : ''}`}
                          draggable
                          onDragStart={() => handleSubjectDragStart(row.subject.id, row.subject.planId)}
                          onDragOver={(event) => handleSubjectDragOver(event, row.subject.id, row.subject.planId)}
                          onDrop={(event) => handleSubjectDrop(event, row.subject.id, row.subject.planId)}
                          onDragEnd={handleSubjectDragEnd}
                        >
                          <span className="progress-subject-label">
                            <span className="notes-drag-handle" aria-hidden="true">
                              <DragHandleIcon />
                            </span>
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
                            (item) => normalizeLabel(item.label) === normalizeLabel(evaluation.label)
                          )

                          const scoreValue = evaluationForSubject
                            ? row.subjectEntry.scores?.[evaluationForSubject.id] ?? ''
                            : ''
                          const isScoreConfirmed = evaluationForSubject
                            ? Boolean(row.subjectEntry.confirmedScores?.[evaluationForSubject.id])
                            : false
                          const proofCards = proofCardsBySubject[String(row.subject.id)]?.[
                            normalizeLabel(evaluation.label)
                          ] || []

                          return (
                            <div className={`notes-score-cell${isScoreConfirmed ? ' is-confirmed' : ''}`} key={`${row.subject.id}-${evaluation.id}`}>
                              {evaluationForSubject ? (
                                <>
                                  <div className="notes-score-input-wrap">
                                    <input
                                      className={`subject-input notes-score-input${isScoreConfirmed ? ' is-confirmed' : ''}`}
                                      type="text"
                                      inputMode={gradingStyle === 'letter' ? 'text' : 'decimal'}
                                      placeholder={gradingStyle === 'letter' ? 'A-F' : '0,0'}
                                      value={scoreValue}
                                      disabled={isScoreConfirmed}
                                      onChange={(event) =>
                                        handleScoreChange(row.subject.id, evaluationForSubject.id, event.target.value)
                                      }
                                    />
                                    {String(scoreValue).trim() ? (
                                      <button
                                        type="button"
                                        className={`notes-score-confirm-button${isScoreConfirmed ? ' is-confirmed' : ''}`}
                                        onClick={() => toggleScoreConfirmed(row.subject.id, evaluationForSubject.id)}
                                      >
                                        {isScoreConfirmed ? 'Alterar' : 'Confirmado'}
                                      </button>
                                    ) : null}
                                  </div>
                                </>
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
                          <strong>{formatAverageDisplay(row.average, gradingStyle)}</strong>
                        </div>

                        <div className="notes-metric-cell">
                          <strong className={row.missingToPass > 0 ? 'notes-missing-score' : 'notes-passing-score'}>
                            {formatMissingDisplay(row.missingToPass, row.planConfig.passingScore, gradingStyle)}
                          </strong>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div className="notes-plan-table-list">
                {plans
                  .filter((plan) => (gradeRowsByPlan[String(plan.id)] || []).length > 0)
                  .map((plan) => {
                    const planKey = String(plan.id)
                    const planRows = gradeRowsByPlan[planKey] || []
                    const planConfig = allPlanConfigs[planKey] || createPlanGradeConfig([])
                    const planEvaluations = planConfig.evaluations || DEFAULT_EVALUATIONS

                    return (
                      <section className="notes-plan-table-block" key={plan.id}>
                        <div className="notes-plan-table-heading">
                          <div className="notes-plan-card-title">
                            <span
                              className="plan-color-dot"
                              style={{ '--plan-color': plan.color || defaultPlanColor }}
                              aria-hidden="true"
                            />
                            <h3>{plan.name}</h3>
                          </div>
                          <span className="pill">Matérias: {planRows.length}</span>
                        </div>

                        <div className="notes-table-shell">
                          <div
                            className="notes-table"
                            style={{
                              gridTemplateColumns: `minmax(240px, 1.4fr) repeat(${planEvaluations.length}, minmax(220px, 1fr)) minmax(140px, 0.7fr) minmax(170px, 0.8fr)`
                            }}
                          >
                            <div className="notes-row notes-row-header">
                              <div>Matéria</div>
                              {planEvaluations.map((evaluation) => (
                                <div key={evaluation.id}>{evaluation.label}</div>
                              ))}
                              <div>Média Final</div>
                              <div>Falta para passar</div>
                            </div>

                            {planRows.map((row) => (
                              <div className="notes-row" key={row.subject.id}>
                                <div
                                  className={`notes-subject-cell notes-subject-cell-draggable${draggedSubject?.subjectId === String(row.subject.id) ? ' is-dragging' : ''}${dragTargetSubjectId === String(row.subject.id) && draggedSubject?.subjectId !== String(row.subject.id) && draggedSubject?.planId === String(row.subject.planId) ? ' is-drop-target' : ''}`}
                                  draggable
                                  onDragStart={() => handleSubjectDragStart(row.subject.id, row.subject.planId)}
                                  onDragOver={(event) => handleSubjectDragOver(event, row.subject.id, row.subject.planId)}
                                  onDrop={(event) => handleSubjectDrop(event, row.subject.id, row.subject.planId)}
                                  onDragEnd={handleSubjectDragEnd}
                                >
                                  <span className="progress-subject-label">
                                    <span className="notes-drag-handle" aria-hidden="true">
                                      <DragHandleIcon />
                                    </span>
                                    <span
                                      className="plan-color-dot"
                                      style={{ '--plan-color': plan.color || defaultPlanColor }}
                                      aria-hidden="true"
                                    />
                                    <span className="progress-subject-name">{row.subject.name}</span>
                                  </span>
                                </div>

                                {planEvaluations.map((evaluation) => {
                                  const scoreValue = row.subjectEntry.scores?.[evaluation.id] ?? ''
                                  const isScoreConfirmed = Boolean(row.subjectEntry.confirmedScores?.[evaluation.id])
                                  const proofCards = proofCardsBySubject[String(row.subject.id)]?.[
                                    normalizeLabel(evaluation.label)
                                  ] || []

                                  return (
                                    <div className={`notes-score-cell${isScoreConfirmed ? ' is-confirmed' : ''}`} key={`${row.subject.id}-${evaluation.id}`}>
                                      <div className="notes-score-input-wrap">
                                        <input
                                          className={`subject-input notes-score-input${isScoreConfirmed ? ' is-confirmed' : ''}`}
                                          type="text"
                                          inputMode={gradingStyle === 'letter' ? 'text' : 'decimal'}
                                          placeholder={gradingStyle === 'letter' ? 'A-F' : '0,0'}
                                          value={scoreValue}
                                          disabled={isScoreConfirmed}
                                          onChange={(event) =>
                                            handleScoreChange(row.subject.id, evaluation.id, event.target.value)
                                          }
                                        />
                                        {String(scoreValue).trim() ? (
                                          <button
                                            type="button"
                                            className={`notes-score-confirm-button${isScoreConfirmed ? ' is-confirmed' : ''}`}
                                            onClick={() => toggleScoreConfirmed(row.subject.id, evaluation.id)}
                                          >
                                            {isScoreConfirmed ? 'Alterar' : 'Confirmado'}
                                          </button>
                                        ) : null}
                                      </div>

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
                                  <strong>{formatAverageDisplay(row.average, gradingStyle)}</strong>
                                </div>

                                <div className="notes-metric-cell">
                                  <strong className={row.missingToPass > 0 ? 'notes-missing-score' : 'notes-passing-score'}>
                                    {formatMissingDisplay(row.missingToPass, row.planConfig.passingScore, gradingStyle)}
                                  </strong>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </section>
                    )
                  })}
              </div>
            )
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
