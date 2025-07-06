'use client';

import { useState, useEffect } from 'react';
import { getTasksClickUp } from '@/services/clickup';
import { supabase } from '@/lib/supabase';

interface Task {
  id: string;
  name: string;
  status: {
    status: string;
    color: string;
  };
}

interface Tasks {
  today: Task[];
  pending: Task[];
}

export default function AtendimentosPage() {
  const [tasks, setTasks] = useState<Tasks>({ today: [], pending: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .single();
        
        setIsAdmin(data?.is_admin || false);
      }
    };

    checkAdmin();
  }, []);

  useEffect(() => {
    const loadTasks = async () => {
      setLoading(true);
      setError('');
      
      try {
        const config = await supabase
          .from('clickup_settings')
          .select('*')
          .limit(1)
          .single();
        
        if (config.error) throw config.error;
        
        const todayTasks = await getTasksClickUp(
          config.data.list_id_requests, // Usando a nova lista de solicitações
          'open'
        );
        
        const pendingTasks = await getTasksClickUp(
          config.data.list_id_requests // Usando a nova lista de solicitações
        );
        
        setTasks({
          today: todayTasks.filter((task: Task) => 
            task.name.toLowerCase().startsWith('atendimento')
          ),
          pending: pendingTasks.filter((task: Task) => 
            task.name.toLowerCase().startsWith('atendimento') &&
            task.status.status !== 'concluído'
          )
        });
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Erro ao carregar atendimentos');
        }
      } finally {
        setLoading(false);
      }
    };

    loadTasks();
  }, []);

  const handleNewTask = async () => {
    // Lógica para criar novo atendimento será implementada aqui
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Atendimentos</h1>
        <button 
          className="btn btn-primary"
          onClick={handleNewTask}
          disabled={loading}
        >
          Novo Atendimento
        </button>
      </div>
      
      {error && <div className="alert alert-danger">{error}</div>}
      
      <div className="card mb-4">
        <div className="card-header">
          <h5 className="mb-0">Atendimentos do Dia</h5>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="text-center">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Carregando...</span>
              </div>
            </div>
          ) : tasks.today?.length > 0 ? (
            <ul className="list-group">
              {tasks.today.map(task => (
                <li key={task.id} className="list-group-item">
                  <div className="d-flex justify-content-between">
                    <span>{task.name}</span>
                    <span className={`badge bg-${task.status.color}`}>
                      {task.status.status}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center text-muted">Nenhum atendimento hoje</p>
          )}
        </div>
      </div>
      
      <div className="card">
        <div className="card-header">
          <h5 className="mb-0">Atendimentos Pendentes</h5>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="text-center">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Carregando...</span>
              </div>
            </div>
          ) : tasks.pending?.length > 0 ? (
            <ul className="list-group">
              {tasks.pending.map(task => (
                <li key={task.id} className="list-group-item">
                  <div className="d-flex justify-content-between">
                    <span>{task.name}</span>
                    <span className={`badge bg-${task.status.color}`}>
                      {task.status.status}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center text-muted">Nenhum atendimento pendente</p>
          )}
        </div>
      </div>
    </div>
  );
}
