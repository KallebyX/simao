import { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Campaign } from '@/types';
import { PlusIcon, MegaphoneIcon } from '@heroicons/react/24/outline';

const Campaigns = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCampaigns = async () => {
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const mockCampaigns: Campaign[] = [
        {
          id: 1,
          name: 'Promoção Black Friday',
          message1: 'Aproveite nossa promoção especial!',
          companyId: 1,
          dueDate: '2024-11-29',
          scheduledAt: '2024-11-25T08:00:00Z',
          status: 'FINALIZADA',
          confirmation: false,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        },
        {
          id: 2,
          name: 'Newsletter Janeiro',
          message1: 'Confira as novidades do mês!',
          companyId: 1,
          dueDate: '2024-01-31',
          scheduledAt: '2024-01-15T10:00:00Z',
          status: 'EM_ANDAMENTO',
          confirmation: false,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        }
      ];
      
      setCampaigns(mockCampaigns);
      setLoading(false);
    };

    loadCampaigns();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'FINALIZADA': return <Badge variant="success">Finalizada</Badge>;
      case 'EM_ANDAMENTO': return <Badge variant="warning">Em Andamento</Badge>;
      case 'PROGRAMADA': return <Badge variant="info">Programada</Badge>;
      case 'CANCELADA': return <Badge variant="danger">Cancelada</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  if (loading) return <div className="flex justify-center h-64 items-center"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Campanhas Inteligentes</h1>
          <p className="text-gray-600">Gerencie campanhas de marketing com IA</p>
        </div>
        <Button leftIcon={<PlusIcon className="w-4 h-4" />}>Nova Campanha</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{campaigns.length}</p>
            </div>
            <MegaphoneIcon className="w-8 h-8 text-sky-600" />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {campaigns.map((campaign) => (
          <Card key={campaign.id} className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900 mb-2">{campaign.name}</h3>
                <p className="text-sm text-gray-600 mb-4">{campaign.message1}</p>
                
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span>Programada: {new Date(campaign.scheduledAt).toLocaleDateString('pt-BR')}</span>
                  <span>Prazo: {new Date(campaign.dueDate).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                {getStatusBadge(campaign.status)}
                <Button size="sm" variant="outline">Ver Detalhes</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Campaigns;