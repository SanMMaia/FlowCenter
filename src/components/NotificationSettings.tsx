'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function NotificationSettings() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [browserNotifications, setBrowserNotifications] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        const { data } = await supabase
          .from('notification_settings')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        if (data) {
          setEmailNotifications(data.email_notifications);
          setBrowserNotifications(data.browser_notifications);
        }
      } catch (err) {
        setError('Erro ao carregar configurações');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');
      
      const { error } = await supabase
        .from('notification_settings')
        .upsert({
          user_id: user.id,
          email_notifications: emailNotifications,
          browser_notifications: browserNotifications,
          updated_at: new Date().toISOString()
        });
      
      if (error) throw error;
      
      setSuccess('Configurações de notificação salvas com sucesso!');
    } catch (err) {
      setError('Erro ao salvar configurações');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p>Carregando configurações...</p>;

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
      
      <div className="mb-3 form-check">
        <input 
          type="checkbox" 
          className="form-check-input" 
          checked={emailNotifications}
          onChange={(e) => setEmailNotifications(e.target.checked)}
          id="emailNotifications"
        />
        <label className="form-check-label" htmlFor="emailNotifications">
          Receber notificações por e-mail
        </label>
      </div>
      
      <div className="mb-3 form-check">
        <input 
          type="checkbox" 
          className="form-check-input" 
          checked={browserNotifications}
          onChange={(e) => setBrowserNotifications(e.target.checked)}
          id="browserNotifications"
        />
        <label className="form-check-label" htmlFor="browserNotifications">
          Permitir notificações do navegador
        </label>
      </div>
      
      <button 
        type="submit" 
        className="btn btn-primary"
        disabled={loading}
      >
        {loading ? 'Salvando...' : 'Salvar Configurações'}
      </button>
    </form>
  );
}
