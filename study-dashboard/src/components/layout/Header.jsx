import { useState } from 'react'

function Header() {
    const [count, setCount] = useState(0)

    return (
        <header className="header">
            <div>
                <h1 className="header-title">Olá, estudante 👋</h1>
                <p className="header-subtitle">Organize sua rotina, acompanhe seu progresso e mantenha o foco.</p>
            </div>

            <button className="header-button">Novo Plano</button>
        </header>
    )
}

export default Header