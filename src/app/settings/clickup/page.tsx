'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function ClickUpConfigPage() {
  const [apiKey, setApiKey] = useState('');
  const [teamId, setTeamId] = useState('');
  const [listId, setListId] = useState('');
  const [listIdClientesProdutos, setListIdClientesProdutos] = useState('');
  const [listIdProdutos, setListIdProdutos] = useState('');
  const [listIdRequests, setListIdRequests] = useState('');
  const [statuses, setStatuses] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const { data, error } = await supabase
          .from('clickup_settings')
          .select('*')
          .limit(1)
          .single();

        if (error && !error.message.includes('No rows found')) throw error;
        
        if (data) {
          setApiKey(data.api_key);
          setTeamId(data.team_id);
          setListId(data.list_id);
          setListIdClientesProdutos(data.list_id_clientes_produtos || '');
          setListIdProdutos(data.list_id_produtos || '');
          setListIdRequests(data.list_id_requests || '');
          setStatuses(data.statuses || {});
        }
      } catch (err) {
        if (err instanceof Error) {
          setError(`Erro ao carregar configurações: ${err.message}`);
        } else {
          setError('Erro desconhecido ao carregar configurações');
        }
      } finally {
        setInitialLoad(false);
      }
    };

    loadConfig();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { error } = await supabase
        .from('clickup_settings')
        .upsert({
          api_key: apiKey,
          team_id: teamId,
          list_id: listId,
          list_id_clientes_produtos: listIdClientesProdutos,
          list_id_produtos: listIdProdutos,
          list_id_requests: listIdRequests,
          statuses,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      
      setSuccess('Configurações salvas com sucesso!');
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Erro desconhecido ao salvar configurações');
      }
    } finally {
      setLoading(false);
    }
  };

  if (initialLoad) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Carregando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-4">
      <h2 className="mb-4">Configurações do ClickUp</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="apiKey" className="form-label">API Key</label>
          <input 
            type="password" 
            className="form-control" 
            id="apiKey" 
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            required
          />
        </div>
        
        <div className="mb-3">
          <label htmlFor="teamId" className="form-label">Team ID</label>
          <input 
            type="text" 
            className="form-control" 
            id="teamId" 
            value={teamId}
            onChange={(e) => setTeamId(e.target.value)}
            required
          />
        </div>
        
        <div className="mb-3">
          <label htmlFor="listId" className="form-label">List ID - Atendimentos</label>
          <input 
            type="text" 
            className="form-control" 
            id="listId" 
            value={listId}
            onChange={(e) => setListId(e.target.value)}
          />
        </div>

        <div className="mb-3">
          <label htmlFor="listIdClientesProdutos" className="form-label">List ID - Clientes X Produtos</label>
          <input 
            type="text" 
            className="form-control" 
            id="listIdClientesProdutos" 
            value={listIdClientesProdutos}
            onChange={(e) => setListIdClientesProdutos(e.target.value)}
          />
        </div>

        <div className="mb-3">
          <label htmlFor="listIdProdutos" className="form-label">List ID - Produtos</label>
          <input 
            type="text" 
            className="form-control" 
            id="listIdProdutos" 
            value={listIdProdutos}
            onChange={(e) => setListIdProdutos(e.target.value)}
          />
        </div>

        <div className="mb-3">
          <label htmlFor="listIdRequests" className="form-label">List ID - Solicitações</label>
          <input 
            type="text" 
            className="form-control" 
            id="listIdRequests" 
            value={listIdRequests}
            onChange={(e) => setListIdRequests(e.target.value)}
          />
        </div>
        
        <div className="mb-4">
          <label className="form-label">Mapeamento de Status</label>
          <div className="card p-3">
            <div className="mb-3">
              <label className="form-label">Status: Agendado</label>
              <input 
                type="text" 
                className="form-control" 
                value={statuses['agendado'] || ''}
                onChange={(e) => setStatuses({...statuses, agendado: e.target.value})}
                placeholder="ID do status no ClickUp"
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Status: Em Andamento</label>
              <input 
                type="text" 
                className="form-control" 
                value={statuses['em_andamento'] || ''}
                onChange={(e) => setStatuses({...statuses, em_andamento: e.target.value})}
                placeholder="ID do status no ClickUp"
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Status: Concluído</label>
              <input 
                type="text" 
                className="form-control" 
                value={statuses['concluido'] || ''}
                onChange={(e) => setStatuses({...statuses, concluido: e.target.value})}
                placeholder="ID do status no ClickUp"
              />
            </div>
          </div>
        </div>
        
        <button 
          type="submit" 
          className="btn btn-primary"
          disabled={loading}
        >
          {loading ? 'Salvando...' : 'Salvar Configurações'}
        </button>
      </form>
    </div>
  );
}
