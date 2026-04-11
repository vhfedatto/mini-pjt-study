function Card({ children, className = '' }) {
    return (
        <div className={`custom-card${className ? ` ${className}` : ''}`}>
            {children}
        </div>
  )
}

export default Card
