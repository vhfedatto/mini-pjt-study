import { useRef, useState } from 'react'
import Footer from '../components/layout/Footer'
import Card from '../components/ui/Card'

const EXPORT_STORAGE_KEYS = [
  'plans',
  'studyPlans',
  'subjects',
  'tasks',
  'agendaItems',
  'importantDates',
  'flashcards'
]

function Settings() {
  const importInputRef = useRef(null)
  const [statusMessage, setStatusMessage] = useState('')

  function handleExport() {
    const payload = {
      exportedAt: new Date().toISOString(),
      app: 'study-dashboard',
      version: 1,
      data: Object.fromEntries(EXPORT_STORAGE_KEYS.map((key) => [key, localStorage.getItem(key)]))
    }

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
        if (!parsed || typeof parsed !== 'object' || !parsed.data || typeof parsed.data !== 'object') {
          throw new Error('Formato invalido')
        }

        EXPORT_STORAGE_KEYS.forEach((key) => {
          const value = parsed.data[key]
          if (typeof value === 'string') {
            localStorage.setItem(key, value)
          } else {
            localStorage.removeItem(key)
          }
        })

        const syncedPlans = parsed.data.plans ?? parsed.data.studyPlans
        if (typeof syncedPlans === 'string') {
          localStorage.setItem('plans', syncedPlans)
          localStorage.setItem('studyPlans', syncedPlans)
        }

        globalThis.dispatchEvent(new Event('storage'))
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
              <p>Planos, matérias, tarefas, eventos da agenda, provas e flashcards.</p>
            </article>
            <article className="settings-info-card">
              <h3>Como importar</h3>
              <p>Escolha um arquivo JSON exportado pelo StudyDash. Os dados atuais deste navegador serão substituídos.</p>
            </article>
          </div>

          {statusMessage ? <p className="settings-status">{statusMessage}</p> : null}
        </section>
      </Card>

      <Footer />
    </section>
  )
}

export default Settings
