from flask import Blueprint, request, jsonify, g
from datetime import datetime
import logging

from src.models.user import db, Lead, Conversa, Mensagem, AtividadeLead
from src.models.lead import StatusLeadEnum, OrigemEnum
from src.services.message_processor import message_processor
from src.middleware.auth import require_auth, require_active_subscription, get_tenant_resource, log_user_activity

logger = logging.getLogger(__name__)

leads_bp = Blueprint('leads_v2', __name__)

@leads_bp.route('/leads', methods=['GET'])
@require_auth
@log_user_activity('list_leads')
def get_leads():
    """
    Lista todos os leads do cliente
    """
    try:
        cliente_id = g.cliente_id
        
        # Parâmetros de filtro
        status = request.args.get('status')
        origem = request.args.get('origem')
        search = request.args.get('search')
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))
        
        # Query base com isolamento por tenant
        query = Lead.query.filter_by(cliente_id=cliente_id)
        
        # Aplicar filtros
        if status:
            query = query.filter_by(status=StatusLeadEnum(status))
        
        if origem:
            query = query.filter_by(origem=OrigemEnum(origem))
        
        if search:
            query = query.filter(
                db.or_(
                    Lead.nome.ilike(f'%{search}%'),
                    Lead.telefone.ilike(f'%{search}%'),
                    Lead.email.ilike(f'%{search}%'),
                    Lead.empresa.ilike(f'%{search}%')
                )
            )
        
        # Ordenar por data de criação (mais recentes primeiro)
        query = query.order_by(Lead.data_criacao.desc())
        
        # Paginação
        leads_paginated = query.paginate(
            page=page, 
            per_page=per_page, 
            error_out=False
        )
        
        leads_data = [lead.to_dict() for lead in leads_paginated.items]
        
        return jsonify({
            "leads": leads_data,
            "pagination": {
                "page": page,
                "per_page": per_page,
                "total": leads_paginated.total,
                "pages": leads_paginated.pages,
                "has_next": leads_paginated.has_next,
                "has_prev": leads_paginated.has_prev
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Erro ao listar leads: {e}")
        return jsonify({"error": "Erro interno do servidor"}), 500

@leads_bp.route('/leads/<int:lead_id>', methods=['GET'])
@require_auth
@log_user_activity('view_lead')
def get_lead(lead_id):
    """
    Obtém detalhes de um lead específico
    """
    try:
        # Usar função de isolamento por tenant
        lead = get_tenant_resource(lead_id, Lead)
        
        if not lead:
            return jsonify({"error": "Lead não encontrado"}), 404
        
        # Incluir conversas e atividades
        lead_data = lead.to_dict()
        
        # Buscar conversas do tenant
        conversas = Conversa.query.filter_by(
            lead_id=lead_id,
            cliente_id=g.cliente_id
        ).all()
        lead_data['conversas'] = [conversa.to_dict() for conversa in conversas]
        
        # Buscar atividades do tenant
        atividades = AtividadeLead.query.filter_by(
            lead_id=lead_id
        ).order_by(AtividadeLead.data_atividade.desc()).all()
        lead_data['atividades'] = [atividade.to_dict() for atividade in atividades]
        
        return jsonify(lead_data), 200
        
    except Exception as e:
        logger.error(f"Erro ao obter lead: {e}")
        return jsonify({"error": "Erro interno do servidor"}), 500

@leads_bp.route('/leads', methods=['POST'])
@require_active_subscription
@log_user_activity('create_lead')
def create_lead():
    """
    Cria um novo lead
    """
    try:
        cliente_id = g.cliente_id
        data = request.get_json()
        
        # Validar telefone obrigatório
        if not data.get('telefone'):
            return jsonify({"error": "Telefone é obrigatório"}), 400
        
        # Verificar se já existe lead com este telefone no tenant
        existing_lead = Lead.query.filter_by(
            cliente_id=cliente_id,
            telefone=data['telefone']
        ).first()
        
        if existing_lead:
            return jsonify({"error": "Já existe um lead com este telefone"}), 409
        
        # Criar lead com isolamento por tenant
        lead = Lead(
            cliente_id=cliente_id,
            nome=data.get('nome'),
            telefone=data['telefone'],
            email=data.get('email'),
            empresa=data.get('empresa'),
            cargo=data.get('cargo'),
            cidade=data.get('cidade'),
            estado=data.get('estado'),
            cep=data.get('cep'),
            status=StatusLeadEnum(data.get('status', 'novo')),
            origem=OrigemEnum(data.get('origem', 'manual')),
            tipo_propriedade=data.get('tipo_propriedade'),
            tamanho_propriedade=data.get('tamanho_propriedade'),
            culturas=data.get('culturas'),
            interesse_principal=data.get('interesse_principal'),
            observacoes=data.get('observacoes'),
            tags=','.join(data.get('tags', [])) if data.get('tags') else None,
            valor_estimado=data.get('valor_estimado'),
            probabilidade_fechamento=data.get('probabilidade_fechamento', 0)
        )
        
        # Calcular pontuação
        lead.calcular_pontuacao()
        
        db.session.add(lead)
        db.session.commit()
        
        # Registrar atividade
        atividade = AtividadeLead(
            lead_id=lead.id,
            tipo='criacao',
            descricao='Lead criado manualmente'
        )
        db.session.add(atividade)
        db.session.commit()
        
        logger.info(f"Novo lead criado: {lead.telefone} - Cliente: {g.current_user.email}")
        
        return jsonify({
            "message": "Lead criado com sucesso",
            "lead": lead.to_dict()
        }), 201
        
    except Exception as e:
        logger.error(f"Erro ao criar lead: {e}")
        db.session.rollback()
        return jsonify({"error": "Erro interno do servidor"}), 500

@leads_bp.route('/leads/<int:lead_id>', methods=['PUT'])
@require_auth
@log_user_activity('update_lead')
def update_lead(lead_id):
    """
    Atualiza um lead
    """
    try:
        # Usar função de isolamento por tenant
        lead = get_tenant_resource(lead_id, Lead)
        
        if not lead:
            return jsonify({"error": "Lead não encontrado"}), 404
        
        data = request.get_json()
        
        # Campos que podem ser atualizados
        updatable_fields = [
            'nome', 'email', 'empresa', 'cargo', 'cidade', 'estado', 'cep',
            'tipo_propriedade', 'tamanho_propriedade', 'culturas', 'interesse_principal',
            'observacoes', 'valor_estimado', 'probabilidade_fechamento'
        ]
        
        # Registrar mudanças para atividade
        changes = []
        
        for field in updatable_fields:
            if field in data:
                old_value = getattr(lead, field)
                new_value = data[field]
                
                if old_value != new_value:
                    setattr(lead, field, new_value)
                    changes.append(f"{field}: '{old_value}' → '{new_value}'")
        
        # Atualizar status se fornecido
        if 'status' in data:
            old_status = lead.status.value if lead.status else None
            new_status = data['status']
            
            if old_status != new_status:
                lead.status = StatusLeadEnum(new_status)
                changes.append(f"status: '{old_status}' → '{new_status}'")
                
                # Se convertido, registrar data
                if new_status == 'convertido':
                    lead.data_conversao = datetime.utcnow()
        
        # Atualizar tags
        if 'tags' in data:
            lead.tags = ','.join(data['tags']) if data['tags'] else None
        
        # Atualizar data de próximo follow-up
        if 'data_proximo_followup' in data:
            if data['data_proximo_followup']:
                lead.data_proximo_followup = datetime.fromisoformat(data['data_proximo_followup'])
            else:
                lead.data_proximo_followup = None
        
        # Recalcular pontuação
        lead.calcular_pontuacao()
        lead.data_atualizacao = datetime.utcnow()
        
        db.session.commit()
        
        # Registrar atividade se houve mudanças
        if changes:
            atividade = AtividadeLead(
                lead_id=lead.id,
                tipo='atualizacao',
                descricao=f"Lead atualizado: {'; '.join(changes)}"
            )
            db.session.add(atividade)
            db.session.commit()
        
        return jsonify({
            "message": "Lead atualizado com sucesso",
            "lead": lead.to_dict()
        }), 200
        
    except Exception as e:
        logger.error(f"Erro ao atualizar lead: {e}")
        db.session.rollback()
        return jsonify({"error": "Erro interno do servidor"}), 500

@leads_bp.route('/leads/<int:lead_id>', methods=['DELETE'])
@require_auth
@log_user_activity('delete_lead')
def delete_lead(lead_id):
    """
    Exclui um lead
    """
    try:
        # Usar função de isolamento por tenant
        lead = get_tenant_resource(lead_id, Lead)
        
        if not lead:
            return jsonify({"error": "Lead não encontrado"}), 404
        
        db.session.delete(lead)
        db.session.commit()
        
        logger.info(f"Lead excluído: {lead_id} - Cliente: {g.current_user.email}")
        
        return jsonify({"message": "Lead excluído com sucesso"}), 200
        
    except Exception as e:
        logger.error(f"Erro ao excluir lead: {e}")
        db.session.rollback()
        return jsonify({"error": "Erro interno do servidor"}), 500

@leads_bp.route('/leads/stats', methods=['GET'])
@require_auth
@log_user_activity('view_stats')
def get_leads_stats():
    """
    Obtém estatísticas dos leads
    """
    try:
        cliente_id = g.cliente_id
        
        # Contar leads por status
        stats_by_status = {}
        for status in StatusLeadEnum:
            count = Lead.query.filter_by(cliente_id=cliente_id, status=status).count()
            stats_by_status[status.value] = count
        
        # Contar leads por origem
        stats_by_origem = {}
        for origem in OrigemEnum:
            count = Lead.query.filter_by(cliente_id=cliente_id, origem=origem).count()
            stats_by_origem[origem.value] = count
        
        # Total de leads
        total_leads = Lead.query.filter_by(cliente_id=cliente_id).count()
        
        # Leads criados nos últimos 30 dias
        from datetime import timedelta
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        leads_last_30_days = Lead.query.filter(
            Lead.cliente_id == cliente_id,
            Lead.data_criacao >= thirty_days_ago
        ).count()
        
        return jsonify({
            "total_leads": total_leads,
            "leads_last_30_days": leads_last_30_days,
            "by_status": stats_by_status,
            "by_origem": stats_by_origem
        }), 200
        
    except Exception as e:
        logger.error(f"Erro ao obter estatísticas: {e}")
        return jsonify({"error": "Erro interno do servidor"}), 500

