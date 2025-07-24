import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Users,
  MessageSquare,
  TrendingUp,
  Smartphone,
  Activity,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Fish,
  Droplets,
  DollarSign,
  AlertTriangle,
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [whatsappStatus, setWhatsappStatus] = useState(null);
  const [pisciculturaStats, setPisciculturaStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Carregar estatísticas dos leads e piscicultura
      const [leadsStats, whatsappInfo] = await Promise.all([
        api.getLeadsStats().catch(() => ({ total_leads: 0, leads_last_30_days: 0, by_status: {}, by_origem: {} })),
        api.getWhatsAppStatus().catch(() => ({ connected: false, error: 'Não configurado' }))
        // api.getPisciculturaStats().catch(() => null) // Futura implementação
      ]);

      setStats(leadsStats);
      setWhatsappStatus(whatsappInfo);
      
      // Mock data para demonstração das métricas de piscicultura
      setPisciculturaStats({
        total_peixes: 12600,
        lotes_ativos: 8,
        taxa_mortalidade: 4.2,
        receita_estimada: 89750.00,
        qualidade_agua: 'boa',
        proximas_colheitas: 3,
        alertas_criticos: 1,
        especies: {
          tilapia: 7500,
          tambaqui: 3200,
          pirarucu: 1200,
          pacu: 700
        }
      });
    } catch (err) {
      setError('Erro ao carregar dados do dashboard');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'novo':
        return 'bg-blue-100 text-blue-800';
      case 'em_andamento':
        return 'bg-yellow-100 text-yellow-800';
      case 'convertido':
        return 'bg-green-100 text-green-800';
      case 'perdido':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatStatusName = (status) => {
    const statusNames = {
      novo: 'Novos',
      em_andamento: 'Em Andamento',
      qualificado: 'Qualificados',
      convertido: 'Convertidos',
      perdido: 'Perdidos',
      whatsapp: 'WhatsApp',
      manual: 'Manual',
      importacao: 'Importação'
    };
    return statusNames[status] || status;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {getGreeting()}, {user?.nome?.split(' ')[0]}! 👋
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Resumo da sua piscicultura e vendas de alevinos
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Button asChild>
            <Link to="/leads">
              Ver todos os leads
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Alertas */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Status do WhatsApp */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center">
            <Smartphone className="mr-2 h-5 w-5" />
            Status do WhatsApp
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`h-3 w-3 rounded-full ${whatsappStatus?.connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm font-medium">
                {whatsappStatus?.connected ? 'Conectado' : 'Desconectado'}
              </span>
              {whatsappStatus?.connection_info?.phone && (
                <Badge variant="outline">{whatsappStatus.connection_info.phone}</Badge>
              )}
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to="/whatsapp">
                Gerenciar
              </Link>
            </Button>
          </div>
          {!whatsappStatus?.connected && (
            <p className="text-sm text-gray-600 mt-2">
              Configure sua conexão WhatsApp para começar a receber mensagens
            </p>
          )}
        </CardContent>
      </Card>

      {/* Métricas de Piscicultura */}
      {pisciculturaStats && (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Fish className="mr-2 h-5 w-5" />
              Resumo da Piscicultura
            </h2>
            <Button variant="outline" size="sm" asChild>
              <Link to="/estoque">
                Ver Estoque
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Peixes</CardTitle>
                <Fish className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pisciculturaStats.total_peixes.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Em {pisciculturaStats.lotes_ativos} lotes ativos
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Receita Estimada</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  R$ {(pisciculturaStats.receita_estimada / 1000).toFixed(0)}k
                </div>
                <p className="text-xs text-muted-foreground">
                  Para próximas colheitas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taxa de Mortalidade</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pisciculturaStats.taxa_mortalidade}%</div>
                <p className="text-xs text-muted-foreground">
                  Média dos lotes ativos
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Qualidade da Água</CardTitle>
                <Droplets className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold capitalize">{pisciculturaStats.qualidade_agua}</div>
                <p className="text-xs text-muted-foreground">
                  {pisciculturaStats.alertas_criticos > 0 ? 
                    `${pisciculturaStats.alertas_criticos} alerta(s) crítico(s)` : 
                    'Todas as medições normais'
                  }
                </p>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Cards de estatísticas de Leads */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center">
          <Users className="mr-2 h-5 w-5" />
          Leads e Vendas
        </h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_leads || 0}</div>
            <p className="text-xs text-muted-foreground">
              +{stats?.leads_last_30_days || 0} nos últimos 30 dias
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversas Ativas</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.by_status?.em_andamento || 0}</div>
            <p className="text-xs text-muted-foreground">
              Leads em andamento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Convertidos</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.by_status?.convertido || 0}</div>
            <p className="text-xs text-muted-foreground">
              Leads convertidos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.total_leads > 0 
                ? Math.round(((stats?.by_status?.convertido || 0) / stats.total_leads) * 100)
                : 0
              }%
            </div>
            <p className="text-xs text-muted-foreground">
              Leads convertidos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Distribuição por status e origem */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leads por status */}
        <Card>
          <CardHeader>
            <CardTitle>Leads por Status</CardTitle>
            <CardDescription>
              Distribuição dos seus leads por estágio
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats?.by_status && Object.entries(stats.by_status).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(status)}>
                      {formatStatusName(status)}
                    </Badge>
                  </div>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
              {(!stats?.by_status || Object.keys(stats.by_status).length === 0) && (
                <p className="text-sm text-gray-500 text-center py-4">
                  Nenhum lead encontrado
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Leads por origem */}
        <Card>
          <CardHeader>
            <CardTitle>Leads por Origem</CardTitle>
            <CardDescription>
              Como seus leads chegaram até você
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats?.by_origem && Object.entries(stats.by_origem).map(([origem, count]) => (
                <div key={origem} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">
                      {formatStatusName(origem)}
                    </Badge>
                  </div>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
              {(!stats?.by_origem || Object.keys(stats.by_origem).length === 0) && (
                <p className="text-sm text-gray-500 text-center py-4">
                  Nenhum lead encontrado
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ações rápidas */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
          <CardDescription>
            Acesse rapidamente as principais funcionalidades
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex flex-col" asChild>
              <Link to="/leads">
                <Users className="h-6 w-6 mb-2" />
                Gerenciar Leads
              </Link>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col" asChild>
              <Link to="/estoque">
                <Fish className="h-6 w-6 mb-2" />
                Estoque de Peixes
              </Link>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col" asChild>
              <Link to="/qualidade-agua">
                <Droplets className="h-6 w-6 mb-2" />
                Qualidade da Água
              </Link>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col" asChild>
              <Link to="/configuracoes">
                <Activity className="h-6 w-6 mb-2" />
                Configurações
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;

