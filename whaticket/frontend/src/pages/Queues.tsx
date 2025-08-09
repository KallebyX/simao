import { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Table from '@/components/ui/Table';
import Modal from '@/components/ui/Modal';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Queue } from '@/types';
import { PlusIcon, PencilIcon, TrashIcon, QueueListIcon } from '@heroicons/react/24/outline';

const Queues = () => {
  const [queues, setQueues] = useState<Queue[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingQueue, setEditingQueue] = useState<Queue | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    color: '#3B82F6',
    greetingMessage: ''
  });

  useEffect(() => {
    const loadQueues = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const mockQueues: Queue[] = [
        {
          id: 1,
          name: 'Suporte',
          color: '#3B82F6',
          greetingMessage: 'Olá! Como posso ajudá-lo?',
          companyId: 1,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        },
        {
          id: 2,
          name: 'Vendas',
          color: '#10B981',
          greetingMessage: 'Bem-vindo ao setor de vendas!',
          companyId: 1,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        },
        {
          id: 3,
          name: 'Financeiro',
          color: '#F59E0B',
          greetingMessage: 'Olá! Departamento financeiro.',
          companyId: 1,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        }
      ];
      
      setQueues(mockQueues);
      setLoading(false);
    };

    loadQueues();
  }, []);

  const handleSave = async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (editingQueue) {
      setQueues(prev => prev.map(q => q.id === editingQueue.id 
        ? { ...q, ...formData, updatedAt: new Date().toISOString() }
        : q
      ));
    } else {
      const newQueue: Queue = {
        id: Date.now(),
        ...formData,
        companyId: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setQueues(prev => [newQueue, ...prev]);
    }
    
    setShowModal(false);
    setEditingQueue(null);
  };

  const columns = [
    {
      key: 'name',
      title: 'Fila',
      render: (value: string, record: Queue) => (
        <div className="flex items-center space-x-3">
          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: record.color }} />
          <span className="font-medium">{value}</span>
        </div>
      )
    },
    {
      key: 'greetingMessage',
      title: 'Mensagem de Saudação',
      render: (value: string) => (
        <span className="text-sm text-gray-600 max-w-xs truncate">{value || '-'}</span>
      )
    },
    {
      key: 'createdAt',
      title: 'Criado em',
      render: (value: string) => new Date(value).toLocaleDateString('pt-BR')
    },
    {
      key: 'actions',
      title: 'Ações',
      render: (value: any, record: Queue) => (
        <div className="flex items-center space-x-2">
          <Button size="sm" variant="ghost" onClick={() => {
            setEditingQueue(record);
            setFormData({
              name: record.name,
              color: record.color,
              greetingMessage: record.greetingMessage || ''
            });
            setShowModal(true);
          }}>
            <PencilIcon className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="ghost">
            <TrashIcon className="w-4 h-4" />
          </Button>
        </div>
      )
    }
  ];

  if (loading) return <div className="flex justify-center h-64 items-center"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Filas Inteligentes</h1>
          <p className="text-gray-600">Organize o atendimento em filas especializadas com IA</p>
        </div>
        <Button onClick={() => {
          setEditingQueue(null);
          setFormData({ name: '', color: '#3B82F6', greetingMessage: '' });
          setShowModal(true);
        }} leftIcon={<PlusIcon className="w-4 h-4" />}>
          Nova Fila
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total de Filas</p>
              <p className="text-2xl font-bold text-gray-900">{queues.length}</p>
            </div>
            <QueueListIcon className="w-8 h-8 text-sky-600" />
          </div>
        </Card>
      </div>

      <Table data={queues} columns={columns} />

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingQueue ? 'Editar Fila' : 'Nova Fila'}
        footer={
          <>
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Nome da Fila"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            required
          />
          <Input
            label="Cor"
            type="color"
            value={formData.color}
            onChange={(e) => setFormData({...formData, color: e.target.value})}
          />
          <Input
            label="Mensagem de Saudação"
            value={formData.greetingMessage}
            onChange={(e) => setFormData({...formData, greetingMessage: e.target.value})}
            placeholder="Mensagem enviada quando o cliente entra na fila"
          />
        </div>
      </Modal>
    </div>
  );
};

export default Queues;