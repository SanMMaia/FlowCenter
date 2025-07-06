export default function DashboardPage() {
  return (
    <div className="bg-light text-dark">
      <h1>Dashboard</h1>
      <div className="row mt-4">
        <div className="col-md-6 mb-4 fade-in">
          <div className="card h-100 bg-white">
            <div className="card-header bg-primary text-white slide-up">
              <h5 className="mb-0">Atendimentos do Dia</h5>
            </div>
            <div className="card-body text-dark">
              {/* Lista de atendimentos será implementada aqui */}
              <p className="text-center text-muted">Nenhum atendimento hoje</p>
            </div>
          </div>
        </div>
        <div className="col-md-6 mb-4 fade-in">
          <div className="card h-100 bg-white">
            <div className="card-header bg-success text-white slide-up">
              <h5 className="mb-0">Próximos Agendamentos</h5>
            </div>
            <div className="card-body text-dark">
              {/* Lista de agendamentos será implementada aqui */}
              <p className="text-center text-muted">Nenhum agendamento próximo</p>
            </div>
          </div>
        </div>
      </div>
      <div className="card bg-white fade-in">
        <div className="card-header bg-info text-white slide-up">
          <h5 className="mb-0">Novos Recursos</h5>
        </div>
        <div className="card-body text-dark">
          {/* Novos recursos serão exibidos aqui */}
          <p className="text-center text-muted">Nenhum novo recurso disponível</p>
        </div>
      </div>
    </div>
  );
}
