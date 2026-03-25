function Footer() {
  const year = new Date().getFullYear()

  const team = [
    {
      name: 'Victor H Fedatto',
      github: 'https://github.com/vhfedatto',
      linkedin: 'https://www.linkedin.com/in/victor-hugo-fedatto/'
    },
    {
      name: 'Kaliel Selhorst',
      github: 'https://github.com/Selhorstkaliel',
      linkedin: 'https://www.linkedin.com/in/kaliel-selhorst-3baa12350/'
    }
  ]

  return (
    <footer className="footer">
      <div className="footer__top">
        <section className="footer__brand-block">
          <div className="footer__brand">
            <img
              className="footer__logo-image"
              src="/logo-study-strack.svg"
              alt="Logo Study Strack"
            />
            <div>
              <h3 className="footer__title">Study Strack</h3>
            </div>
          </div>
          <p className="footer__subtitle">
            Organize seus estudos, acompanhe tarefas e avance com mais clareza.</p>
        </section>

        <section className="footer__section">
          <p className="footer__section-title">Equipe</p>

          <div className="footer__team">
            {team.map((member) => (
              <article className="footer__team-card" key={member.name}>
                <div>
                  <p className="footer__member-name">{member.name}</p>
                  <p className="footer__member-role">Desenvolvimento</p>
                </div>

                <div className="footer__dev-links">
                  <a
                    className="icon-link"
                    aria-label={`Github de ${member.name}`}
                    href={member.github}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" role="img">
                      <path d="M12 .5C5.73.5.5 5.74.5 12.02c0 5.1 3.29 9.43 7.86 10.96.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.53-1.36-1.3-1.72-1.3-1.72-1.06-.72.08-.71.08-.71 1.17.08 1.79 1.2 1.79 1.2 1.04 1.79 2.73 1.27 3.4.97.1-.76.41-1.27.74-1.56-2.55-.29-5.23-1.28-5.23-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.45.11-3.02 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.8 0c2.21-1.5 3.18-1.18 3.18-1.18.63 1.57.23 2.73.11 3.02.74.81 1.19 1.83 1.19 3.09 0 4.41-2.69 5.38-5.25 5.67.42.36.79 1.08.79 2.18 0 1.58-.02 2.85-.02 3.24 0 .31.21.68.8.56a10.53 10.53 0 0 0 7.84-10.96C23.5 5.74 18.27.5 12 .5Z" />
                    </svg>
                  </a>

                  <a
                    className="icon-link"
                    aria-label={`LinkedIn de ${member.name}`}
                    href={member.linkedin}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" role="img">
                      <path d="M4.98 3.5C4.98 4.88 3.9 6 2.5 6S0 4.88 0 3.5 1.08 1 2.48 1s2.5 1.12 2.5 2.5ZM.24 8.28h4.49V24H.24V8.28ZM8.69 8.28h4.3v2.14h.06c.6-1.1 2.07-2.26 4.27-2.26 4.56 0 5.4 3 5.4 6.9V24h-4.49v-8.22c0-1.96-.04-4.48-2.73-4.48-2.73 0-3.15 2.13-3.15 4.33V24H8.69V8.28Z" />
                    </svg>
                  </a>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="footer__section">
          <p className="footer__section-title">Links úteis</p>

          <nav className="footer__links" aria-label="Links úteis do rodapé">
            <a href="#">Termos de uso</a>
            <a href="#">Privacidade</a>
            <a href="#">Suporte</a>
          </nav>
        </section>
      </div>

      <div className="footer__bottom">
        <span>© {year} Study Strack. Todos os direitos reservados.</span>
      </div>
    </footer>
  )
}

export default Footer;