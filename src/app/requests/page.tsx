'use client';

import SolicitacoesList from '@/components/SolicitacoesList';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { ClickUpSettings } from '@/lib/supabase';

export default function RequestsPage() {
  const [settings, setSettings] = useState<ClickUpSettings | null>(null);

  useEffect(() => {
    async function loadSettings() {
      const { data } = await supabase
        .from('clickup_settings')
        .select('*')
        .limit(1)
        .single();
      setSettings(data);
    }
    loadSettings();
  }, []);

  if (!settings) return <div>Carregando configurações...</div>;

  return (
    <div className="container-fluid py-4">
      <SolicitacoesList settings={settings} />
    </div>
  );
}
