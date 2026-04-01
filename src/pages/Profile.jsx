import { useMemo } from 'react'
import Card from '../components/ui/Card'
import Footer from '../components/layout/Footer'

function Profile() {
  const storedUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('studydash-user') || 'null')
    } catch {
      return null
    }
  }, [])

  const profile = {
    name: storedUser?.name || 'Kaliel Selhorst',
    username: storedUser?.email ? `@${storedUser.email.split('@')[0]}` : '@kaliel',
    role: storedUser?.courseOrSchool
      ? `${storedUser.courseOrSchool} • ${storedUser.educationLevel || 'Estudante'}`
      : 'Estudante de ADS',
    email: storedUser?.email || 'kaliel@example.com',
    educationLevel: storedUser?.educationLevel || 'Graduacao',
    courseOrSchool: storedUser?.courseOrSchool || 'Analise e Desenvolvimento de Sistemas',
    goal: 'Concluir as trilhas da semana com consistencia e revisar flashcards diariamente.'
  }

  const highlights = [
    { label: 'Dias de foco', value: '18' },
    { label: 'Metas da semana', value: '7/10' },
    { label: 'Revisoes feitas', value: '42' }
  ]

  const interests = storedUser?.interests?.length
    ? storedUser.interests
    : ['Front-end', 'JavaScript', 'UX', 'Banco de dados', 'IA aplicada']

  return (
    <section className="dashboard-content">
      <Card>
        <section className="panel-section profile-panel">
          <div className="profile-hero">
            <div className="profile-avatar" aria-hidden="true">
              KS
            </div>

            <div className="profile-hero-content">
              <p className="profile-label">Seu perfil</p>
              <div className="profile-title-row">
                <h2 className="section-title profile-title">{profile.name}</h2>
                <p className="profile-handle">{profile.username}</p>
              </div>
              <p className="profile-role">{profile.role}</p>
            </div>
          </div>

          <p className="profile-goal">{profile.goal}</p>

          <div className="profile-highlight-grid">
            {highlights.map((item) => (
              <article className="profile-highlight-card" key={item.label}>
                <p>{item.label}</p>
                <strong>{item.value}</strong>
              </article>
            ))}
          </div>

          <div className="profile-details-grid">
            <article className="profile-details-card">
              <h3>Informacoes basicas</h3>
              <ul>
                <li>
                  <span>Email</span>
                  <strong>{profile.email}</strong>
                </li>
                <li>
                  <span>Escolaridade</span>
                  <strong>{profile.educationLevel}</strong>
                </li>
                <li>
                  <span>{profile.educationLevel === 'Ensino fundamental' || profile.educationLevel === 'Ensino medio' ? 'Escola' : 'Curso'}</span>
                  <strong>{profile.courseOrSchool}</strong>
                </li>
              </ul>
            </article>

            <article className="profile-details-card">
              <h3>Interesses</h3>
              <div className="profile-tag-list">
                {interests.map((tag) => (
                  <span className="profile-tag" key={tag}>
                    {tag}
                  </span>
                ))}
              </div>
            </article>
          </div>
        </section>
      </Card>

      <Footer />
    </section>
  )
}

export default Profile