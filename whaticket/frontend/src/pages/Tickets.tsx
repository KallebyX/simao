import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSocket } from '@/hooks/useSocket';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Badge from '@/components/ui/Badge';
import Avatar from '@/components/ui/Avatar';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Ticket, TicketFilters } from '@/types';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  UserIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

const Tickets = () => {
  const { user, hasPermission } = useAuth();
  const { onTicketUpdate } = useSocket();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  
  const [filters, setFilters] = useState<TicketFilters>({
    status: undefined,
    userId: undefined,
    queueId: undefined,
    search: '',
    showAll: hasPermission('ticket:all')
  });

  // Mock data for now - replace with real API call
  useEffect(() => {
    const loadTickets = async () => {
      setLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockTickets: Ticket[] = [
        {
          id: 1,
          status: 'open',
          lastMessage: 'Olá, preciso de ajuda com meu pedido',
          contactId: 1,
          userId: 1,
          whatsappId: 1,
          companyId: 1,
          queueId: 1,
          isGroup: false,
          unreadMessages: 3,
          createdAt: '2024-01-08T10:30:00Z',
          updatedAt: '2024-01-08T10:35:00Z',
          contact: {
            id: 1,
            name: 'João Silva',
            number: '5511999999999',
            isGroup: false,
            companyId: 1,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z'
          },
          user: {
            id: 1,
            name: 'Maria Santos',
            email: 'maria@example.com',
            profile: 'user',
            companyId: 1,
            queues: [],
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z'
          },
          queue: {
            id: 1,
            name: 'Suporte',
            color: '#3B82F6',
            companyId: 1,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z'
          }
        },
        {
          id: 2,
          status: 'pending',
          lastMessage: 'Quando vai chegar minha encomenda?',
          contactId: 2,
          whatsappId: 1,
          companyId: 1,
          queueId: 2,
          isGroup: false,
          unreadMessages: 1,
          createdAt: '2024-01-08T09:15:00Z',
          updatedAt: '2024-01-08T09:20:00Z',
          contact: {
            id: 2,
            name: 'Ana Costa',
            number: '5511888888888',
            isGroup: false,
            companyId: 1,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z'
          },
          queue: {
            id: 2,
            name: 'Vendas',
            color: '#10B981',
            companyId: 1,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z'
          }
        },
        {
          id: 3,
          status: 'closed',
          lastMessage: 'Obrigado pelo atendimento!',
          contactId: 3,
          userId: 2,
          whatsappId: 1,
          companyId: 1,
          queueId: 1,
          isGroup: false,
          unreadMessages: 0,
          createdAt: '2024-01-08T08:00:00Z',
          updatedAt: '2024-01-08T08:45:00Z',
          contact: {
            id: 3,
            name: 'Pedro Lima',
            number: '5511777777777',
            isGroup: false,
            companyId: 1,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z'
          },
          user: {
            id: 2,
            name: 'Carlos Oliveira',
            email: 'carlos@example.com',
            profile: 'user',
            companyId: 1,
            queues: [],
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z'
          },
          queue: {
            id: 1,
            name: 'Suporte',
            color: '#3B82F6',
            companyId: 1,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z'
          }
        }
      ];
      
      setTickets(mockTickets);
      setLoading(false);
    };

    loadTickets();
  }, []);

  // Listen for real-time ticket updates
  useEffect(() => {
    const handleTicketUpdate = (data: any) => {
      if (data.action === 'update' && data.ticket) {
        setTickets(prev => 
          prev.map(ticket => 
            ticket.id === data.ticket.id ? { ...ticket, ...data.ticket } : ticket
          )
        );
      }
    };

    onTicketUpdate(handleTicketUpdate);

    return () => {
      // Cleanup listeners when component unmounts
    };
  }, [onTicketUpdate]);

  const handleFilterChange = (key: keyof TicketFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge variant="success">Aberto</Badge>;
      case 'pending':
        return <Badge variant="warning">Pendente</Badge>;
      case 'closed':
        return <Badge variant="default">Fechado</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    }
    return `${minutes}min`;
  };

  const filteredTickets = tickets.filter(ticket => {
    if (filters.status && ticket.status !== filters.status) return false;
    if (filters.userId && ticket.userId !== filters.userId) return false;
    if (filters.queueId && ticket.queueId !== filters.queueId) return false;
    if (filters.search) {
      const search = filters.search.toLowerCase();
      return (
        ticket.contact?.name.toLowerCase().includes(search) ||
        ticket.lastMessage?.toLowerCase().includes(search) ||
        ticket.contact?.number.includes(search)
      );
    }
    return true;
  });

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
          <h1 className="text-2xl font-bold text-gray-900">Tickets</h1>
          <p className="text-gray-600">Gerencie todos os atendimentos com IA</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            leftIcon={<FunnelIcon className="w-4 h-4" />}
            onClick={() => setShowFilters(!showFilters)}
          >
            Filtros
          </Button>
          <Button
            leftIcon={<PlusIcon className="w-4 h-4" />}
          >
            Novo Ticket
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="Buscar tickets..."
              value={filters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              leftIcon={<MagnifyingGlassIcon />}
            />
            
            <Select
              placeholder="Status"
              value={filters.status || ''}
              onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
              options={[
                { value: 'open', label: 'Aberto' },
                { value: 'pending', label: 'Pendente' },
                { value: 'closed', label: 'Fechado' }
              ]}
            />
            
            <Select
              placeholder="Fila"
              value={filters.queueId || ''}
              onChange={(e) => handleFilterChange('queueId', e.target.value ? parseInt(e.target.value) : undefined)}
              options={[
                { value: 1, label: 'Suporte' },
                { value: 2, label: 'Vendas' },
                { value: 3, label: 'Financeiro' }
              ]}
            />
            
            <Select
              placeholder="Usuário"
              value={filters.userId || ''}
              onChange={(e) => handleFilterChange('userId', e.target.value ? parseInt(e.target.value) : undefined)}
              options={[
                { value: 1, label: 'Maria Santos' },
                { value: 2, label: 'Carlos Oliveira' },
                { value: 3, label: 'Ana Silva' }
              ]}
            />
          </div>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', count: filteredTickets.length, color: 'bg-sky-100 text-sky-800' },
          { label: 'Abertos', count: filteredTickets.filter(t => t.status === 'open').length, color: 'bg-emerald-100 text-emerald-800' },
          { label: 'Pendentes', count: filteredTickets.filter(t => t.status === 'pending').length, color: 'bg-amber-100 text-amber-800' },
          { label: 'Fechados', count: filteredTickets.filter(t => t.status === 'closed').length, color: 'bg-gray-100 text-gray-800' }
        ].map((stat, index) => (
          <Card key={index} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.count}</p>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${stat.color}`}>
                {stat.count}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Tickets List */}
      <Card className="p-0">
        {filteredTickets.length === 0 ? (
          <div className="text-center py-12">
            <ChatBubbleLeftRightIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Nenhum ticket encontrado</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredTickets.map((ticket) => (
              <div
                key={ticket.id}
                className="p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1 min-w-0">
                    {/* Contact Avatar */}
                    <Avatar
                      name={ticket.contact?.name}
                      size="md"
                      online={ticket.status === 'open'}
                    />

                    {/* Ticket Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {ticket.contact?.name}
                        </h3>
                        <span className="text-xs text-gray-500">
                          #{ticket.id}
                        </span>
                        {ticket.unreadMessages! > 0 && (
                          <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                            {ticket.unreadMessages}
                          </span>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-600 truncate mb-2">
                        {ticket.lastMessage}
                      </p>
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        {ticket.queue && (
                          <div className="flex items-center space-x-1">
                            <div 
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: ticket.queue.color }}
                            />
                            <span>{ticket.queue.name}</span>
                          </div>
                        )}
                        
                        {ticket.user && (
                          <div className="flex items-center space-x-1">
                            <UserIcon className="w-3 h-3" />
                            <span>{ticket.user.name}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center space-x-1">
                          <ClockIcon className="w-3 h-3" />
                          <span>{formatTime(ticket.updatedAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-3">
                    {getStatusBadge(ticket.status)}
                    
                    <Link to={`/tickets/${ticket.id}`}>
                      <Button
                        size="sm"
                        variant="outline"
                        leftIcon={<EyeIcon className="w-4 h-4" />}
                      >
                        Abrir
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default Tickets;