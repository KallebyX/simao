import { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Whatsapp } from '@/types';
import { PlusIcon, QrCodeIcon, PhoneIcon } from '@heroicons/react/24/outline';

const WhatsAppConnections = () => {
  const [connections, setConnections] = useState<Whatsapp[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadConnections = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const mockConnections: Whatsapp[] = [
        {
          id: 1,
          name: 'Suporte Principal',
          session: 'suporte-001',
          status: 'CONNECTED',
          battery: '85',
          plugged: true,
          retries: 0,
          companyId: 1,
          phone: '5511999999999',
          isDefault: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        },
        {
          id: 2,
          name: 'Vendas',
          session: 'vendas-001',
          status: 'DISCONNECTED',
          retries: 3,
          companyId: 1,
          isDefault: false,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        }
      ];
      
      setConnections(mockConnections);
      setLoading(false);
    };

    loadConnections();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONNECTED':
        return <Badge variant="success">Conectado</Badge>;
      case 'DISCONNECTED':
        return <Badge variant="danger">Desconectado</Badge>;
      case 'OPENING':
        return <Badge variant="warning">Conectando</Badge>;
      case 'PAIRING':
        return <Badge variant="warning">Pareando</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (loading) return <div className="flex justify-center h-64 items-center"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Conexões WhatsApp AI</h1>
          <p className="text-gray-600">Gerencie suas conexões WhatsApp Business com IA</p>
        </div>
        <Button leftIcon={<PlusIcon className="w-4 h-4" />}>
          Nova Conexão
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{connections.length}</p>
            </div>
            <PhoneIcon className="w-8 h-8 text-sky-600" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Conectadas</p>
              <p className="text-2xl font-bold text-emerald-600">
                {connections.filter(c => c.status === 'CONNECTED').length}
              </p>
            </div>
            <PhoneIcon className="w-8 h-8 text-emerald-600" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Desconectadas</p>
              <p className="text-2xl font-bold text-red-600">
                {connections.filter(c => c.status === 'DISCONNECTED').length}
              </p>
            </div>
            <PhoneIcon className="w-8 h-8 text-red-600" />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {connections.map((connection) => (
          <Card key={connection.id} className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900">{connection.name}</h3>
                <p className="text-sm text-gray-500">Sessão: {connection.session}</p>
                {connection.phone && (
                  <p className="text-sm text-gray-500">Tel: {connection.phone}</p>
                )}
              </div>
              {connection.isDefault && (
                <Badge size="sm" variant="info">Padrão</Badge>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Status:</span>
                {getStatusBadge(connection.status)}
              </div>
              
              {connection.battery && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Bateria:</span>
                  <span className="text-sm text-gray-900">{connection.battery}%</span>
                </div>
              )}
              
              {connection.plugged !== undefined && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Carregando:</span>
                  <span className="text-sm text-gray-900">
                    {connection.plugged ? 'Sim' : 'Não'}
                  </span>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200 flex space-x-2">
              {connection.status === 'DISCONNECTED' && (
                <Button size="sm" variant="outline" fullWidth leftIcon={<QrCodeIcon className="w-4 h-4" />}>
                  QR Code
                </Button>
              )}
              <Button size="sm" variant="outline" fullWidth>
                Configurar
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default WhatsAppConnections;