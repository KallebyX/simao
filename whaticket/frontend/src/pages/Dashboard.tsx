import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Card from '@/components/ui/Card';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { DashboardData } from '@/types';
import {
  UsersIcon,
  PhoneIcon,
  TicketIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ChatBubbleLeftRightIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';

const Dashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  // Mock data for now - replace with real API call
  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockData: DashboardData = {
        usersOnline: 8,
        connectionsCount: 3,
        openTickets: 45,
        closedTickets: 128,
        pendingTickets: 12,
        avgWaitTime: 3.5,
        avgResolutionTime: 18.2,
        messagesCount: {
          sent: 1234,
          received: 2456
        },
        ticketsByUser: [
          { userId: 1, userName: 'João Silva', count: 23 },
          { userId: 2, userName: 'Maria Santos', count: 18 },
          { userId: 3, userName: 'Pedro Costa', count: 15 },
        ],
        ticketsByQueue: [
          { queueId: 1, queueName: 'Suporte', count: 35 },
          { queueId: 2, queueName: 'Vendas', count: 28 },
          { queueId: 3, queueName: 'Financeiro', count: 12 },
        ],
        ticketsByPeriod: [
          { date: '2024-01-01', count: 45 },
          { date: '2024-01-02', count: 52 },
          { date: '2024-01-03', count: 38 },
          { date: '2024-01-04', count: 41 },
          { date: '2024-01-05', count: 49 },
          { date: '2024-01-06', count: 55 },
          { date: '2024-01-07', count: 47 },
        ]
      };
      
      setDashboardData(mockData);
      setLoading(false);
    };

    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Erro ao carregar dados do dashboard</p>
      </div>
    );
  }

  const stats = [
    {
      title: 'Usuários Online',
      value: dashboardData.usersOnline,
      icon: UsersIcon,
      color: 'text-emerald-600 bg-emerald-100',
      change: '+12%',
      changeType: 'positive'
    },
    {
      title: 'Conexões Ativas',
      value: dashboardData.connectionsCount,
      icon: PhoneIcon,
      color: 'text-sky-600 bg-sky-100',
      change: '100%',
      changeType: 'positive'
    },
    {
      title: 'Tickets Abertos',
      value: dashboardData.openTickets,
      icon: TicketIcon,
      color: 'text-amber-600 bg-amber-100',
      change: '-8%',
      changeType: 'negative'
    },
    {
      title: 'Tickets Fechados',
      value: dashboardData.closedTickets,
      icon: CheckCircleIcon,
      color: 'text-emerald-600 bg-emerald-100',
      change: '+23%',
      changeType: 'positive'
    },
    {
      title: 'Pendentes',
      value: dashboardData.pendingTickets,
      icon: ExclamationTriangleIcon,
      color: 'text-red-600 bg-red-100',
      change: '-5%',
      changeType: 'negative'
    },
    {
      title: 'Tempo Médio de Espera',
      value: `${dashboardData.avgWaitTime}min`,
      icon: ClockIcon,
      color: 'text-purple-600 bg-purple-100',
      change: '-2min',
      changeType: 'positive'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-sky-600 to-sky-700 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              Bem-vindo ao Oryum BusinessAI, {user?.name}!
            </h1>
            <p className="text-sky-100 mt-1">
              Aqui está um resumo do seu sistema de atendimento inteligente
            </p>
          </div>
          <div className="hidden md:block">
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <ChatBubbleLeftRightIcon className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
                  <div className={`flex items-center mt-2 text-sm ${
                    stat.changeType === 'positive' ? 'text-emerald-600' : 'text-red-600'
                  }`}>
                    <ArrowTrendingUpIcon className={`w-4 h-4 mr-1 ${
                      stat.changeType === 'negative' ? 'rotate-180' : ''
                    }`} />
                    {stat.change}
                  </div>
                </div>
                <div className={`p-3 rounded-full ${stat.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Charts and Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Messages Chart */}
        <Card title="Mensagens Hoje" className="p-0">
          <div className="p-6">
            <div className="flex items-center justify-center h-64 border-2 border-dashed border-gray-300 rounded-lg">
              <div className="text-center">
                <p className="text-gray-500 mb-2">Gráfico de Mensagens</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Enviadas:</span>
                    <span className="font-semibold text-sky-600">{dashboardData.messagesCount.sent}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Recebidas:</span>
                    <span className="font-semibold text-emerald-600">{dashboardData.messagesCount.received}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Tickets by Queue */}
        <Card title="Tickets por Fila" className="p-0">
          <div className="p-6">
            <div className="space-y-4">
              {dashboardData.ticketsByQueue.map((queue, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-sky-600 rounded-full mr-3"></div>
                    <span className="text-sm font-medium text-gray-900">{queue.queueName}</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-700">{queue.count}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Performance by User */}
      <Card title="Performance por Usuário">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuário
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tickets Atendidos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Performance
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {dashboardData.ticketsByUser.map((userStat, index) => {
                const total = dashboardData.ticketsByUser.reduce((sum, u) => sum + u.count, 0);
                const percentage = ((userStat.count / total) * 100).toFixed(1);
                
                return (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gradient-to-br from-sky-600 to-sky-700 rounded-full flex items-center justify-center mr-3">
                          <span className="text-xs font-medium text-white">
                            {userStat.userName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {userStat.userName}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {userStat.count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 mr-3">
                          <div 
                            className="bg-sky-600 h-2 rounded-full" 
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-700">{percentage}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Recent Activity */}
      <Card title="Atividade Recente">
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
            <p className="text-sm text-gray-600">
              <span className="font-medium">João Silva</span> fechou o ticket #1234
            </p>
            <span className="text-xs text-gray-400">há 2 min</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-sky-400 rounded-full"></div>
            <p className="text-sm text-gray-600">
              Nova conexão WhatsApp <span className="font-medium">Suporte</span> estabelecida
            </p>
            <span className="text-xs text-gray-400">há 5 min</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Maria Santos</span> iniciou atendimento no ticket #1235
            </p>
            <span className="text-xs text-gray-400">há 8 min</span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;