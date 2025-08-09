import { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Table from '@/components/ui/Table';
import Modal, { ModalConfirm } from '@/components/ui/Modal';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { User, UserFormData } from '@/types';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  UserIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

const Users = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    email: '',
    password: '',
    profile: 'user',
    queueIds: [],
    startWork: '',
    endWork: ''
  });

  // Load users
  useEffect(() => {
    const loadUsers = async () => {
      setLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockUsers: User[] = [
        {
          id: 1,
          name: 'Admin Sistema',
          email: 'admin@admin.com',
          profile: 'admin',
          companyId: 1,
          queues: [],
          startWork: '08:00',
          endWork: '18:00',
          allTicket: 'enabled',
          tokenVersion: 0,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        },
        {
          id: 2,
          name: 'Maria Santos',
          email: 'maria@example.com',
          profile: 'user',
          companyId: 1,
          queues: [
            { id: 1, name: 'Suporte', color: '#3B82F6', companyId: 1, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' }
          ],
          startWork: '09:00',
          endWork: '17:00',
          allTicket: 'disabled',
          tokenVersion: 1,
          createdAt: '2024-01-02T00:00:00Z',
          updatedAt: '2024-01-02T00:00:00Z'
        },
        {
          id: 3,
          name: 'Carlos Oliveira',
          email: 'carlos@example.com',
          profile: 'supervisor',
          companyId: 1,
          queues: [
            { id: 1, name: 'Suporte', color: '#3B82F6', companyId: 1, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
            { id: 2, name: 'Vendas', color: '#10B981', companyId: 1, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' }
          ],
          startWork: '08:30',
          endWork: '17:30',
          allTicket: 'enabled',
          tokenVersion: 2,
          createdAt: '2024-01-03T00:00:00Z',
          updatedAt: '2024-01-03T00:00:00Z'
        }
      ];
      
      setUsers(mockUsers);
      setLoading(false);
    };

    loadUsers();
  }, []);

  const handleOpenModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name,
        email: user.email,
        password: '',
        profile: user.profile,
        queueIds: user.queues?.map(q => q.id) || [],
        startWork: user.startWork || '',
        endWork: user.endWork || ''
      });
    } else {
      setEditingUser(null);
      setFormData({
        name: '',
        email: '',
        password: '',
        profile: 'user',
        queueIds: [],
        startWork: '',
        endWork: ''
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      profile: 'user',
      queueIds: [],
      startWork: '',
      endWork: ''
    });
  };

  const handleSave = async () => {
    setSaving(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (editingUser) {
      // Update existing user
      setUsers(prev => 
        prev.map(user => 
          user.id === editingUser.id 
            ? { 
                ...user, 
                name: formData.name,
                email: formData.email,
                profile: formData.profile,
                startWork: formData.startWork,
                endWork: formData.endWork,
                updatedAt: new Date().toISOString()
              }
            : user
        )
      );
    } else {
      // Create new user
      const newUser: User = {
        id: Date.now(),
        name: formData.name,
        email: formData.email,
        profile: formData.profile,
        companyId: 1,
        queues: [],
        startWork: formData.startWork,
        endWork: formData.endWork,
        allTicket: 'disabled',
        tokenVersion: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      setUsers(prev => [newUser, ...prev]);
    }
    
    setSaving(false);
    handleCloseModal();
  };

  const handleDelete = (user: User) => {
    setDeletingUser(user);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (deletingUser) {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setUsers(prev => prev.filter(user => user.id !== deletingUser.id));
      setShowDeleteConfirm(false);
      setDeletingUser(null);
    }
  };

  const getProfileBadge = (profile: string) => {
    switch (profile) {
      case 'admin':
        return <Badge variant="danger">Administrador</Badge>;
      case 'supervisor':
        return <Badge variant="warning">Supervisor</Badge>;
      case 'user':
        return <Badge variant="primary">Usuário</Badge>;
      default:
        return <Badge>{profile}</Badge>;
    }
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    {
      key: 'name',
      title: 'Usuário',
      render: (value: string, record: User) => (
        <div className="flex items-center space-x-3">
          <Avatar name={record.name} size="sm" />
          <div>
            <div className="font-medium text-gray-900">{record.name}</div>
            <div className="text-sm text-gray-500">{record.email}</div>
          </div>
        </div>
      )
    },
    {
      key: 'profile',
      title: 'Perfil',
      render: (value: string) => getProfileBadge(value)
    },
    {
      key: 'queues',
      title: 'Filas',
      render: (value: any, record: User) => (
        <div className="flex flex-wrap gap-1">
          {record.queues?.slice(0, 2).map((queue, index) => (
            <Badge
              key={index}
              size="sm"
              className="text-white"
              style={{ backgroundColor: queue.color }}
            >
              {queue.name}
            </Badge>
          ))}
          {record.queues && record.queues.length > 2 && (
            <Badge size="sm" variant="secondary">
              +{record.queues.length - 2}
            </Badge>
          )}
          {(!record.queues || record.queues.length === 0) && (
            <span className="text-sm text-gray-400">Nenhuma</span>
          )}
        </div>
      )
    },
    {
      key: 'workHours',
      title: 'Horário',
      render: (value: any, record: User) => {
        if (record.startWork && record.endWork) {
          return (
            <span className="text-sm text-gray-900">
              {record.startWork} - {record.endWork}
            </span>
          );
        }
        return <span className="text-sm text-gray-400">Não definido</span>;
      }
    },
    {
      key: 'status',
      title: 'Status',
      render: (value: any, record: User) => (
        <Badge variant="success">Online</Badge>
      )
    },
    {
      key: 'actions',
      title: 'Ações',
      render: (value: any, record: User) => (
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleOpenModal(record)}
            leftIcon={<PencilIcon className="w-4 h-4" />}
          />
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleDelete(record)}
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
          <h1 className="text-2xl font-bold text-gray-900">Usuários</h1>
          <p className="text-gray-600">Gerencie usuários e permissões do BusinessAI</p>
        </div>
        <Button
          onClick={() => handleOpenModal()}
          leftIcon={<PlusIcon className="w-4 h-4" />}
        >
          Novo Usuário
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{users.length}</p>
            </div>
            <div className="p-3 bg-sky-100 rounded-full">
              <UserIcon className="w-6 h-6 text-sky-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Administradores</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter(u => u.profile === 'admin').length}
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <ShieldCheckIcon className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Supervisores</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter(u => u.profile === 'supervisor').length}
              </p>
            </div>
            <div className="p-3 bg-amber-100 rounded-full">
              <UserIcon className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Usuários</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter(u => u.profile === 'user').length}
              </p>
            </div>
            <div className="p-3 bg-emerald-100 rounded-full">
              <UserIcon className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Search */}
      <Card className="p-4">
        <Input
          placeholder="Buscar usuários..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          leftIcon={<MagnifyingGlassIcon />}
          className="max-w-md"
        />
      </Card>

      {/* Users Table */}
      <Table
        data={filteredUsers}
        columns={columns}
        emptyMessage="Nenhum usuário encontrado"
      />

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingUser ? 'Editar Usuário' : 'Novo Usuário'}
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={handleCloseModal}>
              Cancelar
            </Button>
            <Button onClick={handleSave} loading={saving}>
              {editingUser ? 'Salvar' : 'Criar'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Nome"
            placeholder="Nome do usuário"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <Input
            label="E-mail"
            type="email"
            placeholder="usuario@example.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />

          <Input
            label={editingUser ? "Nova Senha (deixe vazio para manter)" : "Senha"}
            type="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required={!editingUser}
          />

          <Select
            label="Perfil"
            value={formData.profile}
            onChange={(e) => setFormData({ ...formData, profile: e.target.value as any })}
            options={[
              { value: 'user', label: 'Usuário' },
              { value: 'supervisor', label: 'Supervisor' },
              { value: 'admin', label: 'Administrador' }
            ]}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Início do Expediente"
              type="time"
              value={formData.startWork}
              onChange={(e) => setFormData({ ...formData, startWork: e.target.value })}
            />

            <Input
              label="Fim do Expediente"
              type="time"
              value={formData.endWork}
              onChange={(e) => setFormData({ ...formData, endWork: e.target.value })}
            />
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ModalConfirm
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDelete}
        title="Excluir Usuário"
        message={`Tem certeza que deseja excluir o usuário "${deletingUser?.name}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        variant="danger"
      />
    </div>
  );
};

export default Users;