import { supabase } from '@/lib/supabase';

// Interface para representar uma tarefa do ClickUp
export interface ClickUpTask {
  id: string;
  name: string;
  status: {
    status: string;
    color: string;
  };
  date_created: string;
  date_updated: string;
  due_date: string | null;
  custom_fields: {
    id: string;
    name: string;
    value: any;
  }[];
}

// Obtém as configurações do ClickUp armazenadas no Supabase
export async function getConfigClickUp() {
  const { data, error } = await supabase
    .from('clickup_settings')
    .select('*')
    .limit(1)
    .single();

  if (error) throw error;
  return data;
}

// Busca tarefas de uma lista específica, opcionalmente filtrando por status
export async function getTasksClickUp(listId: string, status?: string): Promise<ClickUpTask[]> {
  const config = await getConfigClickUp();
  
  let url = `https://api.clickup.com/api/v2/list/${listId}/task`;
  if (status) {
    url += `?subtasks=true&statuses[]=${status}`;
  }
  
  const response = await fetch(url, {
    headers: {
      'Authorization': config.api_key,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Erro na requisição: ${response.statusText}`);
  }

  const { tasks } = await response.json();
  return tasks;
}

// Cria uma nova tarefa no ClickUp
export async function createTaskClickUp(listId: string, taskData: {
  name: string;
  description: string;
  status?: string;
  due_date?: number;
}): Promise<ClickUpTask> {
  const config = await getConfigClickUp();
  
  const response = await fetch(`https://api.clickup.com/api/v2/list/${listId}/task`, {
    method: 'POST',
    headers: {
      'Authorization': config.api_key,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(taskData)
  });

  if (!response.ok) {
    throw new Error(`Erro ao criar tarefa: ${response.statusText}`);
  }

  return await response.json();
}

// Atualiza uma tarefa existente no ClickUp
export async function updateTaskClickUp(taskId: string, updates: {
  status?: string;
  due_date?: number;
  custom_fields?: {
    id: string;
    value: any;
  }[];
}): Promise<ClickUpTask> {
  const config = await getConfigClickUp();
  
  const response = await fetch(`https://api.clickup.com/api/v2/task/${taskId}`, {
    method: 'PUT',
    headers: {
      'Authorization': config.api_key,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updates)
  });

  if (!response.ok) {
    throw new Error(`Erro ao atualizar tarefa: ${response.statusText}`);
  }

  return await response.json();
}
