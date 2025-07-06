'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

type ApiStatus = {
  timestamp: string;
  endpoint: string;
  status: 'success' | 'error';
  responseTime: number;
  error?: string;
};

export default function ApiMonitor() {
  const [apiLogs, setApiLogs] = useState<ApiStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    
    const fetchLogs = async () => {
      try {
        const { data, error } = await supabase
          .from('api_monitor')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(100);

        if (error) throw error;
        setApiLogs(data || []);
      } catch (error) {
        console.error('Erro ao buscar logs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
    const interval = setInterval(fetchLogs, 30000); // Atualiza a cada 30s
    
    return () => clearInterval(interval);
  }, [isPaused]);

  return (
    <div className="card">
      <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Monitoramento de API</h5>
        <button 
          className={`btn btn-sm ${isPaused ? 'btn-success' : 'btn-warning'}`}
          onClick={() => setIsPaused(!isPaused)}
        >
          <i className={`bi ${isPaused ? 'bi-play-fill' : 'bi-pause-fill'} me-1`}></i>
          {isPaused ? 'Continuar' : 'Pausar'}
        </button>
      </div>
      <div className="card-body">
        {loading ? (
          <div className="text-center">Carregando...</div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Data/Hora</th>
                  <th>Endpoint</th>
                  <th>Status</th>
                  <th>Tempo (ms)</th>
                  <th>Erro</th>
                </tr>
              </thead>
              <tbody>
                {apiLogs.map((log, index) => (
                  <tr key={index} className={log.status === 'error' ? 'table-danger' : 'table-success'}>
                    <td>{new Date(log.timestamp).toLocaleString()}</td>
                    <td>{log.endpoint}</td>
                    <td>
                      <span className={`badge bg-${log.status === 'error' ? 'danger' : 'success'}`}>
                        {log.status === 'error' ? 'Erro' : 'OK'}
                      </span>
                    </td>
                    <td>{log.responseTime}</td>
                    <td>{log.error || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
