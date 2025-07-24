import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Check,
  X,
  Crown,
  Zap,
  Building,
  Star,
  CreditCard,
  RefreshCw,
} from 'lucide-react';

const Planos = () => {
  const { user } = useAuth();
  const [planos, setPlanos] = useState([]);
  const [assinaturaAtual, setAssinaturaAtual] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processando, setProcessando] = useState(false);
  const [periodicidadeAnual, setPeriodicidadeAnual] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Carregar planos e assinatura atual
      const [planosResponse, assinaturaResponse] = await Promise.all([
        api.getPlanos(),
        api.getAssinaturaAtual()
      ]);
      
      setPlanos(planosResponse.planos || []);
      setAssinaturaAtual(assinaturaResponse.assinatura);
      
    } catch (err) {
      setError('Erro ao carregar informações');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAssinar = async (planoId) => {
    try {
      setProcessando(true);
      setError('');
      
      const response = await api.criarCheckout({
        plano_id: planoId,
        periodicidade: periodicidadeAnual ? 'anual' : 'mensal'
      });
      
      // Redirecionar para o checkout do Stripe
      window.location.href = response.checkout_url;
      
    } catch (err) {
      setError('Erro ao processar assinatura');
      console.error('Error creating checkout:', err);
    } finally {
      setProcessando(false);
    }
  };

  const handleGerenciarAssinatura = async () => {
    try {
      setProcessando(true);
      
      const response = await api.criarPortal();
      window.location.href = response.portal_url;
      
    } catch (err) {
      setError('Erro ao acessar portal');
      console.error('Error creating portal:', err);
    } finally {
      setProcessando(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const getPlanoIcon = (tipo) => {
    const icons = {
      trial: Star,
      basico: Zap,
      profissional: Crown,
      empresarial: Building,
    };
    return icons[tipo] || Star;
  };

  const getPlanoColor = (tipo) => {
    const colors = {
      trial: 'border-blue-200 bg-blue-50',
      basico: 'border-green-200 bg-green-50',
      profissional: 'border-purple-200 bg-purple-50',
      empresarial: 'border-orange-200 bg-orange-50',
    };
    return colors[tipo] || 'border-gray-200 bg-gray-50';
  };

  const isPlanoAtual = (planoId) => {
    return assinaturaAtual?.plano?.id === planoId;
  };

  const PlanoCard = ({ plano }) => {
    const Icon = getPlanoIcon(plano.tipo);
    const isAtual = isPlanoAtual(plano.id);
    const preco = periodicidadeAnual ? plano.preco_anual : plano.preco_mensal;
    const precoOriginal = periodicidadeAnual ? plano.preco_mensal * 12 : null;
    const desconto = precoOriginal ? Math.round(((precoOriginal - preco) / precoOriginal) * 100) : 0;

    return (
      <Card className={`relative ${getPlanoColor(plano.tipo)} ${isAtual ? 'ring-2 ring-blue-500' : ''}`}>
        {plano.tipo === 'profissional' && (
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
            <Badge className="bg-purple-600 text-white">Mais Popular</Badge>
          </div>
        )}
        
        {isAtual && (
          <div className="absolute -top-3 right-4">
            <Badge className="bg-blue-600 text-white">Plano Atual</Badge>
          </div>
        )}

        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <Icon className="h-8 w-8 text-gray-600" />
          </div>
          <CardTitle className="text-xl">{plano.nome}</CardTitle>
          <CardDescription>{plano.descricao}</CardDescription>
          
          <div className="mt-4">
            <div className="flex items-baseline justify-center">
              <span className="text-3xl font-bold">{formatPrice(preco)}</span>
              <span className="text-gray-500 ml-1">
                /{periodicidadeAnual ? 'ano' : 'mês'}
              </span>
            </div>
            
            {periodicidadeAnual && desconto > 0 && (
              <div className="mt-1">
                <span className="text-sm text-gray-500 line-through">
                  {formatPrice(precoOriginal)}
                </span>
                <Badge variant="outline" className="ml-2 text-green-600">
                  {desconto}% OFF
                </Badge>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-3 mb-6">
            <div className="flex items-center">
              <Check className="h-4 w-4 text-green-500 mr-2" />
              <span className="text-sm">Até {plano.limite_leads} leads</span>
            </div>
            
            <div className="flex items-center">
              <Check className="h-4 w-4 text-green-500 mr-2" />
              <span className="text-sm">{plano.limite_mensagens_mes} mensagens/mês</span>
            </div>
            
            <div className="flex items-center">
              <Check className="h-4 w-4 text-green-500 mr-2" />
              <span className="text-sm">{plano.limite_bots} bot(s) WhatsApp</span>
            </div>
            
            <div className="flex items-center">
              {plano.suporte_whatsapp ? (
                <Check className="h-4 w-4 text-green-500 mr-2" />
              ) : (
                <X className="h-4 w-4 text-red-500 mr-2" />
              )}
              <span className="text-sm">Suporte WhatsApp</span>
            </div>
            
            <div className="flex items-center">
              {plano.relatorios_avancados ? (
                <Check className="h-4 w-4 text-green-500 mr-2" />
              ) : (
                <X className="h-4 w-4 text-red-500 mr-2" />
              )}
              <span className="text-sm">Relatórios avançados</span>
            </div>
            
            <div className="flex items-center">
              {plano.api_acesso ? (
                <Check className="h-4 w-4 text-green-500 mr-2" />
              ) : (
                <X className="h-4 w-4 text-red-500 mr-2" />
              )}
              <span className="text-sm">Acesso à API</span>
            </div>
            
            <div className="flex items-center">
              {plano.integracao_crm ? (
                <Check className="h-4 w-4 text-green-500 mr-2" />
              ) : (
                <X className="h-4 w-4 text-red-500 mr-2" />
              )}
              <span className="text-sm">Integração CRM</span>
            </div>
          </div>

          {isAtual ? (
            <Button 
              variant="outline" 
              className="w-full"
              onClick={handleGerenciarAssinatura}
              disabled={processando}
            >
              <CreditCard className="mr-2 h-4 w-4" />
              Gerenciar Assinatura
            </Button>
          ) : (
            <Button 
              className="w-full"
              onClick={() => handleAssinar(plano.id)}
              disabled={processando || plano.tipo === 'trial'}
              variant={plano.tipo === 'profissional' ? 'default' : 'outline'}
            >
              {processando ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Crown className="mr-2 h-4 w-4" />
              )}
              {plano.tipo === 'trial' ? 'Trial Gratuito' : 'Assinar Agora'}
            </Button>
          )}
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">
          Escolha o Plano Ideal
        </h1>
        <p className="mt-2 text-lg text-gray-600">
          Potencialize seu agronegócio com inteligência artificial
        </p>
      </div>

      {/* Toggle de periodicidade */}
      <div className="flex items-center justify-center space-x-4">
        <span className={`text-sm ${!periodicidadeAnual ? 'font-medium' : 'text-gray-500'}`}>
          Mensal
        </span>
        <Switch
          checked={periodicidadeAnual}
          onCheckedChange={setPeriodicidadeAnual}
        />
        <span className={`text-sm ${periodicidadeAnual ? 'font-medium' : 'text-gray-500'}`}>
          Anual
        </span>
        {periodicidadeAnual && (
          <Badge className="bg-green-100 text-green-800">
            Economize até 20%
          </Badge>
        )}
      </div>

      {/* Alertas */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {assinaturaAtual && (
        <Alert>
          <AlertDescription>
            Você tem uma assinatura {assinaturaAtual.status} do plano {assinaturaAtual.plano?.nome}.
            {assinaturaAtual.dias_restantes > 0 && (
              <> Restam {assinaturaAtual.dias_restantes} dias.</>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Grid de planos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {planos.map((plano) => (
          <PlanoCard key={plano.id} plano={plano} />
        ))}
      </div>

      {/* FAQ */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-center mb-8">Perguntas Frequentes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Posso cancelar a qualquer momento?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Sim, você pode cancelar sua assinatura a qualquer momento através do portal do cliente.
                Não há taxas de cancelamento.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Como funciona o período de trial?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                O trial gratuito de 14 dias inclui todas as funcionalidades do plano Básico.
                Não é necessário cartão de crédito para começar.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Posso mudar de plano?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Sim, você pode fazer upgrade ou downgrade do seu plano a qualquer momento.
                As mudanças são aplicadas no próximo ciclo de cobrança.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Há suporte técnico?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Todos os planos incluem suporte por email. Planos Profissional e Empresarial
                têm suporte prioritário e via WhatsApp.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Planos;

