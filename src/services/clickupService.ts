import { ClickUpSettings } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';

export interface Atendimento {
  id: string;
  name?: string;
  description?: string;
  custom_fields?: Array<{name: string; value: any}>;
  status: string | { status: string; color: string };
  assignees?: Array<{username: string}>;
}

async function logApiCall(
  endpoint: string,
  status: 'success' | 'error',
  responseTime: number,
  error?: string
) {
  try {
    await supabase.from('api_monitor').insert({
      endpoint,
      status,
      response_time: responseTime,
      error_message: error
    });
  } catch (logError) {
    console.error('Falha ao registrar chamada API:', logError);
  }
}

export async function getAtendimentos(settings: ClickUpSettings, filtros = {}): Promise<Atendimento[]> {
  const startTime = Date.now();
  const MAX_RETRIES = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      if (!settings.api_key || !settings.list_id) {
        throw new Error('Configurações do ClickUp incompletas');
      }

      const response = await fetch(
        `https://api.clickup.com/api/v2/list/${settings.list_id}/task`,
        {
          headers: {
            Authorization: settings.api_key,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Erro na API: ${response.statusText}`);
      }

      const data = await response.json();

      const atendimentos = data.tasks.map((task: any) => {
        const campos: Record<string, any> = {};
        
        if (task.custom_fields) {
          task.custom_fields.forEach((field: any) => {
            // Mapeamento especial para os campos solicitados
            if (field.name === 'Cliente X Produto') {
              campos['0'] = field.value?.map((item: any) => item.name) || [];
            } else if (field.name === 'Produto') {
              campos['1'] = field.value?.map((item: any) => item.name) || [];
            } else {
              campos[field.id] = field.value;
            }
          });
        }

        return {
          id: task.id,
          name: task.name,
          description: task.description,
          status: task.status.status,
          assignees: task.assignees.map((a: any) => a.username).join(', '),
          custom_fields: campos
        };
      });

      await logApiCall(
        `list/${settings.list_id}/task`,
        'success',
        Date.now() - startTime
      );

      return atendimentos;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      await logApiCall(
        `list/${settings.list_id}/task`,
        'error',
        Date.now() - startTime,
        lastError.message
      );
      if (attempt < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, attempt * 1000));
      }
    }
  }

  throw lastError || new Error('Falha após múltiplas tentativas');
}

export async function getSolicitacoes(settings: ClickUpSettings, filtros = {}): Promise<Atendimento[]> {
  const startTime = Date.now();
  const MAX_RETRIES = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      if (!settings.api_key || !settings.list_id_requests) {
        throw new Error('Configurações do ClickUp incompletas - falta list_id_requests');
      }

      const response = await fetch(
        `https://api.clickup.com/api/v2/list/${settings.list_id_requests}/task`,
        {
          headers: {
            Authorization: settings.api_key,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Erro na API: ${response.statusText}`);
      }

      const data = await response.json();

      const solicitacoes = data.tasks.map((task: any) => ({
        id: task.id,
        name: task.name,
        status: task.status,
        assignees: task.assignees,
        custom_fields: task.custom_fields
      }));

      return solicitacoes;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, attempt * 1000));
      }
    }
  }

  throw lastError || new Error('Falha ao buscar solicitações');
}

export async function getCustomFields(settings: ClickUpSettings, listId: string): Promise<Record<string, string>> {
  const MAX_RETRIES = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      if (!settings.api_key || !listId) {
        throw new Error('Configurações do ClickUp incompletas');
      }

      const response = await fetch(
        `https://api.clickup.com/api/v2/list/${listId}/field`,
        {
          headers: {
            Authorization: settings.api_key,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Erro na API: ${response.statusText}`);
      }

      const data = await response.json();
      const fields: Record<string, string> = {};
      
      data.fields.forEach((field: any) => {
        fields[field.id] = field.name;
      });

      return fields;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, attempt * 1000));
      }
    }
  }

  throw lastError || new Error('Falha ao buscar campos personalizados');
}

export async function criarAtendimento(settings: ClickUpSettings, dados: {
  nome: string;
  descricao: string;
}) {
  const response = await fetch(`https://api.clickup.com/api/v2/list/${settings.list_id}/task`, {
    method: 'POST',
    headers: {
      'Authorization': settings.api_key,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: `Atendimento: ${dados.nome}`,
      description: dados.descricao,
      status: 'fazer'
    })
  });
  return await response.json();
}

export const getClickUpSettings = async (): Promise<ClickUpSettings> => {
  const { data, error } = await supabase
    .from('clickup_settings')
    .select('*')
    .limit(1)
    .single();

  if (error) throw error;
  
  return {
    id: data.id,
    created_at: data.created_at,
    api_key: data.api_key,
    list_id: data.list_id,
    list_id_requests: data.list_id_requests
  };
};

export async function getTaskDetails(taskId: string) {
  try {
    const settings = await getClickUpSettings();
    if (!settings?.api_key) throw new Error('Configurações do ClickUp não encontradas');

    const response = await fetch(`https://api.clickup.com/api/v2/task/${taskId}`, {
      headers: {
        'Authorization': settings.api_key,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Erro ao buscar tarefa: ${response.statusText}`);
    }

    const task = await response.json();
    
    console.log('Dados brutos da tarefa recebidos da API:', {
      start_date_raw: task.start_date,
      due_date_raw: task.due_date,
      type_start_date: typeof task.start_date,
      type_due_date: typeof task.due_date
    });

    // Converter timestamps para formato ISO se necessário
    if (task.start_date) {
      const startDateNum = typeof task.start_date === 'string' 
        ? parseInt(task.start_date, 10) 
        : task.start_date;
      task.start_date = new Date(startDateNum).getTime();
    }
    
    if (task.due_date) {
      const dueDateNum = typeof task.due_date === 'string' 
        ? parseInt(task.due_date, 10) 
        : task.due_date;
      task.due_date = new Date(dueDateNum).getTime();
    }

    console.log('Dados processados da tarefa:', {
      start_date_processed: task.start_date,
      due_date_processed: task.due_date
    });

    return task;
  } catch (error) {
    console.error('Erro no getTaskDetails:', error);
    throw error;
  }
}

export async function getCustomFieldsFromLists() {
  try {
    const settings = await getClickUpSettings();
    if (!settings?.api_key) throw new Error('Configurações do ClickUp não encontradas');

    // Busca campos das listas configuradas
    const lists = [
      settings.list_id,
      settings.list_id_clientes_produtos,
      settings.list_id_produtos
    ].filter(Boolean);

    const allFields: Record<string, any> = {};
    
    for (const listId of lists) {
      const response = await fetch(`https://api.clickup.com/api/v2/list/${listId}/field`, {
        headers: {
          'Authorization': settings.api_key,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Erro ao buscar campos da lista ${listId}: ${response.statusText}`);
      }

      const data = await response.json();
      data.fields.forEach((field: any) => {
        allFields[field.id] = field;
      });
    }

    return allFields;
  } catch (error) {
    console.error('Erro ao buscar campos personalizados:', error);
    throw error;
  }
}

export async function getTaskComments(taskId: string): Promise<any[]> {
  try {
    const settings = await getClickUpSettings();
    if (!settings?.api_key) throw new Error('Configurações do ClickUp não encontradas');

    const response = await fetch(`https://api.clickup.com/api/v2/task/${taskId}/comment`, {
      headers: {
        'Authorization': settings.api_key,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Erro ao buscar comentários: ${response.statusText}`);
    }

    const data = await response.json();
    return data.comments || [];
  } catch (error) {
    console.error('Erro no getTaskComments:', error);
    throw error;
  }
}

export async function updateTask(taskId: string, updates: any) {
  try {
    const settings = await getClickUpSettings();
    if (!settings?.api_key) throw new Error('Configurações do ClickUp não encontradas');

    // Preparar payload para campos personalizados
    const customFields = updates.custom_fields?.map((field: any) => ({
      id: field.id,
      value: field.value
    })) || [];

    // Mapear prioridade textual para valores numéricos esperados pela API
    const priorityMap: Record<string, number> = {
      'urgente': 1,
      'alta': 2,
      'normal': 3,
      'baixa': 4
    };

    // Garantir formato correto dos dados principais
    const payload = {
      ...updates,
      custom_fields: customFields,
      status: updates.status?.status || updates.status,
      priority: typeof updates.priority === 'string' 
        ? priorityMap[updates.priority.toLowerCase()] || 3 
        : updates.priority?.priority || updates.priority
    };

    console.log('Payload enviado para atualização:', payload);

    const response = await fetch(`https://api.clickup.com/api/v2/task/${taskId}`, {
      method: 'PUT',
      headers: {
        'Authorization': settings.api_key,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Detalhes do erro:', errorData);
      throw new Error(`Erro ao atualizar tarefa: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Erro detalhado em updateTask:', error);
    throw error;
  }
}

export async function getListStatuses(listId: string) {
  try {
    const settings = await getClickUpSettings();
    if (!settings?.api_key) throw new Error('Configurações do ClickUp não encontradas');

    const response = await fetch(`https://api.clickup.com/api/v2/list/${listId}`, {
      headers: {
        'Authorization': settings.api_key,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Erro ao buscar status da lista: ${response.statusText}`);
    }

    const data = await response.json();
    return data.statuses || [];
  } catch (error) {
    console.error('Erro no getListStatuses:', error);
    throw error;
  }
}

export async function getCustomFieldOptions(fieldId: string) {
  try {
    const settings = await getClickUpSettings();
    if (!settings?.api_key) throw new Error('Configurações do ClickUp não encontradas');

    const response = await fetch(`https://api.clickup.com/api/v2/custom_field/${fieldId}`, {
      headers: {
        'Authorization': settings.api_key,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Erro ao buscar opções do campo: ${response.statusText}`);
    }

    const data = await response.json();
    return data.type_config?.options || [];
  } catch (error) {
    console.error('Erro no getCustomFieldOptions:', error);
    throw error;
  }
}

export async function addTaskComment(taskId: string, commentText: string) {
  try {
    const settings = await getClickUpSettings();
    if (!settings?.api_key) throw new Error('Configurações do ClickUp não encontradas');

    const response = await fetch(`https://api.clickup.com/api/v2/task/${taskId}/comment`, {
      method: 'POST',
      headers: {
        'Authorization': settings.api_key,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        comment_text: commentText,
        notify_all: true
      })
    });

    if (!response.ok) {
      throw new Error(`Erro ao adicionar comentário: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Erro no addTaskComment:', error);
    throw error;
  }
}
