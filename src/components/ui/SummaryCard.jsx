function SummaryCard({ title, value = 0, description, variant = 'default', icon = null }) {
    return (
        <article className={`summary-card summary-card--${variant}`}>
            <div className="summary-card-header">
                <h3 className="summary-card-title">{title}</h3>
                {icon ? <span className="summary-card-icon" aria-hidden="true">{icon}</span> : null}
            </div>
            <p className="summary-card-value">{value}</p>
            <span className="summary-card-description">{description}</span>
        </article>
    )
}

export default SummaryCard

// Props = Properties - São dados que um componente pai envia para um filho. Aqui, usamos 3: title, value e description.

// Versão anterior:
/* function SummaryCard(props) {
  return (
    <article className="summary-card">
      <h3 className="summary-card-title">{props.title}</h3>
      <p className="summary-card-value">{props.value}</p>
      <span className="summary-card-description">{props.description}</span>
    </article>
  )
}

export default SummaryCard*/

// Em React, normalmente preferimos desestruturar as props logo na assinatura da função. É melhor pois deixa mais limpo, melhor a leitura, evita repetição de props.
