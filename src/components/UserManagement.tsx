'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface User {
  id: string;
  email: string;
  is_admin: boolean;
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, email, is_admin');
        
        if (error) throw error;
        
        setUsers(data || []);
      } catch (err) {
        setError('Erro ao carregar usuários');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUsers();
  }, []);

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);
      
      if (error) throw error;
      
      setUsers(users.filter(user => user.id !== userId));
    } catch (err) {
      setError('Erro ao excluir usuário');
    }
  };

  const handleToggleAdmin = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_admin: !currentStatus })
        .eq('id', userId);
      
      if (error) throw error;
      
      setUsers(users.map(user => 
        user.id === userId ? { ...user, is_admin: !currentStatus } : user
      ));
    } catch (err) {
      setError('Erro ao atualizar usuário');
    }
  };

  if (loading) return <p>Carregando usuários...</p>;
  if (error) return <p className="text-danger">{error}</p>;

  return (
    <div>
      <h5>Lista de Usuários</h5>
      <table className="table">
        <thead>
          <tr>
            <th>Email</th>
            <th>Tipo</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id}>
              <td>{user.email}</td>
              <td>{user.is_admin ? 'Administrador' : 'Usuário'}</td>
              <td>
                <button 
                  className="btn btn-sm btn-outline-primary me-2"
                  onClick={() => handleToggleAdmin(user.id, user.is_admin)}
                >
                  {user.is_admin ? 'Remover Admin' : 'Tornar Admin'}
                </button>
                <button 
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => handleDeleteUser(user.id)}
                >
                  Excluir
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
