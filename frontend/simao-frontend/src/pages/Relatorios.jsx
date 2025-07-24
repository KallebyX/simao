import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
} from 'recharts';
import {
  BarChart3,
  PieChart as PieChartIcon,
  TrendingUp,
  Users,
  MessageSquare,
  Calendar,
  Download,
  RefreshCw,
  Filter,
} from 'lucide-react';

const Relatorios = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState('30');

  useEffect(() => {
    loadStats();
  }, [timeRange]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await api.getLeadsStats();
      setStats(response);
    } catch (err) {
      setError('Erro ao carregar estatísticas');
      console.error('Error loading stats:', err);
    } finally {
      setLoading(false);
    }
  };

  // Dados simulados para demonstração (em produção viriam da API)
  const leadsByMonth = [
    { month: 'Jan', leads: 12, convertidos: 3 },
    { month: 'Fev', leads: 19, convertidos: 5 },
    { month: 'Mar', leads: 15, convertidos: 4 },
    { month: 'Abr', leads: 25, convertidos: 8 },
    { month: 'Mai', leads: 22, convertidos: 6 },
    { month: 'Jun', leads: 30, convertidos: 12 },
  ];

  const leadsBySource = [
    { name: 'WhatsApp', value: 45, color: '#25D366' },
    { name: 'Manual', value: 30, color: '#3B82F6' },
    { name: 'Importação', value: 25, color: '#8B5CF6' },
  ];

  const conversionFunnel = [
    { stage: 'Novos', count: 100, percentage: 100 },
    { stage: 'Em Andamento', count: 75, percentage: 75 },
    { stage: 'Qualificados', count: 45, percentage: 45 },
    { stage: 'Convertidos', count: 20, percentage: 20 },
  ];

  const dailyActivity = [
    { day: 'Seg', messages: 45, leads: 8 },
    { day: 'Ter', messages: 52, leads: 12 },
    { day: 'Qua', messages: 38, leads: 6 },
    { day: 'Qui', messages: 61, leads: 15 },
    { day: 'Sex', messages: 55, leads: 11 },
    { day: 'Sáb', messages: 28, leads: 4 },
    { day: 'Dom', messages: 15, leads: 2 },
  ];

  const formatStatusName = (status) => {
    const statusNames = {
      novo: 'Novos',
      em_andamento: 'Em Andamento',
      qualificado: 'Qualificados',
      convertido: 'Convertidos',
      perdido: 'Perdidos',
    };
    return statusNames[status] || status;
  };

  const getStatusColor = (status) => {
    const colors = {
      novo: '#3B82F6',
      em_andamento: '#F59E0B',
      qualificado: '#8B5CF6',
      convertido: '#10B981',
      perdido: '#EF4444',
    };
    return colors[status] || '#6B7280';
  };

  const statusData = stats?.by_status ? Object.entries(stats.by_status).map(([status, count]) => ({
    name: formatStatusName(status),
    value: count,
    color: getStatusColor(status),
  })) : [];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <BarChart3 className="mr-2 h-6 w-6" />
            Relatórios e Métricas
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Acompanhe o desempenho do seu negócio e analise tendências
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
              <SelectItem value="365">Último ano</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
          <Button onClick={loadStats}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Alertas */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Cards de métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_leads || 0}</div>
            <p className="text-xs text-muted-foreground">
              +{stats?.leads_last_30_days || 0} este mês
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
              {stats?.by_status?.convertido || 0} convertidos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mensagens Enviadas</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,234</div>
            <p className="text-xs text-muted-foreground">
              +12% vs mês anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Médio Resposta</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.5h</div>
            <p className="text-xs text-muted-foreground">
              -15min vs mês anterior
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de leads por mês */}
        <Card>
          <CardHeader>
            <CardTitle>Leads por Mês</CardTitle>
            <CardDescription>
              Evolução mensal de leads e conversões
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={leadsByMonth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="leads" fill="#3B82F6" name="Total de Leads" />
                <Bar dataKey="convertidos" fill="#10B981" name="Convertidos" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico de pizza - leads por status */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Status</CardTitle>
            <CardDescription>
              Leads organizados por estágio no funil
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Funil de conversão */}
        <Card>
          <CardHeader>
            <CardTitle>Funil de Conversão</CardTitle>
            <CardDescription>
              Jornada dos leads através do processo de vendas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={conversionFunnel} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="stage" type="category" />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="#8B5CF6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Atividade diária */}
        <Card>
          <CardHeader>
            <CardTitle>Atividade Semanal</CardTitle>
            <CardDescription>
              Mensagens e leads por dia da semana
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={dailyActivity}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="messages"
                  stackId="1"
                  stroke="#3B82F6"
                  fill="#3B82F6"
                  fillOpacity={0.6}
                  name="Mensagens"
                />
                <Area
                  type="monotone"
                  dataKey="leads"
                  stackId="2"
                  stroke="#10B981"
                  fill="#10B981"
                  fillOpacity={0.6}
                  name="Novos Leads"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de origem dos leads */}
      <Card>
        <CardHeader>
          <CardTitle>Origem dos Leads</CardTitle>
          <CardDescription>
            Canais que mais geram leads para seu negócio
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {leadsBySource.map((source, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: source.color }}
                  ></div>
                  <span className="font-medium">{source.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full"
                      style={{
                        width: `${source.value}%`,
                        backgroundColor: source.color,
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium w-12 text-right">
                    {source.value}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Insights e recomendações */}
      <Card>
        <CardHeader>
          <CardTitle>Insights e Recomendações</CardTitle>
          <CardDescription>
            Análises automáticas baseadas nos seus dados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <Badge className="bg-green-100 text-green-800">Positivo</Badge>
              <div>
                <p className="font-medium">Taxa de conversão acima da média</p>
                <p className="text-sm text-gray-600">
                  Sua taxa de conversão de 20% está 5% acima da média do setor agrícola.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <Badge className="bg-yellow-100 text-yellow-800">Atenção</Badge>
              <div>
                <p className="font-medium">Pico de atividade às quintas-feiras</p>
                <p className="text-sm text-gray-600">
                  Considere aumentar a disponibilidade da equipe às quintas-feiras.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <Badge className="bg-blue-100 text-blue-800">Oportunidade</Badge>
              <div>
                <p className="font-medium">WhatsApp é seu melhor canal</p>
                <p className="text-sm text-gray-600">
                  45% dos seus leads vêm do WhatsApp. Considere investir mais neste canal.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Relatorios;

