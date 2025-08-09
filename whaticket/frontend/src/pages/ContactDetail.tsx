import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Avatar from '@/components/ui/Avatar';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Contact } from '@/types';
import {
  ArrowLeftIcon,
  PencilIcon,
  PhoneIcon,
  EnvelopeIcon,
  ChatBubbleLeftRightIcon,
  TagIcon
} from '@heroicons/react/24/outline';

const ContactDetail = () => {
  const { contactId } = useParams<{ contactId: string }>();
  const navigate = useNavigate();
  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadContact = async () => {
      if (!contactId) return;
      
      setLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const mockContact: Contact = {
        id: parseInt(contactId),
        name: 'João Silva',
        number: '5511999999999',
        profilePicUrl: '',
        isGroup: false,
        companyId: 1,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        extraInfo: [
          { id: 1, name: 'Email', value: 'joao@example.com', contactId: parseInt(contactId) },
          { id: 2, name: 'Empresa', value: 'Tech Corp', contactId: parseInt(contactId) },
          { id: 3, name: 'Cargo', value: 'Desenvolvedor', contactId: parseInt(contactId) }
        ],
        tags: [
          { id: 1, name: 'VIP', color: '#F59E0B', companyId: 1, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
          { id: 2, name: 'Cliente Premium', color: '#10B981', companyId: 1, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' }
        ]
      };
      
      setContact(mockContact);
      setLoading(false);
    };

    loadContact();
  }, [contactId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Contato não encontrado</p>
        <Button
          className="mt-4"
          onClick={() => navigate('/contacts')}
          leftIcon={<ArrowLeftIcon className="w-4 h-4" />}
        >
          Voltar aos Contatos
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => navigate('/contacts')}
          leftIcon={<ArrowLeftIcon className="w-4 h-4" />}
        >
          Voltar aos Contatos
        </Button>
        
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            leftIcon={<PhoneIcon className="w-4 h-4" />}
          >
            Ligar
          </Button>
          
          <Button
            variant="outline"
            leftIcon={<ChatBubbleLeftRightIcon className="w-4 h-4" />}
          >
            Iniciar Chat
          </Button>
          
          <Button
            leftIcon={<PencilIcon className="w-4 h-4" />}
          >
            Editar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Info */}
          <Card title="Informações do Contato">
            <div className="flex items-start space-x-6">
              <Avatar
                name={contact.name}
                size="xl"
                src={contact.profilePicUrl}
              />
              
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {contact.name}
                </h2>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center space-x-2 text-gray-600">
                    <PhoneIcon className="w-4 h-4" />
                    <span>{contact.number}</span>
                  </div>
                  
                  {contact.extraInfo?.find(info => info.name === 'Email') && (
                    <div className="flex items-center space-x-2 text-gray-600">
                      <EnvelopeIcon className="w-4 h-4" />
                      <span>{contact.extraInfo.find(info => info.name === 'Email')?.value}</span>
                    </div>
                  )}
                </div>
                
                {contact.tags && contact.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {contact.tags.map((tag) => (
                      <Badge
                        key={tag.id}
                        className="text-white"
                        style={{ backgroundColor: tag.color }}
                      >
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Extra Information */}
          {contact.extraInfo && contact.extraInfo.length > 0 && (
            <Card title="Informações Adicionais">
              <div className="space-y-3">
                {contact.extraInfo.map((info) => (
                  <div key={info.id} className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">{info.name}:</span>
                    <span className="text-sm text-gray-900">{info.value}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Recent Tickets */}
          <Card title="Tickets Recentes">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">Dúvida sobre pedido</p>
                  <p className="text-xs text-gray-500">Ticket #123 - 2 horas atrás</p>
                </div>
                <Badge variant="success">Fechado</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">Problema com entrega</p>
                  <p className="text-xs text-gray-500">Ticket #122 - 1 dia atrás</p>
                </div>
                <Badge variant="success">Fechado</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">Solicitação de suporte</p>
                  <p className="text-xs text-gray-500">Ticket #121 - 3 dias atrás</p>
                </div>
                <Badge variant="success">Fechado</Badge>
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card title="Ações Rápidas">
            <div className="space-y-3">
              <Button
                fullWidth
                variant="outline"
                leftIcon={<ChatBubbleLeftRightIcon className="w-4 h-4" />}
              >
                Novo Ticket
              </Button>
              
              <Button
                fullWidth
                variant="outline"
                leftIcon={<TagIcon className="w-4 h-4" />}
              >
                Gerenciar Tags
              </Button>
            </div>
          </Card>

          {/* Statistics */}
          <Card title="Estatísticas">
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">15</p>
                <p className="text-sm text-gray-600">Total de Tickets</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-lg font-semibold text-emerald-600">14</p>
                  <p className="text-xs text-gray-600">Resolvidos</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-amber-600">1</p>
                  <p className="text-xs text-gray-600">Em aberto</p>
                </div>
              </div>
              
              <div className="text-center pt-4 border-t border-gray-200">
                <p className="text-lg font-semibold text-sky-600">2.1h</p>
                <p className="text-xs text-gray-600">Tempo médio de resposta</p>
              </div>
            </div>
          </Card>

          {/* Contact Timeline */}
          <Card title="Atividade Recente">
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-sm">
                <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                <div>
                  <p className="text-gray-900">Ticket fechado</p>
                  <p className="text-gray-500">há 2 horas</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 text-sm">
                <div className="w-2 h-2 bg-sky-400 rounded-full"></div>
                <div>
                  <p className="text-gray-900">Mensagem recebida</p>
                  <p className="text-gray-500">há 2 horas</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 text-sm">
                <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                <div>
                  <p className="text-gray-900">Novo ticket criado</p>
                  <p className="text-gray-500">há 2 horas</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ContactDetail;