import React, { useState, useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
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
} from 'lucide-react';
import { api } from '../lib/api';

const KanbanBoard = ({ leads, onLeadUpdate, onLeadDelete, onLeadView }) => {
  const [columns, setColumns] = useState({
    novo: { id: 'novo', title: 'Novos', color: 'bg-blue-100 border-blue-200', leads: [] },
    em_andamento: { id: 'em_andamento', title: 'Em Andamento', color: 'bg-yellow-100 border-yellow-200', leads: [] },
    qualificado: { id: 'qualificado', title: 'Qualificados', color: 'bg-purple-100 border-purple-200', leads: [] },
    convertido: { id: 'convertido', title: 'Convertidos', color: 'bg-green-100 border-green-200', leads: [] },
    perdido: { id: 'perdido', title: 'Perdidos', color: 'bg-red-100 border-red-200', leads: [] },
  });

  useEffect(() => {
    // Organizar leads por status
    const newColumns = { ...columns };
    
    // Limpar leads das colunas
    Object.keys(newColumns).forEach(key => {
      newColumns[key].leads = [];
    });
    
    // Distribuir leads nas colunas
    leads.forEach(lead => {
      const status = lead.status || 'novo';
      if (newColumns[status]) {
        newColumns[status].leads.push(lead);
      }
    });
    
    setColumns(newColumns);
  }, [leads]);

  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    // Se não há destino, não fazer nada
    if (!destination) return;

    // Se a posição não mudou, não fazer nada
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const sourceColumn = columns[source.droppableId];
    const destColumn = columns[destination.droppableId];
    const leadId = parseInt(draggableId);

    // Encontrar o lead
    const lead = sourceColumn.leads.find(l => l.id === leadId);
    if (!lead) return;

    // Atualizar estado local imediatamente
    const newColumns = { ...columns };
    
    // Remover da coluna origem
    newColumns[source.droppableId].leads = sourceColumn.leads.filter(l => l.id !== leadId);
    
    // Adicionar na coluna destino
    const updatedLead = { ...lead, status: destination.droppableId };
    newColumns[destination.droppableId].leads.splice(destination.index, 0, updatedLead);
    
    setColumns(newColumns);

    // Atualizar no backend
    try {
      await api.updateLead(leadId, { status: destination.droppableId });
      onLeadUpdate && onLeadUpdate(updatedLead);
    } catch (error) {
      console.error('Erro ao atualizar lead:', error);
      // Reverter mudança em caso de erro
      setColumns(columns);
    }
  };

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

  const LeadCard = ({ lead, index }) => (
    <Draggable draggableId={lead.id.toString()} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`mb-3 ${snapshot.isDragging ? 'rotate-2 shadow-lg' : ''}`}
        >
          <Card className="cursor-move hover:shadow-md transition-shadow">
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
                    <DropdownMenuItem onClick={() => onLeadView && onLeadView(lead)}>
                      <Eye className="mr-2 h-4 w-4" />
                      Ver detalhes
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onLeadUpdate && onLeadUpdate(lead)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => onLeadDelete && onLeadDelete(lead)}
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
                
                {lead.tags && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {lead.tags.split(',').slice(0, 2).map((tag, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {tag.trim()}
                      </Badge>
                    ))}
                  </div>
                )}
                
                <div className="flex items-center justify-between mt-2">
                  <Badge className={`text-xs ${getStatusBadgeColor(lead.status)}`}>
                    {lead.status}
                  </Badge>
                  
                  {lead.pontuacao && (
                    <span className="text-xs text-gray-500">
                      Score: {lead.pontuacao}
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </Draggable>
  );

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex space-x-4 overflow-x-auto pb-4">
        {Object.values(columns).map(column => (
          <div key={column.id} className="flex-shrink-0 w-80">
            <div className={`rounded-lg border-2 border-dashed ${column.color} p-4 min-h-[600px]`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-700">{column.title}</h3>
                <Badge variant="outline" className="text-xs">
                  {column.leads.length}
                </Badge>
              </div>
              
              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`min-h-[500px] ${
                      snapshot.isDraggingOver ? 'bg-gray-50 rounded-lg' : ''
                    }`}
                  >
                    {column.leads.map((lead, index) => (
                      <LeadCard key={lead.id} lead={lead} index={index} />
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
};

export default KanbanBoard;

