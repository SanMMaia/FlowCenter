'use client';

import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useState } from 'react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });

      if (error) throw error;
      
      setSuccess('Um link de recuperação foi enviado para seu email');
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Erro desconhecido ao enviar email de recuperação');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-4" style={{ width: '400px' }}>
      <h2 className="text-center mb-4">Recuperar Senha</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="email" className="form-label">Email</label>
          <input 
            type="email" 
            className="form-control" 
            id="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required 
          />
        </div>
        <button 
          type="submit" 
          className="btn btn-primary w-100 mb-3"
          disabled={loading}
        >
          {loading ? 'Enviando...' : 'Enviar Link de Recuperação'}
        </button>
        <div className="text-center">
          <Link href="/auth/login">Voltar para o login</Link>
        </div>
      </form>
    </div>
  );
}
