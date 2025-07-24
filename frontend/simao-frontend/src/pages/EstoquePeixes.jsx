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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Fish,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Droplets,
  Calendar,
  DollarSign,
  Edit,
  Trash2,
  Eye,
  Activity,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
} from 'lucide-react';

const EstoquePeixes = () => {
  const { user } = useAuth();
  const [lotes, setLotes] = useState([]);
  const [especies, setEspecies] = useState([]);
  const [viveiros, setViveiros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedLote, setSelectedLote] = useState(null);
  const [showLoteDialog, setShowLoteDialog] = useState(false);

  const statusColors = {
    ativo: 'bg-green-100 text-green-800',
    vendido: 'bg-blue-100 text-blue-800',
    morto: 'bg-red-100 text-red-800',
    transferido: 'bg-yellow-100 text-yellow-800',
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // Aqui você faria as chamadas para a API para carregar os dados
      // const [lotesResponse, especiesResponse, viveirosResponse] = await Promise.all([
      //   api.getLotesPeixe(),
      //   api.getEspecies(),
      //   api.getViveiros()
      // ]);
      
      // Mock data para demonstração
      setLotes([
        {
          id: 1,
          codigo_lote: 'TIL001',
          especie: 'Tilápia',
          quantidade_inicial: 5000,
          quantidade_atual: 4750,
          quantidade_mortalidade: 250,
          peso_medio_inicial: 2.5,
          peso_medio_atual: 125.0,
          data_entrada: '2024-01-15',
          data_previsao_venda: '2024-07-15',
          status: 'ativo',
          viveiro: 'Viveiro 01',
          taxa_mortalidade: 5.0,
          ganho_peso: 122.5,
          custo_total: 15750.00,
          receita_estimada: 28500.00
        },
        {
          id: 2,
          codigo_lote: 'TAM002',
          especie: 'Tambaqui',
          quantidade_inicial: 3000,
          quantidade_atual: 2850,
          quantidade_mortalidade: 150,
          peso_medio_inicial: 5.0,
          peso_medio_atual: 180.0,
          data_entrada: '2024-02-01',
          data_previsao_venda: '2024-08-01',
          status: 'ativo',
          viveiro: 'Viveiro 02',
          taxa_mortalidade: 5.0,
          ganho_peso: 175.0,
          custo_total: 12400.00,
          receita_estimada: 25650.00
        }
      ]);
    } catch (err) {
      setError('Erro ao carregar dados do estoque');
      console.error('Error loading stock data:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLotes = lotes.filter(lote => {
    const matchesSearch = !searchTerm || 
      lote.codigo_lote?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lote.especie?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lote.viveiro?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !statusFilter || lote.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

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

  const formatWeight = (weight) => {
    if (!weight) return '';
    return `${weight.toFixed(1)}g`;
  };

  const LoteCard = ({ lote }) => {
    const isLowStock = lote.quantidade_atual < (lote.quantidade_inicial * 0.1);
    const highMortality = lote.taxa_mortalidade > 10;
    const nearHarvest = new Date(lote.data_previsao_venda) - new Date() < 30 * 24 * 60 * 60 * 1000;

    return (
      <Card className="mb-4 hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10 bg-blue-100">
                <AvatarFallback className="text-blue-600">
                  <Fish className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-lg font-semibold">
                  {lote.codigo_lote}
                </CardTitle>
                <p className="text-sm text-gray-500">{lote.especie} - {lote.viveiro}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className={statusColors[lote.status]}>
                {lote.status.charAt(0).toUpperCase() + lote.status.slice(1)}
              </Badge>
              {nearHarvest && (
                <Badge variant="outline" className="text-orange-600 border-orange-600">
                  Próx. Colheita
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Alertas */}
          {(isLowStock || highMortality) && (
            <div className="flex space-x-2">
              {isLowStock && (
                <Badge variant="outline" className="text-red-600 border-red-600">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Estoque Baixo
                </Badge>
              )}
              {highMortality && (
                <Badge variant="outline" className="text-red-600 border-red-600">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Mortalidade Alta
                </Badge>
              )}
            </div>
          )}

          {/* Estatísticas principais */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{lote.quantidade_atual}</p>
              <p className="text-xs text-gray-500">Peixes Atuais</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{formatWeight(lote.peso_medio_atual)}</p>
              <p className="text-xs text-gray-500">Peso Médio</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{lote.taxa_mortalidade}%</p>
              <p className="text-xs text-gray-500">Mortalidade</p>
            </div>
          </div>

          {/* Informações adicionais */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Ganho de Peso:</span>
              <span className="font-medium flex items-center">
                <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                {formatWeight(lote.ganho_peso)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Custo Total:</span>
              <span className="font-medium text-red-600">{formatCurrency(lote.custo_total)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Receita Estimada:</span>
              <span className="font-medium text-green-600">{formatCurrency(lote.receita_estimada)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Previsão de Venda:</span>
              <span className="font-medium">{formatDate(lote.data_previsao_venda)}</span>
            </div>
          </div>

          {/* Ações */}
          <div className="flex justify-between pt-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                setSelectedLote(lote);
                setShowLoteDialog(true);
              }}
            >
              <Eye className="h-4 w-4 mr-1" />
              Detalhes
            </Button>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <Activity className="h-4 w-4 mr-1" />
                Biometria
              </Button>
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-1" />
                Editar
              </Button>
            </div>
          </div>
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Fish className="mr-2 h-6 w-6" />
            Estoque de Peixes
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Gerencie seus lotes de peixes, acompanhe crescimento e mortalidade
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-2">
          <Button variant="outline">
            <Droplets className="mr-2 h-4 w-4" />
            Qualidade da Água
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Novo Lote
          </Button>
        </div>
      </div>

      {/* Estatísticas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Fish className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold">{lotes.reduce((acc, lote) => acc + lote.quantidade_atual, 0)}</p>
                <p className="text-sm text-gray-600">Total de Peixes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold">{lotes.filter(l => l.status === 'ativo').length}</p>
                <p className="text-sm text-gray-600">Lotes Ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold">
                  {formatCurrency(lotes.reduce((acc, lote) => acc + (lote.receita_estimada || 0), 0))}
                </p>
                <p className="text-sm text-gray-600">Receita Estimada</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold">
                  {(lotes.reduce((acc, lote) => acc + lote.taxa_mortalidade, 0) / lotes.length).toFixed(1)}%
                </p>
                <p className="text-sm text-gray-600">Mortalidade Média</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar lotes..."
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
            <SelectItem value="ativo">Ativo</SelectItem>
            <SelectItem value="vendido">Vendido</SelectItem>
            <SelectItem value="morto">Morto</SelectItem>
            <SelectItem value="transferido">Transferido</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={loadData}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Alertas */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Lista de Lotes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredLotes.map(lote => (
          <LoteCard key={lote.id} lote={lote} />
        ))}
      </div>

      {filteredLotes.length === 0 && !loading && (
        <div className="text-center py-12">
          <Fish className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum lote encontrado</h3>
          <p className="mt-1 text-sm text-gray-500">
            Comece criando um novo lote de peixes.
          </p>
          <div className="mt-6">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Lote
            </Button>
          </div>
        </div>
      )}

      {/* Dialog de detalhes do lote */}
      <Dialog open={showLoteDialog} onOpenChange={setShowLoteDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Lote</DialogTitle>
            <DialogDescription>
              Informações completas do lote selecionado
            </DialogDescription>
          </DialogHeader>
          
          {selectedLote && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-blue-600">{selectedLote.quantidade_atual}</p>
                    <p className="text-xs text-gray-500">Peixes Atuais</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-green-600">{formatWeight(selectedLote.peso_medio_atual)}</p>
                    <p className="text-xs text-gray-500">Peso Médio</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-red-600">{selectedLote.taxa_mortalidade}%</p>
                    <p className="text-xs text-gray-500">Mortalidade</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-purple-600">{formatWeight(selectedLote.ganho_peso)}</p>
                    <p className="text-xs text-gray-500">Ganho de Peso</p>
                  </CardContent>
                </Card>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-lg font-semibold mb-3">Informações Gerais</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Código do Lote:</span>
                      <span className="text-sm font-medium">{selectedLote.codigo_lote}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Espécie:</span>
                      <span className="text-sm font-medium">{selectedLote.especie}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Viveiro:</span>
                      <span className="text-sm font-medium">{selectedLote.viveiro}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Status:</span>
                      <Badge className={statusColors[selectedLote.status]}>
                        {selectedLote.status.charAt(0).toUpperCase() + selectedLote.status.slice(1)}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-lg font-semibold mb-3">Dados Financeiros</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Custo Total:</span>
                      <span className="text-sm font-medium text-red-600">{formatCurrency(selectedLote.custo_total)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Receita Estimada:</span>
                      <span className="text-sm font-medium text-green-600">{formatCurrency(selectedLote.receita_estimada)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Margem Estimada:</span>
                      <span className="text-sm font-medium text-blue-600">
                        {formatCurrency((selectedLote.receita_estimada || 0) - (selectedLote.custo_total || 0))}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Data Prev. Venda:</span>
                      <span className="text-sm font-medium">{formatDate(selectedLote.data_previsao_venda)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EstoquePeixes;