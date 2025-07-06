'use client';

import React, { useMemo } from 'react';
import { useEffect, useState, useCallback } from 'react';
import { getAtendimentos } from '@/services/clickupService';
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

export default function AtendimentosList({ settings }: { settings: ClickUpSettings }) {
  const [atendimentos, setAtendimentos] = useState<Atendimento[]>([]);
  const [previousData, setPreviousData] = useState<Atendimento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [filtroNome, setFiltroNome] = useState<string>('Atendimento');
  const [termoBusca, setTermoBusca] = useState('');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState('');

  const FIELD_NAME_MAPPING: Record<string, string> = {
    '0': 'Clientes X Produtos',
    '1': 'Produtos'
  };

  const loadData = useCallback(async () => {
    try {
      console.log('Fazendo requisição à API...');
      const newData = await getAtendimentos(settings);
      
      console.log('Dados recebidos:', newData.length, 'itens');
      console.log('Comparando com dados anteriores...');
      
      if (JSON.stringify(newData) !== JSON.stringify(previousData)) {
        console.log('Dados diferentes - atualizando estado');
        setAtendimentos(newData);
        setPreviousData(newData);
      } else {
        console.log('Dados idênticos - sem atualização necessária');
      }
    } catch (err) {
      console.error('Erro na requisição:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar atendimentos');
    } finally {
      setLoading(false);
    }
  }, [settings, previousData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const interval = setInterval(() => {
      loadData();
    }, 30000); // Atualiza a cada 30 segundos

    return () => clearInterval(interval);
  }, [loadData]);

  const statusUnicos = useMemo(() => [...new Set(atendimentos.map(atd => typeof atd.status === 'string' ? atd.status : atd.status.status))], [atendimentos]);

  const handleTaskClick = (taskId: string) => {
    setSelectedTaskId(taskId);
    setShowTaskModal(true);
  };

  const atendimentosFiltrados = useMemo(() => {
    const condNome = (atd: Atendimento) => atd.name?.toLowerCase().includes(filtroNome.toLowerCase()) ?? false;
    const condStatus = (atd: Atendimento) => filtroStatus === 'todos' || (typeof atd.status === 'string' ? atd.status : atd.status.status) === filtroStatus;
    const condBusca = (atd: Atendimento) => termoBusca === '' || 
      Object.values(atd).some(val => 
        String(val).toLowerCase().includes(termoBusca.toLowerCase())
      ) ||
      (atd.custom_fields && 
        Object.values(atd.custom_fields).some(val =>
          String(val).toLowerCase().includes(termoBusca.toLowerCase())
        )
      );

    return atendimentos.filter(atd => condNome(atd) && condStatus(atd) && condBusca(atd));
  }, [atendimentos, filtroNome, filtroStatus, termoBusca]);

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
          <h5 className="mb-0">Lista de Atendimentos</h5>
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
        
        {!loading && !error && atendimentosFiltrados.length === 0 && (
          <div className="alert alert-info mt-3">
            <i className="bi bi-info-circle-fill me-2"></i>
            Nenhum atendimento encontrado
          </div>
        )}
        
        {!loading && !error && atendimentosFiltrados.length > 0 && (
          <div className="table-responsive" style={{maxHeight: 'calc(100vh - 150px)', overflowY: 'auto'}}>
            <table className="table table-borderless mb-0">
              <thead className="table-light sticky-top">
                <tr>
                  <th>Nome</th>
                  <th>Status</th>
                  <th>Responsável</th>
                  {atendimentosFiltrados[0]?.custom_fields && 
                    Object.entries(atendimentosFiltrados[0].custom_fields)
                      .filter(([key]) => !['id', 'name'].includes(key))
                      .map(([key]) => (
                        <th key={key}>{FIELD_NAME_MAPPING[key] || key}</th>
                      ))}
                </tr>
              </thead>
              <tbody>
                {atendimentosFiltrados.map((atd, index) => (
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
                    {index < atendimentosFiltrados.length - 1 && (
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
