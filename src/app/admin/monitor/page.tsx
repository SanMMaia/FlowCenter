'use client';

import { useEffect, useState } from 'react';
import { redirect } from 'next/navigation';
import ApiMonitor from '@/components/admin/ApiMonitor';
import { checkUserRole } from '@/lib/auth';

export default function MonitorPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyAdmin = async () => {
      const adminStatus = await checkUserRole('admin');
      setIsAdmin(adminStatus);
      setLoading(false);
      
      if (!adminStatus) {
        redirect('/');
      }
    };
    
    verifyAdmin();
  }, []);

  if (loading) {
    return <div className="container py-4">Verificando permissões...</div>;
  }

  return (
    <div className="container py-4">
      <h1 className="mb-4">Monitoramento de API</h1>
      <ApiMonitor />
    </div>
  );
}
