import Sidebar from "../components/layout/Sidebar";
import Header from '../components/layout/Header';
import SummaryCard from '../components/ui/SummaryCard';

function Dashboard(){
    return (
        <main className="dashboard-layout">
            <Sidebar />

            <section className="dashboard-content">
                <Header />

                <section className="summary-grid">
                    <SummaryCard
                        title="Matérias ativas"
                        value="6"
                        description="Você está estudando 6 matérias no momento"
                    />

                    <SummaryCard
                        title="Tarefas pendentes"
                        value="14"
                        description="Ainda restam 14 tarefas para concluir"
                    />

                    <SummaryCard
                        title="Progresso geral"
                        value="72%"
                        description="Seu desempenho geral está muito bom"
                    />
                </section>
            </section>
        </main>
    )
}

export default Dashboard;