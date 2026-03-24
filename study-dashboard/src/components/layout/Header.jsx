import { useState } from 'react'

function Header() {
    const [count, setCount] = useState(0)

    return (
        <header className="header">
            <div>
                <h1 className="header-title">Olá, estudante 👋</h1>
                <p className="header-subtitle">
                Você clicou {count} vezes no botão
                </p>
            </div>

            <button className="header-button" onClick={() => setCount(count + 1)}>
                Clique aqui
            </button>
        </header>
    )
}

export default Header