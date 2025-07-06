'use client';

import React, { useMemo } from 'react';
import { useEffect, useState, useCallback } from 'react';
import { getSolicitacoes } from '@/services/clickupService';
import { ClickUpSettings } from '@/lib/supabase';
import TaskDetailsModal from './TaskDetailsModal';

interface Atendimento {
  id: string;
  name: string;
  status: string | { status: string; color: string };
  description?: string;
  assignees?: Array<{username: string}>;
  custom_fields?: Array<{name: string; value: any}>;
}

export default function SolicitacoesList({ settings }: { settings: ClickUpSettings }) {
  const [rawData, setRawData] = useState<Atendimento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [termoBusca, setTermoBusca] = useState('');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState('');

  const FIELD_NAME_MAPPING: Record<string, string> = {
    '0': 'Clientes X Produtos',
    '1': 'Produtos'
  };

  const loadData = useCallback(async () => {
    try {
      console.log('[Solicitações] Buscando dados brutos da API...');
      const newData = await getSolicitacoes({
        ...settings,
        list_id: settings.list_id_requests
      });
      
      if (JSON.stringify(newData) !== JSON.stringify(rawData)) {
        console.log('Dados diferentes - atualizando estado bruto');
        setRawData(newData);
      } else {
        console.log('Dados brutos idênticos - sem atualização');
      }
    } catch (err) {
      console.error('Erro ao buscar dados:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar');
    } finally {
      setLoading(false);
    }
  }, [settings, rawData]);

  // Dados filtrados para renderização
  const atendimentos = useMemo(() => {
    return rawData.filter(atd => {
      const statusValue = typeof atd.status === 'string' ? atd.status : atd.status?.status;
      const condStatus = filtroStatus === 'todos' || statusValue === filtroStatus;
      const condBusca = termoBusca === '' || 
        Object.values(atd).some(val => 
          val && String(val).toLowerCase().includes(termoBusca.toLowerCase())
        );
      return condStatus && condBusca;
    });
  }, [rawData, filtroStatus, termoBusca]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const interval = setInterval(() => {
      loadData();
    }, 30000); // Atualiza a cada 30 segundos

    return () => clearInterval(interval);
  }, [loadData]);

  const statusUnicos = [...new Set(atendimentos.map(atd => typeof atd.status === 'string' ? atd.status : atd.status.status))];

  const handleTaskClick = (taskId: string) => {
    setSelectedTaskId(taskId);
    setShowTaskModal(true);
  };

  if (error) return (
    <div className="alert alert-danger">
      <strong>Erro ao carregar atendimentos</strong>
      <p>{error}</p>
      <button 
        className="btn btn-sm btn-outline-danger"
        onClick={loadData}
      >
        Tentar novamente
      </button>
    </div>
  );

  return (
    <div className="card">
      <div className="card-header bg-white sticky-top">
        <div className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Solicitações</h5>
          <div className="d-flex align-items-center gap-2">
            <button 
              className="btn btn-primary btn-sm"
              onClick={() => {/* Lógica para criar nova tarefa */}}
            >
              <i className="bi bi-plus-lg me-1"></i> Nova Tarefa
            </button>
            <div className="input-group input-group-sm" style={{width: '200px'}}>
              <input 
                type="text" 
                className="form-control form-control-sm" 
                placeholder="Buscar..."
                value={termoBusca}
                onChange={(e) => setTermoBusca(e.target.value)}
              />
            </div>
            <div className="d-flex align-items-center">
              <select 
                className="form-select form-select-sm" 
                style={{width: '120px'}}
                value={filtroStatus} 
                onChange={(e) => setFiltroStatus(e.target.value)}
              >
                <option value="todos">Todos</option>
                {statusUnicos.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
      
      <div className="card-body p-0">
        {loading && (
          <div className="text-center my-4">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Carregando...</span>
            </div>
            <p>Carregando atendimentos...</p>
          </div>
        )}
        
        {!loading && !error && atendimentos.length === 0 && (
          <div className="alert alert-info mt-3">
            <i className="bi bi-info-circle-fill me-2"></i>
            Nenhum atendimento encontrado
          </div>
        )}
        
        {!loading && !error && atendimentos.length > 0 && (
          <div className="table-responsive" style={{maxHeight: 'calc(100vh - 150px)', overflowY: 'auto'}}>
            <table className="table table-borderless mb-0">
              <thead className="table-light sticky-top">
                <tr>
                  <th>Nome</th>
                  <th>Status</th>
                  <th>Responsável</th>
                  {atendimentos[0]?.custom_fields && 
                    Object.entries(atendimentos[0].custom_fields)
                      .filter(([key]) => !['id', 'name'].includes(key))
                      .map(([key]) => (
                        <th key={key}>{FIELD_NAME_MAPPING[key] || key}</th>
                      ))}
                </tr>
              </thead>
              <tbody>
                {atendimentos.map((atd, index) => (
                  <React.Fragment key={atd.id}>
                    <tr onClick={() => handleTaskClick(atd.id)} style={{ cursor: 'pointer' }}>
                      <td className="py-2" style={{width: '400px'}}>
                        <div className="fw-semibold">{atd.name}</div>
                        <div className="text-muted small" style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {atd.description || 'Sem descrição'}
                        </div>
                      </td>
                      <td className="py-2">
                        <span className="badge bg-secondary">
                          {typeof atd.status === 'string' ? atd.status : atd.status.status}
                        </span>
                      </td>
                      <td className="py-2">
                        {(Array.isArray(atd.assignees) ? atd.assignees : [])
                          .map(a => a?.username || '')
                          .filter(Boolean)
                          .join(', ') || '-'}
                      </td>
                      {atd.custom_fields && 
                        Object.entries(atd.custom_fields)
                          .filter(([key]) => !['id', 'name'].includes(key))
                          .map(([key, value]) => (
                            <td key={key} className="py-2 text-truncate" style={{maxWidth: '150px'}}>
                              {String(value) || '-'}
                            </td>
                          ))}
                    </tr>
                    {index < atendimentos.length - 1 && (
                      <tr>
                        <td colSpan={3 + Object.keys(atd.custom_fields || {}).length}>
                          <div className="border-top my-1"></div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <TaskDetailsModal 
        taskId={selectedTaskId} 
        show={showTaskModal} 
        onHide={() => setShowTaskModal(false)} 
      />
    </div>
  );
}
