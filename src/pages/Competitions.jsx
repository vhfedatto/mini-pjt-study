import { useState } from 'react'
import Card from '../components/ui/Card'
import SummaryCard from '../components/ui/SummaryCard'
import Footer from '../components/layout/Footer'

const COMPETITIONS_STORAGE_KEY = 'rankingCompetitions'

function Competitions() {
  const [competitions, setCompetitions] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(COMPETITIONS_STORAGE_KEY) || '[]')
    } catch {
      return []
    }
  })

  const [statusMessage, setStatusMessage] = useState('')

  function handleDeleteCompetition(competitionId) {
    setCompetitions((prev) => {
      const updatedCompetitions = prev.filter((competition) => competition.id !== competitionId)
      localStorage.setItem(COMPETITIONS_STORAGE_KEY, JSON.stringify(updatedCompetitions))
      return updatedCompetitions
    })

    setStatusMessage('Competição excluída com sucesso.')
  }

  const competitionsWithDeadline = competitions.filter((competition) => competition.deadline).length

  return (
    <section className="dashboard-content">
      <section className="summary-grid">
        <SummaryCard
          title="Competições criadas"
          value={competitions.length}
          description="Total salvo no seu navegador"
        />
        <SummaryCard
          title="Com prazo definido"
          value={competitionsWithDeadline}
          description="Competições com data final"
        />
      </section>

      <Card>
        <section className="panel-section">
          <h2 className="section-title">Suas competições</h2>
          {statusMessage ? <p className="settings-status">{statusMessage}</p> : null}

          {competitions.length === 0 ? (
            <p className="empty-message">
              Você ainda não criou nenhuma competição. Acesse o Ranking para criar a primeira.
            </p>
          ) : (
            <div className="ranking-competition-list">
              {competitions.map((competition) => (
                <article className="ranking-competition-card" key={competition.id}>
                  <h3>{competition.title}</h3>
                  <p>
                    <strong>Prêmio:</strong> {competition.reward}
                  </p>
                  <p>
                    <strong>Participantes:</strong> {competition.participants.join(', ')}
                  </p>
                  <p>
                    <strong>Prazo:</strong> {competition.deadline || 'Sem data definida'}
                  </p>
                  <div className="ranking-competition-actions">
                    <button
                      type="button"
                      className="plan-action-btn plan-action-btn-danger"
                      onClick={() => handleDeleteCompetition(competition.id)}
                    >
                      Excluir competição
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </Card>

      <Footer />
    </section>
  )
}

export default Competitions