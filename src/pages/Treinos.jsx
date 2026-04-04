import { useState } from 'react'
import Footer from '../components/layout/Footer'
import Flashcards from './Flashcards'
import QuestionNotebooks from '../components/study/QuestionNotebooks'

const TRAINING_OPTIONS = [
  {
    key: 'notebooks',
    title: 'Estante de Cadernos'
  },
  {
    key: 'flashcards',
    title: 'Baralhos de Flashcards'
  }
]

function Treinos() {
  const [activeMode, setActiveMode] = useState('notebooks')

  return (
    <section className="dashboard-content">
      <section className="training-tabs">
        <div className="training-tabs-list">
          {TRAINING_OPTIONS.map((option) => (
            <button
              key={option.key}
              type="button"
              className={`training-tab${activeMode === option.key ? ' is-active' : ''}`}
              onClick={() => setActiveMode(option.key)}
            >
              {option.title}
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
