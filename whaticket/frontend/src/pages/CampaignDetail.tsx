import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

const CampaignDetail = () => {
  const { campaignId } = useParams();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCampaign = async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
      setCampaign({
        id: parseInt(campaignId!),
        name: 'Promoção Black Friday',
        message1: 'Aproveite nossa promoção especial!',
        status: 'FINALIZADA'
      });
      setLoading(false);
    };
    loadCampaign();
  }, [campaignId]);

  if (loading) return <div className="flex justify-center h-64 items-center"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate('/campaigns')} leftIcon={<ArrowLeftIcon className="w-4 h-4" />}>
          Voltar às Campanhas
        </Button>
      </div>
      
      <Card title={campaign?.name}>
        <div className="space-y-4">
          <p><strong>Mensagem:</strong> {campaign?.message1}</p>
          <p><strong>Status:</strong> <Badge variant="success">{campaign?.status}</Badge></p>
        </div>
      </Card>
    </div>
  );
};

export default CampaignDetail;