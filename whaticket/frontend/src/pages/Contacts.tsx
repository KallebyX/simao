import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Table from '@/components/ui/Table';
import Modal from '@/components/ui/Modal';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Contact, ContactFormData } from '@/types';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  EyeIcon,
  TrashIcon,
  UserIcon
} from '@heroicons/react/24/outline';

const Contacts = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    number: '',
    email: '',
    extraInfo: []
  });

  // Load contacts
  useEffect(() => {
    const loadContacts = async () => {
      setLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockContacts: Contact[] = [
        {
          id: 1,
          name: 'João Silva',
          number: '5511999999999',
          profilePicUrl: '',
          isGroup: false,
          companyId: 1,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          extraInfo: [
            { id: 1, name: 'Email', value: 'joao@example.com', contactId: 1 },
            { id: 2, name: 'Empresa', value: 'Tech Corp', contactId: 1 }
          ],
          tags: [
            { id: 1, name: 'VIP', color: '#F59E0B', companyId: 1, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' }
          ]
        },
        {
          id: 2,
          name: 'Maria Santos',
          number: '5511888888888',
          profilePicUrl: '',
          isGroup: false,
          companyId: 1,
          createdAt: '2024-01-02T00:00:00Z',
          updatedAt: '2024-01-02T00:00:00Z',
          extraInfo: [
            { id: 3, name: 'Email', value: 'maria@example.com', contactId: 2 }
          ],
          tags: []
        },
        {
          id: 3,
          name: 'Pedro Costa',
          number: '5511777777777',
          profilePicUrl: '',
          isGroup: false,
          companyId: 1,
          createdAt: '2024-01-03T00:00:00Z',
          updatedAt: '2024-01-03T00:00:00Z',
          extraInfo: [],
          tags: [
            { id: 2, name: 'Cliente', color: '#10B981', companyId: 1, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' }
          ]
        },
        {
          id: 4,
          name: 'Grupo Vendas',
          number: '5511666666666',
          profilePicUrl: '',
          isGroup: true,
          companyId: 1,
          createdAt: '2024-01-04T00:00:00Z',
          updatedAt: '2024-01-04T00:00:00Z',
          extraInfo: [],
          tags: []
        }
      ];
      
      setContacts(mockContacts);
      setLoading(false);
    };

    loadContacts();
  }, []);

  const handleOpenModal = (contact?: Contact) => {
    if (contact) {
      setEditingContact(contact);
      setFormData({
        name: contact.name,
        number: contact.number,
        email: contact.extraInfo?.find(info => info.name === 'Email')?.value || '',
        extraInfo: contact.extraInfo?.map(info => ({ name: info.name, value: info.value })) || []
      });
    } else {
      setEditingContact(null);
      setFormData({
        name: '',
        number: '',
        email: '',
        extraInfo: []
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingContact(null);
    setFormData({
      name: '',
      number: '',
      email: '',
      extraInfo: []
    });
  };

  const handleSave = async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (editingContact) {
      // Update existing contact
      setContacts(prev => 
        prev.map(contact => 
          contact.id === editingContact.id 
            ? { 
                ...contact, 
                name: formData.name,
                number: formData.number,
                updatedAt: new Date().toISOString()
              }
            : contact
        )
      );
    } else {
      // Create new contact
      const newContact: Contact = {
        id: Date.now(),
        name: formData.name,
        number: formData.number,
        profilePicUrl: '',
        isGroup: false,
        companyId: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        extraInfo: [],
        tags: []
      };
      
      setContacts(prev => [newContact, ...prev]);
    }
    
    handleCloseModal();
  };

  const handleDelete = async (contactId: number) => {
    if (window.confirm('Tem certeza que deseja excluir este contato?')) {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setContacts(prev => prev.filter(contact => contact.id !== contactId));
    }
  };

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.number.includes(searchTerm)
  );

  const columns = [
    {
      key: 'name',
      title: 'Contato',
      render: (value: string, record: Contact) => (
        <div className="flex items-center space-x-3">
          <Avatar
            name={record.name}
            size="sm"
            src={record.profilePicUrl}
          />
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-medium text-gray-900">{record.name}</span>
              {record.isGroup && (
                <Badge variant="info" size="sm">Grupo</Badge>
              )}
            </div>
            <span className="text-sm text-gray-500">{record.number}</span>
          </div>
        </div>
      )
    },
    {
      key: 'email',
      title: 'E-mail',
      render: (value: any, record: Contact) => {
        const email = record.extraInfo?.find(info => info.name === 'Email')?.value;
        return email ? (
          <span className="text-sm text-gray-900">{email}</span>
        ) : (
          <span className="text-sm text-gray-400">-</span>
        );
      }
    },
    {
      key: 'tags',
      title: 'Tags',
      render: (value: any, record: Contact) => (
        <div className="flex flex-wrap gap-1">
          {record.tags?.map((tag, index) => (
            <Badge
              key={index}
              size="sm"
              className="text-white"
              style={{ backgroundColor: tag.color }}
            >
              {tag.name}
            </Badge>
          ))}
        </div>
      )
    },
    {
      key: 'createdAt',
      title: 'Criado em',
      render: (value: string) => (
        <span className="text-sm text-gray-500">
          {new Date(value).toLocaleDateString('pt-BR')}
        </span>
      )
    },
    {
      key: 'actions',
      title: 'Ações',
      render: (value: any, record: Contact) => (
        <div className="flex items-center space-x-2">
          <Link to={`/contacts/${record.id}`}>
            <Button
              size="sm"
              variant="ghost"
              leftIcon={<EyeIcon className="w-4 h-4" />}
            />
          </Link>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleOpenModal(record)}
            leftIcon={<PencilIcon className="w-4 h-4" />}
          />
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleDelete(record.id)}
            leftIcon={<TrashIcon className="w-4 h-4" />}
          />
        </div>
      )
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contatos</h1>
          <p className="text-gray-600">Gerencie seus contatos e clientes inteligentemente</p>
        </div>
        <Button
          onClick={() => handleOpenModal()}
          leftIcon={<PlusIcon className="w-4 h-4" />}
        >
          Novo Contato
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total de Contatos</p>
              <p className="text-2xl font-bold text-gray-900">{contacts.length}</p>
            </div>
            <div className="p-3 bg-sky-100 rounded-full">
              <UserIcon className="w-6 h-6 text-sky-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Contatos Individuais</p>
              <p className="text-2xl font-bold text-gray-900">
                {contacts.filter(c => !c.isGroup).length}
              </p>
            </div>
            <div className="p-3 bg-emerald-100 rounded-full">
              <UserIcon className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Grupos</p>
              <p className="text-2xl font-bold text-gray-900">
                {contacts.filter(c => c.isGroup).length}
              </p>
            </div>
            <div className="p-3 bg-amber-100 rounded-full">
              <UserIcon className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Search */}
      <Card className="p-4">
        <Input
          placeholder="Buscar contatos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          leftIcon={<MagnifyingGlassIcon />}
          className="max-w-md"
        />
      </Card>

      {/* Contacts Table */}
      <Table
        data={filteredContacts}
        columns={columns}
        emptyMessage="Nenhum contato encontrado"
      />

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingContact ? 'Editar Contato' : 'Novo Contato'}
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={handleCloseModal}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              {editingContact ? 'Salvar' : 'Criar'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Nome"
            placeholder="Nome do contato"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <Input
            label="Telefone"
            placeholder="5511999999999"
            value={formData.number}
            onChange={(e) => setFormData({ ...formData, number: e.target.value })}
            required
          />

          <Input
            label="E-mail"
            type="email"
            placeholder="contato@example.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>
      </Modal>
    </div>
  );
};

export default Contacts;