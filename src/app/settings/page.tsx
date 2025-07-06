'use client';

import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import UserManagement from '@/components/UserManagement';
import UserProfileForm from '@/components/UserProfileForm';
import ClickUpSettings from '@/components/ClickUpSettings';
import NotificationSettings from '@/components/NotificationSettings';

export default function SettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('user');
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

  return (
    <div className="bg-light dark:bg-dark text-dark dark:text-light p-4">
      <div className="card bg-white dark:bg-gray-800 mb-4">
        <div className="card-header bg-primary dark:bg-primary-dark text-white">
          <h2>Configurações</h2>
        </div>
        <div className="card-body">
          <ul className="nav nav-tabs">
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'user' ? 'active' : ''}`}
                onClick={() => setActiveTab('user')}
              >
                Meus Dados
              </button>
            </li>
            
            {isAdmin && (
              <>
                <li className="nav-item">
                  <button 
                    className={`nav-link ${activeTab === 'users' ? 'active' : ''}`}
                    onClick={() => setActiveTab('users')}
                  >
                    Usuários
                  </button>
                </li>
                <li className="nav-item">
                  <button 
                    className={`nav-link ${activeTab === 'clickup' ? 'active' : ''}`}
                    onClick={() => setActiveTab('clickup')}
                  >
                    ClickUp
                  </button>
                </li>
                <li className="nav-item">
                  <button 
                    className={`nav-link ${activeTab === 'notifications' ? 'active' : ''}`}
                    onClick={() => setActiveTab('notifications')}
                  >
                    Notificações
                  </button>
                </li>
              </>
            )}
            
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'appearance' ? 'active' : ''}`}
                onClick={() => setActiveTab('appearance')}
              >
                Aparência
              </button>
            </li>
          </ul>
          
          <div className="mt-3">
            {activeTab === 'user' && (
              <div>
                <h3>Configurações de Usuário</h3>
                <UserProfileForm />
              </div>
            )}
            
            {isAdmin && activeTab === 'users' && (
              <div>
                <h3>Gerenciamento de Usuários</h3>
                <UserManagement />
              </div>
            )}
            
            {isAdmin && activeTab === 'clickup' && (
              <div>
                <h3>Configurações do ClickUp</h3>
                <ClickUpSettings />
              </div>
            )}
            
            {isAdmin && activeTab === 'notifications' && (
              <div>
                <h3>Configurações de Notificações</h3>
                <NotificationSettings />
              </div>
            )}
            
            {activeTab === 'appearance' && (
              <div>
                <h3>Configurações de Aparência</h3>
                <div className="mt-3">
                  <div className="col-md-6">
                    <div className="card mb-4">
                      <div className="card-header">
                        <h5>Aparência</h5>
                      </div>
                      <div className="card-body">
                        <p>Configurações de aparência serão implementadas em breve.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
