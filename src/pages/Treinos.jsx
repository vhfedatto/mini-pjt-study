import { useState } from 'react'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import Flashcards from './Flashcards'
import QuestionNotebooks from '../components/study/QuestionNotebooks'

const TRAINING_OPTIONS = [
  {
    key: 'notebooks',
    title: 'Cadernos de Questões',
    description: 'Crie cadernos, organize suas questões e deixe o treino pronto para a próxima etapa.'
  },
  {
    key: 'flashcards',
    title: 'Flashcards',
    description: 'Mantenha o fluxo atual de geração e revisão dos cards exatamente como já funciona hoje.'
  }
]

function Treinos() {
  const [activeMode, setActiveMode] = useState('notebooks')

  return (
    <section className="dashboard-content">
      <Header />

      <section className="training-hero">
        <div>
          <span className="training-hero-eyebrow">Treinos</span>
          <h1 className="training-hero-title">Escolha como você quer estudar</h1>
          <p className="training-hero-copy">
            Use cadernos de questões para montar uma base própria ou siga com os flashcards no formato já existente.
          </p>
        </div>

        <div className="training-mode-grid">
          {TRAINING_OPTIONS.map((option) => (
            <button
              key={option.key}
              type="button"
              className={`training-mode-card${activeMode === option.key ? ' is-active' : ''}`}
              onClick={() => setActiveMode(option.key)}
            >
              <span className="training-mode-label">{option.title}</span>
              <p>{option.description}</p>
            </button>
          ))}
        </div>
      </section>

      {activeMode === 'notebooks' ? <QuestionNotebooks /> : <Flashcards embedded />}

      <Footer />
    </section>
  )
}

export default Treinos
