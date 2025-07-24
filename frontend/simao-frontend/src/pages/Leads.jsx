import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Users,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Phone,
  Mail,
  Building,
  MapPin,
  Calendar,
  DollarSign,
  Edit,
  Trash2,
  Eye,
  MessageSquare,
  RefreshCw,
} from 'lucide-react';

const Leads = () => {
  const { user } = useAuth();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedLead, setSelectedLead] = useState(null);
  const [showLeadDialog, setShowLeadDialog] = useState(false);

  const statusColumns = {
    novo: { title: 'Novos', color: 'bg-blue-50 border-blue-200', textColor: 'text-blue-700' },
    em_andamento: { title: 'Em Andamento', color: 'bg-yellow-50 border-yellow-200', textColor: 'text-yellow-700' },
    qualificado: { title: 'Qualificados', color: 'bg-purple-50 border-purple-200', textColor: 'text-purple-700' },
    convertido: { title: 'Convertidos', color: 'bg-green-50 border-green-200', textColor: 'text-green-700' },
    perdido: { title: 'Perdidos', color: 'bg-red-50 border-red-200', textColor: 'text-red-700' },
  };

  useEffect(() => {
    loadLeads();
  }, []);

  const loadLeads = async () => {
    try {
      setLoading(true);
      const response = await api.getLeads();
      setLeads(response.leads || []);
    } catch (err) {
      setError('Erro ao carregar leads');
      console.error('Error loading leads:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (leadId, newStatus) => {
    try {
      await api.updateLead(leadId, { status: newStatus });
      setLeads(leads.map(lead => 
        lead.id === leadId ? { ...lead, status: newStatus } : lead
      ));
    } catch (err) {
      setError('Erro ao atualizar status do lead');
    }
  };

  const handleDeleteLead = async (leadId) => {
    if (!confirm('Tem certeza que deseja excluir este lead?')) return;
    
    try {
      await api.deleteLead(leadId);
      setLeads(leads.filter(lead => lead.id !== leadId));
    } catch (err) {
      setError('Erro ao excluir lead');
    }
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = !searchTerm || 
      lead.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.telefone?.includes(searchTerm) ||
      lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.empresa?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !statusFilter || lead.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const groupedLeads = Object.keys(statusColumns).reduce((acc, status) => {
    acc[status] = filteredLeads.filter(lead => lead.status === status);
    return acc;
  }, {});

  const formatCurrency = (value) => {
    if (!value) return '';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusBadgeColor = (status) => {
    const colors = {
      novo: 'bg-blue-100 text-blue-800',
      em_andamento: 'bg-yellow-100 text-yellow-800',
      qualificado: 'bg-purple-100 text-purple-800',
      convertido: 'bg-green-100 text-green-800',
      perdido: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const LeadCard = ({ lead }) => (
    <Card className="mb-3 hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">
                {lead.nome ? lead.nome.charAt(0).toUpperCase() : 'L'}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-sm font-medium">
                {lead.nome || 'Lead sem nome'}
              </CardTitle>
              {lead.empresa && (
                <p className="text-xs text-gray-500 flex items-center">
                  <Building className="h-3 w-3 mr-1" />
                  {lead.empresa}
                </p>
              )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => {
                setSelectedLead(lead);
                setShowLeadDialog(true);
              }}>
                <Eye className="mr-2 h-4 w-4" />
                Ver detalhes
              </DropdownMenuItem>
              <DropdownMenuItem>
                <MessageSquare className="mr-2 h-4 w-4" />
                Enviar mensagem
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleDeleteLead(lead.id)}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          {lead.telefone && (
            <div className="flex items-center text-xs text-gray-600">
              <Phone className="h-3 w-3 mr-1" />
              {lead.telefone}
            </div>
          )}
          
          {lead.email && (
            <div className="flex items-center text-xs text-gray-600">
              <Mail className="h-3 w-3 mr-1" />
              {lead.email}
            </div>
          )}
          
          {(lead.cidade || lead.estado) && (
            <div className="flex items-center text-xs text-gray-600">
              <MapPin className="h-3 w-3 mr-1" />
              {[lead.cidade, lead.estado].filter(Boolean).join(', ')}
            </div>
          )}
          
          {lead.valor_estimado && (
            <div className="flex items-center text-xs text-green-600 font-medium">
              <DollarSign className="h-3 w-3 mr-1" />
              {formatCurrency(lead.valor_estimado)}
            </div>
          )}
          
          {lead.data_proximo_followup && (
            <div className="flex items-center text-xs text-orange-600">
              <Calendar className="h-3 w-3 mr-1" />
              Follow-up: {formatDate(lead.data_proximo_followup)}
            </div>
          )}
          
          <div className="flex items-center justify-between mt-2">
            <Select
              value={lead.status}
              onValueChange={(value) => handleStatusChange(lead.id, value)}
            >
              <SelectTrigger className="w-32 h-6 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="novo">Novo</SelectItem>
                <SelectItem value="em_andamento">Em Andamento</SelectItem>
                <SelectItem value="qualificado">Qualificado</SelectItem>
                <SelectItem value="convertido">Convertido</SelectItem>
                <SelectItem value="perdido">Perdido</SelectItem>
              </SelectContent>
            </Select>
            
            {lead.pontuacao && (
              <span className="text-xs text-gray-500">
                Score: {lead.pontuacao}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

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
            <Users className="mr-2 h-6 w-6" />
            Leads de Piscicultura
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Gerencie seus leads de alevinos e acompanhe o funil de vendas aquícolas
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Novo Lead
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar leads..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos os status</SelectItem>
            <SelectItem value="novo">Novos</SelectItem>
            <SelectItem value="em_andamento">Em Andamento</SelectItem>
            <SelectItem value="qualificado">Qualificados</SelectItem>
            <SelectItem value="convertido">Convertidos</SelectItem>
            <SelectItem value="perdido">Perdidos</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={loadLeads}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Alertas */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Kanban Board */}
      <div className="flex space-x-4 overflow-x-auto pb-4">
        {Object.entries(statusColumns).map(([status, column]) => (
          <div key={status} className="flex-shrink-0 w-80">
            <div className={`rounded-lg border-2 ${column.color} p-4 min-h-[600px]`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`font-semibold ${column.textColor}`}>
                  {column.title}
                </h3>
                <Badge variant="outline" className="text-xs">
                  {groupedLeads[status]?.length || 0}
                </Badge>
              </div>
              
              <div className="space-y-3">
                {groupedLeads[status]?.map(lead => (
                  <LeadCard key={lead.id} lead={lead} />
                ))}
                
                {groupedLeads[status]?.length === 0 && (
                  <div className="text-center text-gray-500 text-sm py-8">
                    Nenhum lead neste status
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Dialog de detalhes do lead */}
      <Dialog open={showLeadDialog} onOpenChange={setShowLeadDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Lead</DialogTitle>
            <DialogDescription>
              Informações completas do lead selecionado
            </DialogDescription>
          </DialogHeader>
          
          {selectedLead && (
            <div className="space-y-6">
              {/* Informações Básicas */}
              <div>
                <h4 className="text-lg font-semibold mb-3">Informações Básicas</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Nome</label>
                    <p className="text-sm text-gray-600">{selectedLead.nome || 'Não informado'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Email</label>
                    <p className="text-sm text-gray-600">{selectedLead.email || 'Não informado'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Telefone</label>
                    <p className="text-sm text-gray-600">{selectedLead.telefone || 'Não informado'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Empresa</label>
                    <p className="text-sm text-gray-600">{selectedLead.empresa || 'Não informado'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Status</label>
                    <Badge className={getStatusBadgeColor(selectedLead.status)}>
                      {selectedLead.status}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Pontuação</label>
                    <p className="text-sm text-gray-600">{selectedLead.pontuacao || 'Não calculada'}</p>
                  </div>
                </div>
              </div>

              {/* Informações da Piscicultura */}
              <div>
                <h4 className="text-lg font-semibold mb-3">Dados da Piscicultura</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Tipo de Propriedade</label>
                    <p className="text-sm text-gray-600">{selectedLead.tipo_propriedade || 'Não informado'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Área de Lâmina d'Água</label>
                    <p className="text-sm text-gray-600">{selectedLead.area_lamina_agua || 'Não informado'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Espécies de Interesse</label>
                    <p className="text-sm text-gray-600">{selectedLead.especies_interesse || 'Não informado'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Tipo de Sistema</label>
                    <p className="text-sm text-gray-600">{selectedLead.tipo_sistema || 'Não informado'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Volume de Água</label>
                    <p className="text-sm text-gray-600">{selectedLead.volume_agua || 'Não informado'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Qtd. de Viveiros</label>
                    <p className="text-sm text-gray-600">{selectedLead.qtd_viveiros || 'Não informado'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Experiência</label>
                    <p className="text-sm text-gray-600">{selectedLead.experiencia_piscicultura || 'Não informado'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Interesse Principal</label>
                    <p className="text-sm text-gray-600">{selectedLead.interesse_principal || 'Não informado'}</p>
                  </div>
                </div>
              </div>
              
              {selectedLead.observacoes && (
                <div>
                  <label className="text-sm font-medium">Observações</label>
                  <p className="text-sm text-gray-600">{selectedLead.observacoes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Leads;

