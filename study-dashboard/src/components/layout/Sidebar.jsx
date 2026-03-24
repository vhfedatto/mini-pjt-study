//Componente funcional
function Sidebar(){
    //O que vai aparecer
    return(
        <aside className="sidebar">
            <h2 className="sidebar-title">StudyDash</h2>
            
            <nav className="sidebar-nav">
                <a href="#">Dashboard</a>
                <a href="#">Matérias</a>
                <a href="#">Tarefas</a>
                <a href="#">Progresso</a>
            </nav>
        </aside>
    )
}

export default Sidebar;