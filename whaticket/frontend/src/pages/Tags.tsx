import { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Table from '@/components/ui/Table';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Tag } from '@/types';
import { PlusIcon, PencilIcon, TrashIcon, TagIcon } from '@heroicons/react/24/outline';

const Tags = () => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    color: '#3B82F6'
  });

  useEffect(() => {
    const loadTags = async () => {
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const mockTags: Tag[] = [
        {
          id: 1,
          name: 'VIP',
          color: '#F59E0B',
          companyId: 1,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        },
        {
          id: 2,
          name: 'Cliente Premium',
          color: '#10B981',
          companyId: 1,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        },
        {
          id: 3,
          name: 'Urgente',
          color: '#EF4444',
          companyId: 1,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        }
      ];
      
      setTags(mockTags);
      setLoading(false);
    };

    loadTags();
  }, []);

  const handleSave = async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (editingTag) {
      setTags(prev => prev.map(t => t.id === editingTag.id 
        ? { ...t, ...formData, updatedAt: new Date().toISOString() }
        : t
      ));
    } else {
      const newTag: Tag = {
        id: Date.now(),
        ...formData,
        companyId: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setTags(prev => [newTag, ...prev]);
    }
    
    setShowModal(false);
    setEditingTag(null);
    setFormData({ name: '', color: '#3B82F6' });
  };

  const columns = [
    {
      key: 'name',
      title: 'Tag',
      render: (value: string, record: Tag) => (
        <Badge className="text-white" style={{ backgroundColor: record.color }}>
          {value}
        </Badge>
      )
    },
    {
      key: 'color',
      title: 'Cor',
      render: (value: string) => (
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: value }} />
          <span className="text-sm font-mono text-gray-600">{value}</span>
        </div>
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
      render: (value: any, record: Tag) => (
        <div className="flex items-center space-x-2">
          <Button size="sm" variant="ghost" onClick={() => {
            setEditingTag(record);
            setFormData({ name: record.name, color: record.color });
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
          <h1 className="text-2xl font-bold text-gray-900">Tags</h1>
          <p className="text-gray-600">Organize contatos e tickets com tags</p>
        </div>
        <Button onClick={() => {
          setEditingTag(null);
          setFormData({ name: '', color: '#3B82F6' });
          setShowModal(true);
        }} leftIcon={<PlusIcon className="w-4 h-4" />}>
          Nova Tag
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total de Tags</p>
              <p className="text-2xl font-bold text-gray-900">{tags.length}</p>
            </div>
            <TagIcon className="w-8 h-8 text-sky-600" />
          </div>
        </Card>
      </div>

      <Table data={tags} columns={columns} />

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingTag ? 'Editar Tag' : 'Nova Tag'}
        footer={
          <>
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Nome da Tag"
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
          <div className="preview">
            <p className="text-sm text-gray-600 mb-2">Preview:</p>
            <Badge className="text-white" style={{ backgroundColor: formData.color }}>
              {formData.name || 'Nome da Tag'}
            </Badge>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Tags;