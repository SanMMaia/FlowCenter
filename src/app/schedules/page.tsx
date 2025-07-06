'use client';

import AgendamentosList from '@/components/AgendamentosList';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { ClickUpSettings } from '@/lib/supabase';

export default function SchedulesPage() {
  const [settings, setSettings] = useState<ClickUpSettings | null>(null);

  useEffect(() => {
    async function loadSettings() {
      const { data } = await supabase
        .from('clickup_settings')
        .select('*')
        .maybeSingle();
      setSettings(data);
    }
    loadSettings();
  }, []);

  if (!settings) return <div>Carregando configurações...</div>;

  return (
    <div className="container-fluid py-4">
      <AgendamentosList settings={settings} />
    </div>
  );
}
