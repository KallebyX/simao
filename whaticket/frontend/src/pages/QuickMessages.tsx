import { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Table from '@/components/ui/Table';
import Modal from '@/components/ui/Modal';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { QuickMessage } from '@/types';
import { PlusIcon, PencilIcon, TrashIcon, BoltIcon } from '@heroicons/react/24/outline';

const QuickMessages = () => {
  const [messages, setMessages] = useState<QuickMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingMessage, setEditingMessage] = useState<QuickMessage | null>(null);
  const [formData, setFormData] = useState({
    shortcode: '',
    message: ''
  });

  useEffect(() => {
    const loadMessages = async () => {
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const mockMessages: QuickMessage[] = [
        {
          id: 1,
          shortcode: '/oi',
          message: 'Olá! Como posso ajudá-lo hoje?',
          companyId: 1,
          geral: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        },
        {
          id: 2,
          shortcode: '/horario',
          message: 'Nosso horário de funcionamento é de segunda a sexta, das 8h às 18h.',
          companyId: 1,
          geral: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        },
        {
          id: 3,
          shortcode: '/obrigado',
          message: 'Obrigado pelo contato! Tenha um ótimo dia!',
          companyId: 1,
          geral: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        }
      ];
      
      setMessages(mockMessages);
      setLoading(false);
    };

    loadMessages();
  }, []);

  const handleSave = async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (editingMessage) {
      setMessages(prev => prev.map(m => m.id === editingMessage.id 
        ? { ...m, ...formData, updatedAt: new Date().toISOString() }
        : m
      ));
    } else {
      const newMessage: QuickMessage = {
        id: Date.now(),
        ...formData,
        companyId: 1,
        geral: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setMessages(prev => [newMessage, ...prev]);
    }
    
    setShowModal(false);
    setEditingMessage(null);
    setFormData({ shortcode: '', message: '' });
  };

  const columns = [
    {
      key: 'shortcode',
      title: 'Atalho',
      render: (value: string) => (
        <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">{value}</code>
      )
    },
    {
      key: 'message',
      title: 'Mensagem',
      render: (value: string) => (
        <span className="text-sm text-gray-900 max-w-md truncate">{value}</span>
      )
    },
    {
      key: 'geral',
      title: 'Tipo',
      render: (value: boolean) => value ? 'Geral' : 'Pessoal'
    },
    {
      key: 'actions',
      title: 'Ações',
      render: (value: any, record: QuickMessage) => (
        <div className="flex items-center space-x-2">
          <Button size="sm" variant="ghost" onClick={() => {
            setEditingMessage(record);
            setFormData({
              shortcode: record.shortcode,
              message: record.message
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
          <h1 className="text-2xl font-bold text-gray-900">Mensagens Rápidas</h1>
          <p className="text-gray-600">Crie atalhos para mensagens frequentes</p>
        </div>
        <Button onClick={() => {
          setEditingMessage(null);
          setFormData({ shortcode: '', message: '' });
          setShowModal(true);
        }} leftIcon={<PlusIcon className="w-4 h-4" />}>
          Nova Mensagem
        </Button>
      </div>

      <Card className="p-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <BoltIcon className="w-5 h-5 text-blue-400 mt-0.5" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Como usar</h3>
              <p className="text-sm text-blue-700 mt-1">
                Digite o atalho (ex: /oi) no campo de mensagem para inserir automaticamente o texto completo.
              </p>
            </div>
          </div>
        </div>
      </Card>

      <Table data={messages} columns={columns} />

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingMessage ? 'Editar Mensagem' : 'Nova Mensagem'}
        footer={
          <>
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Atalho"
            placeholder="/exemplo"
            value={formData.shortcode}
            onChange={(e) => setFormData({...formData, shortcode: e.target.value})}
            required
          />
          <Textarea
            label="Mensagem"
            placeholder="Digite a mensagem que será inserida..."
            value={formData.message}
            onChange={(e) => setFormData({...formData, message: e.target.value})}
            required
          />
        </div>
      </Modal>
    </div>
  );
};

export default QuickMessages;