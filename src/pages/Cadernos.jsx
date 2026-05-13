import { useEffect, useState } from 'react'
import Footer from '../components/layout/Footer'
import Flashcards from './Flashcards'
import QuestionNotebooks from '../components/study/QuestionNotebooks'
import SubjectNotebooks from '../components/study/SubjectNotebooks'

const TABS = [
  { key: 'notebooks', title: 'Caderno de Questões' },
  { key: 'subjects',  title: 'Caderno de Matérias'  },
  { key: 'flashcards', title: 'Baralhos de Flashcards' },
]

function Cadernos({ onStartQuestionTraining, resumeNotebookId }) {
  const [activeTab, setActiveTab] = useState('notebooks')

  useEffect(() => {
    if (resumeNotebookId) {
      setActiveTab('notebooks')
    }
  }, [resumeNotebookId])

  return (
    <section className="dashboard-content">
      <section className="training-tabs">
        <div className="training-tabs-list">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`training-tab${activeTab === tab.key ? ' is-active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.title}
            </button>
          ))}
        </div>
      </section>

      {activeTab === 'notebooks' && (
        <QuestionNotebooks
          onStartTraining={onStartQuestionTraining}
          initialSelectedId={resumeNotebookId}
        />
      )}
      {activeTab === 'subjects' && <SubjectNotebooks />}
      {activeTab === 'flashcards' && <Flashcards embedded />}

      <Footer />
    </section>
  )
}

export default Cadernos
