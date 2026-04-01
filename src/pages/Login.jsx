import { useState } from 'react'

const USER_KEY = 'studydash-user'
const PASSWORD_KEY = 'studydash-password'
const SESSION_KEY = 'studydash-session'

const EDUCATION_OPTIONS = [
  'Ensino fundamental',
  'Ensino medio',
  'Tecnico',
  'Graduacao',
  'Pos-graduacao'
]

function Login({ onLoginSuccess }) {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({
    name: '',
    email: '',
    interests: '',
    educationLevel: '',
    courseOrSchool: '',
    password: '',
    confirmPassword: ''
  })
  const [message, setMessage] = useState('')

  const courseOrSchoolLabel =
    form.educationLevel === 'Ensino fundamental' || form.educationLevel === 'Ensino medio'
      ? 'Escola'
      : 'Curso'

  function handleInputChange(event) {
    const { name, value } = event.target
    setForm((prev) => ({
      ...prev,
      [name]: value
    }))
    setMessage('')
  }

  function handleSwitchMode(nextMode) {
    setMode(nextMode)
    setMessage('')
  }

  function handleSubmit(event) {
    event.preventDefault()

    const emailValue = form.email.trim().toLowerCase()
    const passwordValue = form.password.trim()

    if (!emailValue || !passwordValue) {
      setMessage('Preencha e-mail e senha.')
      return
    }

    if (mode === 'register') {
      const nameValue = form.name.trim()
      const interestsValue = form.interests
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
      const confirmValue = form.confirmPassword.trim()
      const educationLevelValue = form.educationLevel.trim()
      const courseOrSchoolValue = form.courseOrSchool.trim()

      if (!nameValue) {
        setMessage('Informe seu nome para criar a conta.')
        return
      }

      if (!interestsValue.length) {
        setMessage('Informe pelo menos um interesse.')
        return
      }

      if (!educationLevelValue) {
        setMessage('Selecione sua escolaridade.')
        return
      }

      if (!courseOrSchoolValue) {
        setMessage(`Informe seu ${courseOrSchoolLabel.toLowerCase()}.`)
        return
      }

      if (passwordValue.length < 6) {
        setMessage('A senha deve ter no minimo 6 caracteres.')
        return
      }

      if (passwordValue !== confirmValue) {
        setMessage('A confirmacao da senha nao confere.')
        return
      }

      const user = {
        name: nameValue,
        email: emailValue,
        interests: interestsValue,
        educationLevel: educationLevelValue,
        courseOrSchool: courseOrSchoolValue,
        createdAt: new Date().toISOString()
      }

      localStorage.setItem(USER_KEY, JSON.stringify(user))
      localStorage.setItem(PASSWORD_KEY, passwordValue)
      localStorage.setItem(SESSION_KEY, 'authenticated')
      onLoginSuccess?.()
      return
    }

    const storedPassword = localStorage.getItem(PASSWORD_KEY)
    const storedUser = JSON.parse(localStorage.getItem(USER_KEY) || 'null')

    if (!storedPassword || !storedUser) {
      setMessage('Nenhuma conta encontrada. Clique em Criar conta.')
      return
    }

    if (storedUser.email !== emailValue || storedPassword !== passwordValue) {
      setMessage('E-mail ou senha invalidos.')
      return
    }

    localStorage.setItem(SESSION_KEY, 'authenticated')
    onLoginSuccess?.()
  }

  return (
    <main className="login-shell">
      <section className="login-card">
        <header className="login-header">
          <h1>StudyDash</h1>
          <p>Entre para acompanhar seus estudos, ranking e competicoes.</p>
        </header>

        <div className="login-mode-switch" role="tablist" aria-label="Modo de autenticacao">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'login'}
            className={`login-mode-btn${mode === 'login' ? ' is-active' : ''}`}
            onClick={() => handleSwitchMode('login')}
          >
            Entrar
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'register'}
            className={`login-mode-btn${mode === 'register' ? ' is-active' : ''}`}
            onClick={() => handleSwitchMode('register')}
          >
            Criar conta
          </button>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {mode === 'register' ? (
            <>
              <div className="plan-field-group">
                <label className="plan-field-label" htmlFor="login-name">
                  Nome
                </label>
                <input
                  id="login-name"
                  name="name"
                  className="plan-input"
                  placeholder="Seu nome"
                  value={form.name}
                  onChange={handleInputChange}
                />
              </div>

              <div className="plan-field-group">
                <label className="plan-field-label" htmlFor="login-interests">
                  Interesses
                </label>
                <input
                  id="login-interests"
                  name="interests"
                  className="plan-input"
                  placeholder="Ex.: Front-end, UX, JavaScript"
                  value={form.interests}
                  onChange={handleInputChange}
                />
                <p className="login-field-helper">Separe os interesses por virgula.</p>
              </div>

              <div className="plan-field-group">
                <label className="plan-field-label" htmlFor="login-education-level">
                  Escolaridade
                </label>
                <select
                  id="login-education-level"
                  name="educationLevel"
                  className="plan-input"
                  value={form.educationLevel}
                  onChange={handleInputChange}
                >
                  <option value="">Selecione</option>
                  {EDUCATION_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div className="plan-field-group">
                <label className="plan-field-label" htmlFor="login-course-or-school">
                  {courseOrSchoolLabel}
                </label>
                <input
                  id="login-course-or-school"
                  name="courseOrSchool"
                  className="plan-input"
                  placeholder={courseOrSchoolLabel === 'Escola' ? 'Nome da sua escola' : 'Nome do seu curso'}
                  value={form.courseOrSchool}
                  onChange={handleInputChange}
                />
              </div>
            </>
          ) : null}

          <div className="plan-field-group">
            <label className="plan-field-label" htmlFor="login-email">
              E-mail
            </label>
            <input
              id="login-email"
              name="email"
              type="email"
              className="plan-input"
              placeholder="voce@email.com"
              value={form.email}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="plan-field-group">
            <label className="plan-field-label" htmlFor="login-password">
              Senha
            </label>
            <input
              id="login-password"
              name="password"
              type="password"
              className="plan-input"
              placeholder="Sua senha"
              value={form.password}
              onChange={handleInputChange}
              required
            />
          </div>

          {mode === 'register' ? (
            <div className="plan-field-group">
              <label className="plan-field-label" htmlFor="login-confirm-password">
                Confirmar senha
              </label>
              <input
                id="login-confirm-password"
                name="confirmPassword"
                type="password"
                className="plan-input"
                placeholder="Repita a senha"
                value={form.confirmPassword}
                onChange={handleInputChange}
                required
              />
            </div>
          ) : null}

          {message ? <p className="login-message">{message}</p> : null}

          <button type="submit" className="subject-add-button login-submit">
            {mode === 'login' ? 'Entrar' : 'Criar e entrar'}
          </button>
        </form>
      </section>
    </main>
  )
}

export default Login