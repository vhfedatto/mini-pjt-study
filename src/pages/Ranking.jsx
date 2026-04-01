import { useEffect, useMemo, useState } from 'react'
import Card from '../components/ui/Card'
import SummaryCard from '../components/ui/SummaryCard'
import Footer from '../components/layout/Footer'

const COMPETITIONS_STORAGE_KEY = 'rankingCompetitions'

function createCompetitionScoreboard(participants) {
  return participants.map((entry) => {
    return {
      userId: entry.id,
      points: 0,
      streak: 0
    }
  })
}

function normalizeCompetition(competition, rankingEntries) {
  const competitionParticipants = rankingEntries.filter(
    (entry) => entry.isYou || competition.participants?.includes(entry.handle)
  )

  const hasValidScoreboard =
    Array.isArray(competition.scoreboard) &&
    competition.scoreboard.length === competitionParticipants.length &&
    competition.scoreboard.every(
      (score) =>
        typeof score.userId === 'string' &&
        typeof score.points === 'number' &&
        typeof score.streak === 'number' &&
        competitionParticipants.some((entry) => entry.id === score.userId)
    )

  if (hasValidScoreboard) {
    return competition
  }

  return {
    ...competition,
    scoreboard: createCompetitionScoreboard(competitionParticipants)
  }
}

function Ranking() {
  const rankingData = useMemo(
    () => [
      { id: 'u-1', name: 'Kaliel Selhorst', handle: '@kaliel', points: 1280, streak: 18, isYou: true },
      { id: 'u-2', name: 'Victor Fedatto', handle: '@vhfedatto', points: 1360, streak: 21, isYou: false },
      { id: 'u-3', name: 'Ana Costa', handle: '@anacosta', points: 1195, streak: 16, isYou: false },
      { id: 'u-4', name: 'Lucas Silva', handle: '@lucass', points: 1040, streak: 12, isYou: false },
      { id: 'u-5', name: 'Mariana Lima', handle: '@marilima', points: 980, streak: 10, isYou: false }
    ],
    []
  )

  const sortedRanking = useMemo(
    () => [...rankingData].sort((firstUser, secondUser) => secondUser.points - firstUser.points),
    [rankingData]
  )

  const yourEntry = sortedRanking.find((entry) => entry.isYou)
  const yourPosition = sortedRanking.findIndex((entry) => entry.isYou) + 1
  const pointsToTop = Math.max((sortedRanking[0]?.points || 0) - (yourEntry?.points || 0), 0)
  const friends = sortedRanking.filter((entry) => !entry.isYou)

  const [isCompetitionFormOpen, setIsCompetitionFormOpen] = useState(false)
  const [selectedCompetitionId, setSelectedCompetitionId] = useState('')
  const [rankingMode, setRankingMode] = useState('general')
  const [competitionStatus, setCompetitionStatus] = useState('')
  const [competitions, setCompetitions] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(COMPETITIONS_STORAGE_KEY) || '[]')
    } catch {
      return []
    }
  })
  const [competitionForm, setCompetitionForm] = useState({
    title: '',
    reward: '',
    deadline: '',
    participantIds: []
  })

  useEffect(() => {
    setCompetitions((prev) => {
      let hasChanges = false

      const normalizedCompetitions = prev.map((competition) => {
        const normalizedCompetition = normalizeCompetition(competition, sortedRanking)

        if (normalizedCompetition !== competition) {
          hasChanges = true
        }

        return normalizedCompetition
      })

      return hasChanges ? normalizedCompetitions : prev
    })
  }, [sortedRanking])

  useEffect(() => {
    localStorage.setItem(COMPETITIONS_STORAGE_KEY, JSON.stringify(competitions))
  }, [competitions])

  useEffect(() => {
    if (!competitions.length) {
      setSelectedCompetitionId('')
      return
    }

    setSelectedCompetitionId((prev) => {
      if (prev && competitions.some((competition) => String(competition.id) === String(prev))) {
        return prev
      }

      return String(competitions[0].id)
    })
  }, [competitions])

  const selectedCompetition = useMemo(
    () => competitions.find((competition) => String(competition.id) === String(selectedCompetitionId)),
    [competitions, selectedCompetitionId]
  )

  const selectedCompetitionRanking = useMemo(() => {
    if (!selectedCompetition) return []

    const competitionParticipants = sortedRanking.filter(
      (entry) => entry.isYou || selectedCompetition.participants.includes(entry.handle)
    )

    const scoreByUserId = new Map(
      (selectedCompetition.scoreboard || []).map((score) => [score.userId, score])
    )

    return competitionParticipants
      .map((entry) => {
        const competitionScore = scoreByUserId.get(entry.id)

        return {
          ...entry,
          points: competitionScore?.points ?? entry.points,
          streak: competitionScore?.streak ?? entry.streak
        }
      })
      .sort((firstUser, secondUser) => secondUser.points - firstUser.points)
  }, [selectedCompetition, sortedRanking])

  function handleCompetitionInputChange(event) {
    const { name, value } = event.target
    setCompetitionForm((prev) => ({
      ...prev,
      [name]: value
    }))
    setCompetitionStatus('')
  }

  function handleToggleParticipant(participantId) {
    setCompetitionForm((prev) => {
      const hasParticipant = prev.participantIds.includes(participantId)
      return {
        ...prev,
        participantIds: hasParticipant
          ? prev.participantIds.filter((id) => id !== participantId)
          : [...prev.participantIds, participantId]
      }
    })
    setCompetitionStatus('')
  }

  function handleCreateCompetition(event) {
    event.preventDefault()

    const titleValue = competitionForm.title.trim()
    const rewardValue = competitionForm.reward.trim()

    if (!titleValue || !rewardValue) {
      setCompetitionStatus('Preencha nome da competicao e premio.')
      return
    }

    if (competitionForm.participantIds.length === 0) {
      setCompetitionStatus('Selecione pelo menos um amigo para competir.')
      return
    }

    const participantHandles = friends
      .filter((friend) => competitionForm.participantIds.includes(friend.id))
      .map((friend) => friend.handle)

    const newCompetitionId = Date.now()
    const competitionParticipants = sortedRanking.filter(
      (entry) => entry.isYou || participantHandles.includes(entry.handle)
    )

    const newCompetition = {
      id: newCompetitionId,
      title: titleValue,
      reward: rewardValue,
      deadline: competitionForm.deadline,
      participants: participantHandles,
      scoreboard: createCompetitionScoreboard(competitionParticipants),
      createdAt: new Date().toISOString()
    }

    setCompetitions((prev) => [newCompetition, ...prev])
    setCompetitionForm({
      title: '',
      reward: '',
      deadline: '',
      participantIds: []
    })
    setCompetitionStatus('Competicao criada com sucesso.')
    setIsCompetitionFormOpen(false)
  }

  function closeCompetitionForm() {
    setIsCompetitionFormOpen(false)
  }

  function handleDeleteCompetition() {
    if (!selectedCompetition) {
      setCompetitionStatus('Selecione uma competição para excluir.')
      return
    }

    const confirmed = window.confirm(`Excluir a competição "${selectedCompetition.title}"?`)
    if (!confirmed) return

    setCompetitions((prev) => prev.filter((competition) => competition.id !== selectedCompetition.id))
    setCompetitionStatus('Competição excluída com sucesso.')
  }

  function getPositionMedal(position) {
    if (position === 1) return '🥇'
    if (position === 2) return '🥈'
    if (position === 3) return '🥉'
    return `#${position}`
  }

  return (
    <section className="dashboard-content">
      <section className="summary-grid">
        <SummaryCard
          title="Sua colocação"
          value={`${yourPosition || '-'}º`}
          description="Posição atual no ranking"
        />
        <SummaryCard
          title="Seus pontos"
          value={yourEntry?.points || 0}
          description="Pontuação acumulada"
        />
        <SummaryCard
          title="Sequência"
          value={`${yourEntry?.streak || 0} dias`}
          description="Dias seguidos estudando"
        />
        <SummaryCard
          title="Falta para o topo"
          value={pointsToTop}
          description="Pontos para alcançar o 1º lugar"
          variant="alert"
        />
      </section>

      <Card>
        <section className="panel-section">
          <div className="ranking-toolbar">
            <h2 className="section-title">Ranking de amigos</h2>
          </div>

          {competitionStatus ? <p className="settings-status">{competitionStatus}</p> : null}

          <p className="empty-message">
            {competitions.length
              ? `${competitions.length} competição(ões) criada(s). Selecione uma abaixo para ver o ranking separado.`
              : 'Crie uma competição para gerar um ranking separado.'}
          </p>

          <div className="ranking-mode-switch" role="tablist" aria-label="Tipo de ranking">
            <button
              type="button"
              role="tab"
              aria-selected={rankingMode === 'general'}
              className={`ranking-mode-button ranking-mode-button-general${rankingMode === 'general' ? ' is-active' : ''}`}
              onClick={() => setRankingMode('general')}
            >
              📊 Ranking geral: {sortedRanking.length}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={rankingMode === 'competition'}
              className={`ranking-mode-button ranking-mode-button-competition${rankingMode === 'competition' ? ' is-active' : ''}`}
              onClick={() => setRankingMode('competition')}
            >
              🏁 Competição: {selectedCompetitionRanking.length}
            </button>
          </div>

          {rankingMode === 'general' ? (
            <div className="ranking-board" role="table" aria-label="Ranking de amigos por pontuação">
              <div className="ranking-row ranking-row-header" role="row">
                <div role="columnheader">Posição</div>
                <div role="columnheader">Nome</div>
                <div role="columnheader">Pontos</div>
                <div role="columnheader">Sequência</div>
              </div>

              {sortedRanking.map((entry, index) => {
                const position = index + 1
                return (
                  <div
                    className={`ranking-row${entry.isYou ? ' ranking-row-you' : ''}`}
                    role="row"
                    key={entry.id}
                  >
                    <div role="cell" className="ranking-position">
                      {getPositionMedal(position)}
                    </div>
                    <div role="cell" className="ranking-name-cell">
                      <strong>{entry.name}</strong>
                      <span>{entry.handle}</span>
                    </div>
                    <div role="cell">{entry.points}</div>
                    <div role="cell">{entry.streak} dias</div>
                  </div>
                )
              })}
            </div>
          ) : null}

          {rankingMode === 'competition' ? (
            <section className="ranking-separated-section">
              <div className="ranking-select-row">
                <h3>Ranking da competição</h3>

                <div className="ranking-select-actions">
                  {competitions.length ? (
                    <select
                      className="plan-input ranking-select"
                      value={selectedCompetitionId}
                      onChange={(event) => setSelectedCompetitionId(event.target.value)}
                    >
                      {competitions.map((competition) => (
                        <option key={competition.id} value={String(competition.id)}>
                          {competition.title}
                        </option>
                      ))}
                    </select>
                  ) : null}

                  <button
                    type="button"
                    className="subject-add-button"
                    onClick={() => setIsCompetitionFormOpen(true)}
                  >
                    Criar competicao
                  </button>

                  {competitions.length ? (
                    <button
                      type="button"
                      className="plan-action-btn plan-action-btn-danger"
                      onClick={handleDeleteCompetition}
                    >
                      Excluir competicao
                    </button>
                  ) : null}
                </div>
              </div>

              {!competitions.length ? (
                <p className="empty-message">
                  Ainda nao existe competição criada para gerar um ranking separado.
                </p>
              ) : (
                <div className="ranking-board" role="table" aria-label="Ranking da competição selecionada">
                  <div className="ranking-row ranking-row-header" role="row">
                    <div role="columnheader">Posição</div>
                    <div role="columnheader">Nome</div>
                    <div role="columnheader">Pontos</div>
                    <div role="columnheader">Sequência</div>
                  </div>

                  {selectedCompetitionRanking.map((entry, index) => {
                    const position = index + 1
                    return (
                      <div
                        className={`ranking-row${entry.isYou ? ' ranking-row-you' : ''}`}
                        role="row"
                        key={`competition-${entry.id}`}
                      >
                        <div role="cell" className="ranking-position">
                          {getPositionMedal(position)}
                        </div>
                        <div role="cell" className="ranking-name-cell">
                          <strong>{entry.name}</strong>
                          <span>{entry.handle}</span>
                        </div>
                        <div role="cell">{entry.points}</div>
                        <div role="cell">{entry.streak} dias</div>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>
          ) : null}
        </section>
      </Card>

      {isCompetitionFormOpen ? (
        <div
          className="plan-modal-overlay"
          role="presentation"
          onClick={closeCompetitionForm}
        >
          <section
            className="plan-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="competition-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="competition-modal-title" className="plan-modal-title">
              Criar competicao
            </h2>

            <form className="ranking-competition-form" onSubmit={handleCreateCompetition}>
              <div className="plan-field-group">
                <label className="plan-field-label" htmlFor="competition-title">
                  Nome da competicao
                </label>
                <input
                  id="competition-title"
                  name="title"
                  className="plan-input"
                  placeholder="Ex.: Sprint de revisao"
                  value={competitionForm.title}
                  onChange={handleCompetitionInputChange}
                  required
                />
              </div>

              <div className="plan-field-group">
                <label className="plan-field-label" htmlFor="competition-reward">
                  Premio
                </label>
                <input
                  id="competition-reward"
                  name="reward"
                  className="plan-input"
                  placeholder="Ex.: Pizza no fim de semana"
                  value={competitionForm.reward}
                  onChange={handleCompetitionInputChange}
                  required
                />
              </div>

              <div className="plan-field-group">
                <label className="plan-field-label" htmlFor="competition-deadline">
                  Prazo final
                </label>
                <input
                  id="competition-deadline"
                  name="deadline"
                  type="date"
                  className="plan-input"
                  value={competitionForm.deadline}
                  onChange={handleCompetitionInputChange}
                />
              </div>

              <fieldset className="ranking-participants">
                <legend className="plan-field-label">Participantes</legend>
                <div className="ranking-participant-list">
                  {friends.map((friend) => (
                    <label className="ranking-participant-item" key={friend.id}>
                      <input
                        type="checkbox"
                        checked={competitionForm.participantIds.includes(friend.id)}
                        onChange={() => handleToggleParticipant(friend.id)}
                      />
                      <span>
                        {friend.name} <small>{friend.handle}</small>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <div className="ranking-modal-actions">
                <button type="button" className="header-button header-button-secondary" onClick={closeCompetitionForm}>
                  Cancelar
                </button>
                <button type="submit" className="subject-add-button ranking-create-button">
                  Salvar competicao
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}

      <Footer />
    </section>
  )
}

export default Ranking