import { useRef, useState } from 'react'
import Footer from '../components/layout/Footer'
import Card from '../components/ui/Card'

const BACKUP_STORAGE_KEYS = [
  'plans',
  'studyPlans',
  'subjects',
  'tasks',
  'agendaItems',
  'importantDates',
  'flashcards',
  'question-notebooks',
  'rankingCompetitions',
  'studydash-user',
  'studydash-password',
  'studydash-session',
  'theme',
  'question-training-resume',
  'question-training-answer-history-reset-v1'
]

function readParsedStorage(key, fallback) {
  const stored = localStorage.getItem(key)
  if (stored === null) return fallback

  try {
    return JSON.parse(stored)
  } catch {
    return stored
  }
}

function buildProgressSnapshot({ plans, subjects, tasks, flashcards, notebooks, agendaItems, importantDates }) {
  const totalTasks = tasks.length
  const archivedTasks = tasks.filter((task) => task.archived).length
  const completedTasks = tasks.filter((task) => task.completed).length
  const pendingTasks = totalTasks - completedTasks
  const progressPercent = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100)

  const progressBySubject = subjects.map((subject) => {
    const subjectTasks = tasks.filter((task) => task.subjectId === subject.id)
    const linkedPlan = plans.find((plan) => plan.id === subject.planId)
    const subjectCompleted = subjectTasks.filter((task) => task.completed).length

    return {
      subjectId: subject.id,
      subjectName: subject.name,
      planId: subject.planId ?? null,
      planName: linkedPlan?.name || 'Plano sem nome',
      totalTasks: subjectTasks.length,
      completedTasks: subjectCompleted,
      pendingTasks: subjectTasks.length - subjectCompleted,
      archivedTasks: subjectTasks.filter((task) => task.archived).length,
      progressPercent: subjectTasks.length === 0 ? 0 : Math.round((subjectCompleted / subjectTasks.length) * 100)
    }
  })

  return {
    generatedAt: new Date().toISOString(),
    totals: {
      plans: plans.length,
      subjects: subjects.length,
      tasks: totalTasks,
      archivedTasks,
      completedTasks,
      pendingTasks,
      progressPercent,
      flashcards: flashcards.length,
      flashcardDecks: new Set(flashcards.map((card) => card.deckId)).size,
      notebooks: notebooks.length,
      notebookQuestions: notebooks.reduce((total, notebook) => total + (notebook.questions?.length || 0), 0),
      agendaItems: agendaItems.length,
      importantDates: importantDates.length
    },
    bySubject: progressBySubject
  }
}

function createBackupPayload() {
  const plans = readParsedStorage('plans', readParsedStorage('studyPlans', []))
  const studyPlans = readParsedStorage('studyPlans', plans)
  const subjects = readParsedStorage('subjects', [])
  const tasks = readParsedStorage('tasks', [])
  const agendaItems = readParsedStorage('agendaItems', [])
  const importantDates = readParsedStorage('importantDates', [])
  const flashcards = readParsedStorage('flashcards', [])
  const notebooks = readParsedStorage('question-notebooks', [])
  const competitions = readParsedStorage('rankingCompetitions', [])
  const user = readParsedStorage('studydash-user', null)
  const password = localStorage.getItem('studydash-password')
  const session = localStorage.getItem('studydash-session')
  const theme = localStorage.getItem('theme')

  return {
    exportedAt: new Date().toISOString(),
    app: 'study-dashboard',
    version: 3,
    rawStorage: Object.fromEntries(BACKUP_STORAGE_KEYS.map((key) => [key, localStorage.getItem(key)])),
    data: {
      profile: {
        user,
        password,
        session,
        theme
      },
      plans,
      studyPlans,
      subjects,
      tasks,
      flashcards,
      notebooks,
      agendaItems,
      importantDates,
      competitions,
      progress: buildProgressSnapshot({
        plans: Array.isArray(plans) ? plans : [],
        subjects: Array.isArray(subjects) ? subjects : [],
        tasks: Array.isArray(tasks) ? tasks : [],
        flashcards: Array.isArray(flashcards) ? flashcards : [],
        notebooks: Array.isArray(notebooks) ? notebooks : [],
        agendaItems: Array.isArray(agendaItems) ? agendaItems : [],
        importantDates: Array.isArray(importantDates) ? importantDates : []
      })
    }
  }
}

function Settings({ onLogout }) {
  const importInputRef = useRef(null)
  const [statusMessage, setStatusMessage] = useState('')
  const [passwordStatus, setPasswordStatus] = useState('')
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  function handlePasswordInputChange(event) {
    const { name, value } = event.target
    setPasswordForm((prev) => ({
      ...prev,
      [name]: value
    }))
    setPasswordStatus('')
  }

  function handleChangePassword(event) {
    event.preventDefault()

    const currentPasswordValue = passwordForm.currentPassword.trim()
    const newPasswordValue = passwordForm.newPassword.trim()
    const confirmPasswordValue = passwordForm.confirmPassword.trim()
    const storedPassword = localStorage.getItem('studydash-password')

    if (newPasswordValue.length < 6) {
      setPasswordStatus('A nova senha precisa ter pelo menos 6 caracteres.')
      return
    }

    if (newPasswordValue !== confirmPasswordValue) {
      setPasswordStatus('A confirmacao nao confere com a nova senha.')
      return
    }

    if (storedPassword && currentPasswordValue !== storedPassword) {
      setPasswordStatus('A senha atual informada esta incorreta.')
      return
    }

    localStorage.setItem('studydash-password', newPasswordValue)
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    })
    setPasswordStatus(storedPassword ? 'Senha alterada com sucesso.' : 'Senha cadastrada com sucesso.')
  }

  function handleExport() {
    const payload = createBackupPayload()

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `studydash-backup-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(url)
    setStatusMessage('Backup exportado com sucesso.')
  }

  function handleOpenImport() {
    importInputRef.current?.click()
  }

  function handleImport(event) {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || '{}'))
        const rawStorage =
          parsed && typeof parsed === 'object' && parsed.rawStorage && typeof parsed.rawStorage === 'object'
            ? parsed.rawStorage
            : parsed && typeof parsed === 'object' && parsed.data && typeof parsed.data === 'object'
              ? parsed.data
              : null

        if (!rawStorage) {
          throw new Error('Formato invalido')
        }

        BACKUP_STORAGE_KEYS.forEach((key) => {
          const value = rawStorage[key]
          if (typeof value === 'string') {
            localStorage.setItem(key, value)
          } else {
            localStorage.removeItem(key)
          }
        })

        const syncedPlans = rawStorage.plans ?? rawStorage.studyPlans
        if (typeof syncedPlans === 'string') {
          localStorage.setItem('plans', syncedPlans)
          localStorage.setItem('studyPlans', syncedPlans)
        }

        globalThis.dispatchEvent(new Event('storage'))
        globalThis.dispatchEvent(new Event('study-plans-updated'))
        globalThis.dispatchEvent(new Event('important-dates-updated'))
        setStatusMessage('Backup importado com sucesso. Navegue pelas abas para ver os dados atualizados.')
      } catch {
        setStatusMessage('Nao consegui importar este arquivo. Verifique se ele foi exportado pelo StudyDash.')
      } finally {
        event.target.value = ''
      }
    }

    reader.readAsText(file)
  }

  function handleLogout() {
    onLogout?.()
  }

  return (
    <section className="dashboard-content">
      <Card>
        <section className="panel-section settings-panel">
          <div>
            <h2 className="section-title">Configurações</h2>
            <p className="settings-helper">
              Exporte um backup completo dos seus dados ou importe um arquivo JSON para continuar em outro computador.
            </p>
          </div>

          <div className="settings-actions">
            <button type="button" className="subject-add-button" onClick={handleExport}>
              Exportar backup JSON
            </button>
            <button type="button" className="header-button header-button-secondary" onClick={handleOpenImport}>
              Importar backup JSON
            </button>
          </div>

          <input
            ref={importInputRef}
            type="file"
            accept="application/json"
            className="settings-hidden-input"
            onChange={handleImport}
          />

          <div className="settings-card-grid">
            <article className="settings-info-card">
              <h3>O que entra no backup</h3>
              <p>Cadernos com questões, tentativas, estatísticas, retomada de treino, flashcards, perfil, senha local, sessão, matérias, tarefas, progresso, agenda, provas, competições e preferências.</p>
            </article>
            <article className="settings-info-card">
              <h3>Como importar</h3>
              <p>Escolha um arquivo JSON exportado pelo StudyDash. Os dados atuais deste navegador serão substituídos.</p>
            </article>
          </div>

          <section className="settings-password-section" aria-labelledby="change-password-title">
            <div>
              <h3 id="change-password-title">Alterar senha</h3>
              <p className="settings-helper">
                Defina uma senha local para proteger o acesso neste navegador.
              </p>
            </div>

            <form className="settings-password-form" onSubmit={handleChangePassword}>
              <div className="plan-field-group settings-password-field">
                <label className="plan-field-label" htmlFor="currentPassword">
                  Senha atual
                </label>
                <input
                  id="currentPassword"
                  name="currentPassword"
                  type="password"
                  className="plan-input"
                  autoComplete="current-password"
                  placeholder="Digite sua senha atual"
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordInputChange}
                />
              </div>

              <div className="plan-field-group settings-password-field">
                <label className="plan-field-label" htmlFor="newPassword">
                  Nova senha
                </label>
                <input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  className="plan-input"
                  autoComplete="new-password"
                  placeholder="Minimo de 6 caracteres"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordInputChange}
                  required
                />
              </div>

              <div className="plan-field-group settings-password-field">
                <label className="plan-field-label" htmlFor="confirmPassword">
                  Confirmar nova senha
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  className="plan-input"
                  autoComplete="new-password"
                  placeholder="Repita a nova senha"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordInputChange}
                  required
                />
              </div>

              <button type="submit" className="subject-add-button settings-password-submit">
                Salvar nova senha
              </button>
            </form>

            {passwordStatus ? <p className="settings-status">{passwordStatus}</p> : null}
          </section>

          <section className="settings-password-section" aria-labelledby="session-title">
            <div>
              <h3 id="session-title">Sessão</h3>
              <p className="settings-helper">
                Encerre sua sessão atual e volte para a tela de login.
              </p>
            </div>

            <div className="settings-actions">
              <button
                type="button"
                className="plan-action-btn plan-action-btn-danger"
                onClick={handleLogout}
              >
                Sair
              </button>
            </div>
          </section>

          {statusMessage ? <p className="settings-status">{statusMessage}</p> : null}
        </section>
      </Card>

      <Footer />
    </section>
  )
}

export default Settings
