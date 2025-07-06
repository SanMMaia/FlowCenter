'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function UserProfileForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        const { data } = await supabase
          .from('profiles')
          .select('name, email')
          .eq('id', user.id)
          .single();
        
        if (data) {
          setName(data.name || '');
          setEmail(data.email || user.email || '');
        }
      } catch (err) {
        setError('Erro ao carregar perfil');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Primeiro salva os dados do perfil
    setLoading(true);
    setError('');
    setSuccess('');
    setPasswordError('');
    setPasswordSuccess('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');
      
      // Atualiza dados do perfil
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          name,
          updated_at: new Date().toISOString()
        });
      
      if (profileError) throw profileError;
      
      // Se houver nova senha, atualiza a senha
      if (newPassword) {
        if (newPassword !== confirmPassword) {
          throw new Error('As senhas não coincidem');
        }
        
        const { error: passwordError } = await supabase.auth.updateUser({
          password: newPassword
        });
        
        if (passwordError) throw passwordError;
        
        setPasswordSuccess('Senha alterada com sucesso!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
      
      setSuccess('Alterações salvas com sucesso!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar alterações');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p>Carregando perfil...</p>;

  return (
    <form onSubmit={handleSubmit} className="bg-light text-dark p-4 rounded fade-in">
      {error && <div className="alert alert-danger slide-up">{error}</div>}
      {success && <div className="alert alert-success slide-up">{success}</div>}
      {passwordError && <div className="alert alert-danger slide-up">{passwordError}</div>}
      {passwordSuccess && <div className="alert alert-success slide-up">{passwordSuccess}</div>}
      
      <div className="mb-3 slide-up">
        <label className="form-label">Nome</label>
        <input 
          type="text" 
          className="form-control bg-white text-dark"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      
      <div className="mb-3 slide-up">
        <label className="form-label">Email</label>
        <input 
          type="email" 
          className="form-control bg-white text-dark"
          value={email}
          disabled
        />
      </div>
      
      <div className="mt-5 slide-up">
        <h4>Alterar Senha</h4>
        <div className="mb-3 slide-up">
          <label className="form-label">Senha Atual</label>
          <input 
            type="password" 
            className="form-control bg-white text-dark"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
        </div>
        
        <div className="mb-3 slide-up">
          <label className="form-label">Nova Senha</label>
          <input 
            type="password" 
            className="form-control bg-white text-dark"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>
        
        <div className="mb-3 slide-up">
          <label className="form-label">Confirmar Nova Senha</label>
          <input 
            type="password" 
            className="form-control bg-white text-dark"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>
      </div>
      
      <button 
        type="submit" 
        className="btn btn-primary hover-scale"
        disabled={loading}
      >
        {loading ? 'Salvando...' : 'Salvar Alterações'}
      </button>
    </form>
  );
}
