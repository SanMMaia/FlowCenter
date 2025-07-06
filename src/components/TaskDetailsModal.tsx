'use client';

import { Modal, Button } from 'react-bootstrap';
import { useState, useEffect } from 'react';
import { getTaskDetails, getCustomFieldsFromLists, getTaskComments, updateTask, getListStatuses, getCustomFieldOptions, addTaskComment } from '@/services/clickupService';

const getContrastColor = (hexColor: string) => {
  // Converte hex para RGB e calcula brilho
  const r = parseInt(hexColor.substr(1, 2), 16);
  const g = parseInt(hexColor.substr(3, 2), 16);
  const b = parseInt(hexColor.substr(5, 2), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128 ? '#000000' : '#ffffff';
};

const statusColors: Record<string, string> = {
  'normal': '#008844',
  'ativo': '#008844',
  'acompanhamento': '#1090e0',
  'inativo': '#dc3545'
};

type TaskDetailsModalProps = {
  taskId: string;
  show: boolean;
  onHide: () => void;
};

export default function TaskDetailsModal({ taskId, show, onHide }: TaskDetailsModalProps) {
  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [customFieldsConfig, setCustomFieldsConfig] = useState<Record<string, any>>({});
  const [customFieldOptions, setCustomFieldOptions] = useState<Record<string, any[]>>({});
  const [comments, setComments] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editableTask, setEditableTask] = useState<any>(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [statuses, setStatuses] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);

  const handleSave = async () => {
    try {
      setSaveLoading(true);
      setSaveError('');
      
      const updates = {
        name: editableTask.name,
        status: editableTask.status,
        priority: editableTask.priority || 3, // Garantir envio da prioridade
        assignees: editableTask.assignees,
        due_date: editableTask.due_date,
        custom_fields: editableTask.custom_fields
      };
      
      await updateTask(taskId, updates);
      await fetchTaskDetails();
      setIsEditing(false);
    } catch (error) {
      setSaveError('Erro ao salvar tarefa');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleEditToggle = async () => {
    console.log('Valores atuais da tarefa (antes de editar):', {
      start_date: task.start_date,
      due_date: task.due_date,
      type_start_date: typeof task.start_date,
      type_due_date: typeof task.due_date
    });

    if (isEditing) {
      // Cancelar edição
      setIsEditing(false);
      setSaveError('');
    } else {
      // Iniciar edição - copiar dados atuais para estado editável
      const newEditableTask = {
        ...task,
        start_date: task.start_date !== undefined && task.start_date !== null 
          ? task.start_date 
          : null,
        due_date: task.due_date !== undefined && task.due_date !== null 
          ? task.due_date 
          : null,
        priority: task.priority || 3 // Valor padrão 3 (Normal) se não houver prioridade
      };
      
      console.log('Novo estado editável:', {
        editable_start_date: newEditableTask.start_date,
        editable_due_date: newEditableTask.due_date
      });
      
      setEditableTask(newEditableTask);
      setIsEditing(true);
    }
  };

  const handleFieldChange = (field: string, value: any) => {
    setEditableTask({
      ...editableTask,
      [field]: value
    });
  };

  useEffect(() => {
    if (show && taskId) {
      const fetchData = async () => {
        try {
          const fields = await getCustomFieldsFromLists();
          setCustomFieldsConfig(fields);
          await fetchTaskDetails();
        } catch (error) {
          console.error('Erro ao buscar campos:', error);
        }
      };
      fetchData();
    }
  }, [show, taskId]);

  const fetchTaskDetails = async () => {
    try {
      setLoading(true);
      const [taskDetails, taskComments] = await Promise.all([
        getTaskDetails(taskId),
        getTaskComments(taskId)
      ]);
      setTask(taskDetails);
      setComments(taskComments);
      
      // Buscar opções dos campos personalizados
      try {
        const fieldsWithOptions = taskDetails.custom_fields.filter((f: any) => f.type_config?.options);
        const optionsPromises = fieldsWithOptions.map(async (field: any) => {
          const options = await getCustomFieldOptions(field.id);
          return { fieldId: field.id, options };
        });
        
        const optionsResults = await Promise.all(optionsPromises);
        const optionsMap = optionsResults.reduce((acc, curr) => ({
          ...acc,
          [curr.fieldId]: curr.options
        }), {});
        
        setCustomFieldOptions(optionsMap);
      } catch (error) {
        console.error('Erro ao buscar opções de campos personalizados:', error);
      }
    } catch (err) {
      console.error('Erro ao buscar detalhes da tarefa:', err);
      setError('Erro ao carregar detalhes da tarefa');
    } finally {
      setLoading(false);
    }
  };

  // Função auxiliar para formatar datas com segurança
  const formatDateSafe = (dateValue: string | number) => {
    try {
      // Converter string de timestamp para número se necessário
      const timestamp = typeof dateValue === 'string' 
        ? parseInt(dateValue, 10)
        : dateValue;
        
      const date = new Date(timestamp);
      
      return isNaN(date.getTime()) 
        ? 'Data não informada' 
        : new Intl.DateTimeFormat('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }).format(date);
    } catch {
      return 'Data não informada';
    }
  };

  const renderFieldValue = (value: any) => {
    if (!value) return 'Não informado';
    
    if (typeof value === 'string' || typeof value === 'number') {
      return value;
    }
    
    if (Array.isArray(value)) {
      return (
        <div className="d-flex flex-wrap gap-1">
          {value.map((item) => (
            <span key={item.id} className="badge bg-secondary">
              {item.name || item.label || item.id}
            </span>
          ))}
        </div>
      );
    }
    
    if (typeof value === 'object') {
      return value.name || value.label || value.id || 'Valor inválido';
    }
    
    return 'Não informado';
  };

  useEffect(() => {
    const atendimentosListId = '901110669359';
    const fetchListStatuses = async () => {
      try {
        const listStatuses = await getListStatuses(atendimentosListId);
        setStatuses(listStatuses);
      } catch (error) {
        console.error('Erro ao buscar status da lista:', error);
      }
    };
    fetchListStatuses();
  }, []);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    
    try {
      setCommentLoading(true);
      await addTaskComment(taskId, newComment);
      
      // Atualizar lista de comentários
      const updatedComments = await getTaskComments(taskId);
      setComments(updatedComments);
      
      setNewComment('');
    } catch (error) {
      console.error('Erro ao adicionar comentário:', error);
      setError('Erro ao adicionar comentário');
    } finally {
      setCommentLoading(false);
    }
  };

  return (
    <Modal 
      show={show} 
      onHide={onHide}
      size="xl"
      className="modal-opaque"
      contentClassName="bg-white"
    >
      <Modal.Header closeButton className="bg-light">
        <Modal.Title>{task?.name || 'Detalhes da Tarefa'}</Modal.Title>
      </Modal.Header>
      <Modal.Body className="bg-white p-0" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
        {loading && <div>Carregando...</div>}
        {error && <div className="alert alert-danger">{error}</div>}
        {task && (
          <div className="container-fluid h-100">
            <div className="row g-0 h-100">
              {/* Coluna esquerda - Informações da tarefa */}
              <div className="col-md-6 p-3 border-end">
                {/* Descrição */}
                <div className="mb-4">
                  <h6 className="fw-bold border-bottom pb-2">Descrição</h6>
                  {isEditing ? (
                    <textarea
                      className="form-control"
                      rows={5}
                      value={editableTask?.description || ''}
                      onChange={(e) => handleFieldChange('description', e.target.value)}
                    />
                  ) : (
                    <div className="bg-light p-3 rounded" dangerouslySetInnerHTML={{__html: task.description || 'Sem descrição'}} />
                  )}
                </div>

                {/* Datas unificadas */}
                <div className="mb-4">
                  <h6 className="fw-bold border-bottom pb-2">Datas</h6>
                  <div className="row">
                    <div className="col-md-6">
                      {isEditing ? (
                        <div className="mb-3">
                          <label className="form-label">Início</label>
                          <input
                            type="datetime-local"
                            className="form-control"
                            value={editableTask?.start_date && !isNaN(new Date(editableTask.start_date).getTime()) 
                              ? new Date(editableTask.start_date).toISOString().slice(0, 16) 
                              : ''}
                            onChange={(e) => {
                              const dateValue = new Date(e.target.value);
                              handleFieldChange('start_date', !isNaN(dateValue.getTime()) ? dateValue.getTime() : null);
                            }}
                          />
                        </div>
                      ) : (
                        <p><strong>Início:</strong> {task.start_date ? formatDateSafe(task.start_date) : 'Não informada'}</p>
                      )}
                    </div>
                    <div className="col-md-6">
                      {isEditing ? (
                        <div className="mb-3">
                          <label className="form-label">Vencimento</label>
                          <input
                            type="datetime-local"
                            className="form-control"
                            value={editableTask?.due_date && !isNaN(new Date(editableTask.due_date).getTime()) 
                              ? new Date(editableTask.due_date).toISOString().slice(0, 16) 
                              : ''}
                            onChange={(e) => {
                              const dateValue = new Date(e.target.value);
                              handleFieldChange('due_date', !isNaN(dateValue.getTime()) ? dateValue.getTime() : null);
                            }}
                          />
                        </div>
                      ) : (
                        <p><strong>Vencimento:</strong> {task.due_date ? formatDateSafe(task.due_date) : 'Não informada'}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Informações Básicas */}
                <div className="mb-4">
                  <h6 className="fw-bold border-bottom pb-2">Informações</h6>
                  <div className="row">
                    <div className="col-md-6">
                      {isEditing ? (
                        <div className="mb-3">
                          <label className="form-label">Status</label>
                          <select
                            className="form-select"
                            value={editableTask?.status?.status || ''}
                            onChange={(e) => handleFieldChange('status', { status: e.target.value })}
                          >
                            <option value="">Selecione...</option>
                            {statuses.map((status) => (
                              <option key={status.id} value={status.status}>{status.status}</option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <p><strong>Status:</strong> {task.status?.status || 'Não definido'}</p>
                      )}
                    </div>
                    <div className="col-md-6">
                      {isEditing ? (
                        <div className="mb-3">
                          <label className="form-label">Prioridade</label>
                          <select
                            className="form-select"
                            value={editableTask?.priority || ''}
                            onChange={(e) => handleFieldChange('priority', e.target.value)}
                          >
                            <option value="">Selecione...</option>
                            <option value="urgente">Urgente</option>
                            <option value="alta">Alta</option>
                            <option value="normal">Normal</option>
                            <option value="baixa">Baixa</option>
                          </select>
                        </div>
                      ) : (
                        <p><strong>Prioridade:</strong> {task.priority?.priority || 'Não definida'}</p>
                      )}
                    </div>
                    <div className="col-md-12">
                      {isEditing ? (
                        <div className="mb-3">
                          <label className="form-label">Responsável</label>
                          <input
                            type="text"
                            className="form-control"
                            value={editableTask.assignees?.map((a: any) => a.username).join(', ') || ''}
                            onChange={(e) => {
                              const newAssignees = e.target.value.split(',').map((email: string) => ({
                                username: email.trim()
                              }));
                              handleFieldChange('assignees', newAssignees);
                            }}
                            placeholder="Digite e-mails separados por vírgula"
                          />
                        </div>
                      ) : (
                        <p><strong>Responsável:</strong> {task.assignees?.map((a: {username: string}) => a.username).join(', ') || 'Não atribuído'}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Campos Personalizados */}
                {task.custom_fields && (
                  <div className="mb-4">
                    <h6 className="fw-bold border-bottom pb-2">Campos Personalizados</h6>
                    <div className="row">
                      {task.custom_fields.map((field: any) => {
                        const fieldConfig = customFieldsConfig[field.id];
                        
                        return (
                          <div key={field.id} className="col-md-6 mb-3">
                            {isEditing ? (
                              <div>
                                <label className="form-label">{fieldConfig?.name || field.id}</label>
                                {customFieldOptions[field.id] ? (
                                  <select
                                    className="form-select"
                                    value={editableTask.custom_fields.find((f: any) => f.id === field.id)?.value || ''}
                                    onChange={(e) => {
                                      const updatedFields = editableTask.custom_fields.map((f: any) => 
                                        f.id === field.id ? { ...f, value: e.target.value } : f
                                      );
                                      handleFieldChange('custom_fields', updatedFields);
                                    }}
                                  >
                                    <option value="">Selecione...</option>
                                    {customFieldOptions[field.id].map((option) => (
                                      <option key={option.id} value={option.id}>{option.name}</option>
                                    ))}
                                  </select>
                                ) : (
                                  <input
                                    type="text"
                                    className="form-control"
                                    value={editableTask.custom_fields.find((f: any) => f.id === field.id)?.value || ''}
                                    onChange={(e) => {
                                      const updatedFields = editableTask.custom_fields.map((f: any) => 
                                        f.id === field.id ? { ...f, value: e.target.value } : f
                                      );
                                      handleFieldChange('custom_fields', updatedFields);
                                    }}
                                  />
                                )}
                              </div>
                            ) : (
                              <div className="mb-2">
                                <strong>{fieldConfig?.name || field.id}:</strong>
                                <div className="mt-1">
                                  {renderFieldValue(field.value)}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Coluna direita - Comentários */}
              <div className="col-md-6 p-3">
                <div className="h-100 d-flex flex-column">
                  <h6 className="fw-bold border-bottom pb-2 mb-3">Comentários</h6>
                  <div className="flex-grow-1 overflow-auto">
                    {comments.length > 0 ? (
                      comments.map((comment) => (
                        <div key={comment.id} className="mb-3 p-3 bg-light rounded">
                          <div className="d-flex justify-content-between mb-2">
                            <strong>{comment.user?.username || 'Usuário'}</strong>
                            <small className="text-muted">
                              {formatDateSafe(comment.date)}
                            </small>
                          </div>
                          <div dangerouslySetInnerHTML={{__html: comment.comment_text}} />
                        </div>
                      ))
                    ) : (
                      <div className="text-muted text-center py-4">Nenhum comentário encontrado</div>
                    )}
                  </div>
                  <div className="mb-3">
                    <textarea
                      className="form-control"
                      rows={3}
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Digite um novo comentário..."
                    />
                  </div>
                  <Button variant="primary" onClick={handleAddComment} disabled={commentLoading}>
                    {commentLoading ? 'Enviando...' : 'Enviar Comentário'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Fechar
        </Button>
        <Button variant="primary" onClick={handleEditToggle} disabled={saveLoading}>
          {isEditing ? 'Cancelar Edição' : 'Editar'}
        </Button>
        <Button variant="primary" onClick={handleSave} disabled={!isEditing || saveLoading}>
          {saveLoading ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
        {saveError && <div className="text-danger mt-2">{saveError}</div>}
      </Modal.Footer>
    </Modal>
  );
}
