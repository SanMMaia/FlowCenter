'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { getCustomFields } from '@/services/clickupService';

export default function ClickUpSettings() {
  const [apiKey, setApiKey] = useState('');
  const [listId, setListId] = useState('');
  const [listIdClientesProdutos, setListIdClientesProdutos] = useState('');
  const [listIdProdutos, setListIdProdutos] = useState('');
  const [listIdRequests, setListIdRequests] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [customFields, setCustomFields] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('clickup_settings')
          .select('*')
          .maybeSingle();

        if (error) throw error;
        
        if (data) {
          setApiKey(data.api_key || '');
          setListId(data.list_id || '');
          setListIdClientesProdutos(data.list_id_clientes_produtos || '');
          setListIdProdutos(data.list_id_produtos || '');
          setListIdRequests(data.list_id_requests || '');
        } else {
          console.log('Nenhuma configuração encontrada - tabela vazia');
        }
      } catch (err) {
        console.error('Erro ao carregar configurações:', err);
        setError('Erro ao carregar configurações do ClickUp');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSettings();
  }, []);

  useEffect(() => {
    const fetchCustomFields = async () => {
      if (!apiKey || !listId) return;
      
      try {
        const fields = await getCustomFields({
          api_key: apiKey,
          list_id: listId,
          list_id_clientes_produtos: listIdClientesProdutos,
          list_id_produtos: listIdProdutos
        }, listId);
        
        setCustomFields(fields);
      } catch (error) {
        console.error('Erro ao buscar campos personalizados:', error);
      }
    };

    fetchCustomFields();
  }, [apiKey, listId, listIdClientesProdutos, listIdProdutos]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Verifica se já existe um registro
      const { data: existingSettings } = await supabase
        .from('clickup_settings')
        .select('id')
        .maybeSingle();

      if (existingSettings?.id) {
        // Atualiza registro existente
        const { error } = await supabase
          .from('clickup_settings')
          .update({
            api_key: apiKey,
            list_id: listId,
            list_id_clientes_produtos: listIdClientesProdutos,
            list_id_produtos: listIdProdutos,
            list_id_requests: listIdRequests,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingSettings.id);

        if (error) throw error;
        setSuccess('Configurações atualizadas com sucesso!');
      } else {
        // Cria novo registro se não existir
        const { error } = await supabase
          .from('clickup_settings')
          .insert([{
            api_key: apiKey,
            list_id: listId,
            list_id_clientes_produtos: listIdClientesProdutos,
            list_id_produtos: listIdProdutos,
            list_id_requests: listIdRequests
          }]);

        if (error) throw error;
        setSuccess('Configurações salvas com sucesso!');
      }
    } catch (err) {
      console.error('Erro ao salvar configurações:', err);
      setError('Erro ao salvar configurações do ClickUp');
    } finally {
      setLoading(false);
    }
  };

  const isValid = apiKey.trim() && listId.trim() && listIdClientesProdutos.trim() && listIdProdutos.trim() && listIdRequests.trim();

  if (loading) return <p>Carregando configurações...</p>;

  return (
    <div className="card">
      <div className="card-header">
        <h5>Configurações do ClickUp</h5>
      </div>
      <div className="card-body">
        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">API Key</label>
            <input
              type="password"
              className="form-control"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              required
            />
          </div>
          
          <div className="mb-3">
            <label className="form-label">List ID - Atendimentos</label>
            <input
              type="text"
              className="form-control"
              value={listId}
              onChange={(e) => setListId(e.target.value)}
              required
            />
          </div>
          
          <div className="mb-3">
            <label className="form-label">List ID - Clientes X Produtos</label>
            <input
              type="text"
              className="form-control"
              value={listIdClientesProdutos}
              onChange={(e) => setListIdClientesProdutos(e.target.value)}
              required
            />
          </div>
          
          <div className="mb-3">
            <label className="form-label">List ID - Produtos</label>
            <input
              type="text"
              className="form-control"
              value={listIdProdutos}
              onChange={(e) => setListIdProdutos(e.target.value)}
              required
            />
          </div>
          
          <div className="mb-3">
            <label className="form-label">List ID - Solicitações</label>
            <input
              type="text"
              className="form-control"
              value={listIdRequests}
              onChange={(e) => setListIdRequests(e.target.value)}
              required
            />
          </div>
          
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={loading || !isValid}
          >
            {loading ? 'Salvando...' : 'Salvar Configurações'}
          </button>
        </form>
        
        {customFields && Object.keys(customFields).length > 0 && (
          <div className="mt-4">
            <h5>Campos Personalizados</h5>
            <ul className="list-group">
              {Object.entries(customFields).map(([id, name]) => (
                <li key={id} className="list-group-item">
                  <strong>{name}</strong> (ID: {id})
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
