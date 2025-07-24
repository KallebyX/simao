"""
Rotas para Gestão de Estoque de Peixes - Simão IA Rural
Sistema completo de controle de estoque para piscicultura
"""

from datetime import datetime, date, timedelta
from decimal import Decimal
from typing import List, Dict, Any
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import and_, or_, func, desc
from sqlalchemy.orm import joinedload

from src.models.user import db, Cliente
from src.models.estoque_peixe import (
    EspeciePeixe, Viveiro, LotePeixe, MovimentacaoEstoque, 
    RegistroAlimentacao, TipoMovimentacao
)

# Blueprint para rotas de estoque
estoque_bp = Blueprint('estoque', __name__, url_prefix='/api/estoque')

@estoque_bp.route('/especies', methods=['GET'])
@jwt_required()
def listar_especies():
    """Lista todas as espécies de peixes cadastradas"""
    try:
        user_id = get_jwt_identity()
        cliente = Cliente.query.filter_by(user_id=user_id).first()
        
        if not cliente:
            return jsonify({"error": "Cliente não encontrado"}), 404
        
        especies = EspeciePeixe.query.filter_by(cliente_id=cliente.id).all()
        
        return jsonify({
            "especies": [especie.to_dict() for especie in especies],
            "total": len(especies)
        }), 200
        
    except Exception as e:
        return jsonify({"error": f"Erro ao listar espécies: {str(e)}"}), 500

@estoque_bp.route('/especies', methods=['POST'])
@jwt_required()
def criar_especie():
    """Cria nova espécie de peixe"""
    try:
        user_id = get_jwt_identity()
        cliente = Cliente.query.filter_by(user_id=user_id).first()
        
        if not cliente:
            return jsonify({"error": "Cliente não encontrado"}), 404
        
        data = request.get_json()
        
        # Validar dados obrigatórios
        required_fields = ['nome', 'nome_cientifico']
        for field in required_fields:
            if not data.get(field):
                return jsonify({"error": f"Campo '{field}' é obrigatório"}), 400
        
        # Verificar se já existe espécie com mesmo nome
        especie_existente = EspeciePeixe.query.filter_by(
            cliente_id=cliente.id,
            nome=data['nome']
        ).first()
        
        if especie_existente:
            return jsonify({"error": "Já existe uma espécie com este nome"}), 400
        
        nova_especie = EspeciePeixe(
            cliente_id=cliente.id,
            nome=data['nome'],
            nome_cientifico=data['nome_cientifico'],
            peso_medio_adulto=data.get('peso_medio_adulto'),
            tempo_engorda=data.get('tempo_engorda'),
            temperatura_ideal_min=data.get('temperatura_ideal_min'),
            temperatura_ideal_max=data.get('temperatura_ideal_max'),
            ph_ideal_min=data.get('ph_ideal_min'),
            ph_ideal_max=data.get('ph_ideal_max'),
            observacoes=data.get('observacoes')
        )
        
        db.session.add(nova_especie)
        db.session.commit()
        
        return jsonify({
            "message": "Espécie criada com sucesso",
            "especie": nova_especie.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Erro ao criar espécie: {str(e)}"}), 500

@estoque_bp.route('/viveiros', methods=['GET'])
@jwt_required()
def listar_viveiros():
    """Lista todos os viveiros do cliente"""
    try:
        user_id = get_jwt_identity()
        cliente = Cliente.query.filter_by(user_id=user_id).first()
        
        if not cliente:
            return jsonify({"error": "Cliente não encontrado"}), 404
        
        viveiros = Viveiro.query.filter_by(cliente_id=cliente.id).all()
        
        return jsonify({
            "viveiros": [viveiro.to_dict() for viveiro in viveiros],
            "total": len(viveiros)
        }), 200
        
    except Exception as e:
        return jsonify({"error": f"Erro ao listar viveiros: {str(e)}"}), 500

@estoque_bp.route('/viveiros', methods=['POST'])
@jwt_required()
def criar_viveiro():
    """Cria novo viveiro"""
    try:
        user_id = get_jwt_identity()
        cliente = Cliente.query.filter_by(user_id=user_id).first()
        
        if not cliente:
            return jsonify({"error": "Cliente não encontrado"}), 404
        
        data = request.get_json()
        
        # Validar dados obrigatórios
        required_fields = ['nome', 'capacidade_litros']
        for field in required_fields:
            if not data.get(field):
                return jsonify({"error": f"Campo '{field}' é obrigatório"}), 400
        
        # Verificar se já existe viveiro com mesmo nome
        viveiro_existente = Viveiro.query.filter_by(
            cliente_id=cliente.id,
            nome=data['nome']
        ).first()
        
        if viveiro_existente:
            return jsonify({"error": "Já existe um viveiro com este nome"}), 400
        
        novo_viveiro = Viveiro(
            cliente_id=cliente.id,
            nome=data['nome'],
            tipo_sistema=data.get('tipo_sistema', 'escavado'),
            capacidade_litros=data['capacidade_litros'],
            profundidade_media=data.get('profundidade_media'),
            formato=data.get('formato'),
            revestimento=data.get('revestimento'),
            aeracao=data.get('aeracao', False),
            filtragem=data.get('filtragem', False),
            observacoes=data.get('observacoes')
        )
        
        db.session.add(novo_viveiro)
        db.session.commit()
        
        return jsonify({
            "message": "Viveiro criado com sucesso",
            "viveiro": novo_viveiro.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Erro ao criar viveiro: {str(e)}"}), 500

@estoque_bp.route('/lotes', methods=['GET'])
@jwt_required()
def listar_lotes():
    """Lista todos os lotes de peixes"""
    try:
        user_id = get_jwt_identity()
        cliente = Cliente.query.filter_by(user_id=user_id).first()
        
        if not cliente:
            return jsonify({"error": "Cliente não encontrado"}), 404
        
        # Filtros opcionais
        status = request.args.get('status')
        viveiro_id = request.args.get('viveiro_id', type=int)
        especie_id = request.args.get('especie_id', type=int)
        
        query = LotePeixe.query.filter_by(cliente_id=cliente.id)
        
        if status:
            query = query.filter(LotePeixe.status == status)
        if viveiro_id:
            query = query.filter(LotePeixe.viveiro_id == viveiro_id)
        if especie_id:
            query = query.filter(LotePeixe.especie_id == especie_id)
        
        # Incluir relacionamentos
        lotes = query.options(
            joinedload(LotePeixe.especie),
            joinedload(LotePeixe.viveiro)
        ).order_by(desc(LotePeixe.data_criacao)).all()
        
        lotes_data = []
        for lote in lotes:
            lote_dict = lote.to_dict()
            # Calcular métricas adicionais
            lote_dict.update({
                "peso_total_estimado": lote.calcular_peso_total(),
                "dias_criacao": (datetime.utcnow() - lote.data_criacao).days,
                "taxa_mortalidade": lote.calcular_taxa_mortalidade(),
                "projecao_colheita": lote.estimar_data_colheita()
            })
            lotes_data.append(lote_dict)
        
        return jsonify({
            "lotes": lotes_data,
            "total": len(lotes)
        }), 200
        
    except Exception as e:
        return jsonify({"error": f"Erro ao listar lotes: {str(e)}"}), 500

@estoque_bp.route('/lotes', methods=['POST'])
@jwt_required()
def criar_lote():
    """Cria novo lote de peixes"""
    try:
        user_id = get_jwt_identity()
        cliente = Cliente.query.filter_by(user_id=user_id).first()
        
        if not cliente:
            return jsonify({"error": "Cliente não encontrado"}), 404
        
        data = request.get_json()
        
        # Validar dados obrigatórios
        required_fields = ['especie_id', 'viveiro_id', 'quantidade_inicial', 'peso_medio_inicial']
        for field in required_fields:
            if not data.get(field):
                return jsonify({"error": f"Campo '{field}' é obrigatório"}), 400
        
        # Verificar se espécie e viveiro existem e pertencem ao cliente
        especie = EspeciePeixe.query.filter_by(
            id=data['especie_id'],
            cliente_id=cliente.id
        ).first()
        
        if not especie:
            return jsonify({"error": "Espécie não encontrada"}), 404
        
        viveiro = Viveiro.query.filter_by(
            id=data['viveiro_id'],
            cliente_id=cliente.id
        ).first()
        
        if not viveiro:
            return jsonify({"error": "Viveiro não encontrado"}), 404
        
        novo_lote = LotePeixe(
            cliente_id=cliente.id,
            especie_id=data['especie_id'],
            viveiro_id=data['viveiro_id'],
            codigo=data.get('codigo', f"LOTE_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"),
            quantidade_inicial=data['quantidade_inicial'],
            quantidade_atual=data['quantidade_inicial'],
            peso_medio_inicial=Decimal(str(data['peso_medio_inicial'])),
            peso_medio_atual=Decimal(str(data['peso_medio_inicial'])),
            data_povoamento=datetime.fromisoformat(data['data_povoamento']) if data.get('data_povoamento') else datetime.utcnow(),
            custo_alevinos=Decimal(str(data.get('custo_alevinos', 0))),
            observacoes=data.get('observacoes')
        )
        
        db.session.add(novo_lote)
        db.session.commit()
        
        # Criar movimentação de entrada
        movimentacao = MovimentacaoEstoque(
            cliente_id=cliente.id,
            lote_id=novo_lote.id,
            tipo=TipoMovimentacao.ENTRADA,
            quantidade=novo_lote.quantidade_inicial,
            peso_medio=novo_lote.peso_medio_inicial,
            descricao="Povoamento inicial do lote",
            data_movimentacao=novo_lote.data_povoamento
        )
        
        db.session.add(movimentacao)
        db.session.commit()
        
        return jsonify({
            "message": "Lote criado com sucesso",
            "lote": novo_lote.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Erro ao criar lote: {str(e)}"}), 500

@estoque_bp.route('/lotes/<int:lote_id>/movimentacoes', methods=['GET'])
@jwt_required()
def listar_movimentacoes_lote(lote_id):
    """Lista movimentações de um lote específico"""
    try:
        user_id = get_jwt_identity()
        cliente = Cliente.query.filter_by(user_id=user_id).first()
        
        if not cliente:
            return jsonify({"error": "Cliente não encontrado"}), 404
        
        # Verificar se lote existe e pertence ao cliente
        lote = LotePeixe.query.filter_by(
            id=lote_id,
            cliente_id=cliente.id
        ).first()
        
        if not lote:
            return jsonify({"error": "Lote não encontrado"}), 404
        
        movimentacoes = MovimentacaoEstoque.query.filter_by(
            lote_id=lote_id
        ).order_by(desc(MovimentacaoEstoque.data_movimentacao)).all()
        
        return jsonify({
            "lote": lote.to_dict(),
            "movimentacoes": [mov.to_dict() for mov in movimentacoes],
            "total_movimentacoes": len(movimentacoes)
        }), 200
        
    except Exception as e:
        return jsonify({"error": f"Erro ao listar movimentações: {str(e)}"}), 500

@estoque_bp.route('/lotes/<int:lote_id>/movimentacoes', methods=['POST'])
@jwt_required()
def criar_movimentacao(lote_id):
    """Registra nova movimentação no lote"""
    try:
        user_id = get_jwt_identity()
        cliente = Cliente.query.filter_by(user_id=user_id).first()
        
        if not cliente:
            return jsonify({"error": "Cliente não encontrado"}), 404
        
        # Verificar se lote existe e pertence ao cliente
        lote = LotePeixe.query.filter_by(
            id=lote_id,
            cliente_id=cliente.id
        ).first()
        
        if not lote:
            return jsonify({"error": "Lote não encontrado"}), 404
        
        data = request.get_json()
        
        # Validar dados obrigatórios
        required_fields = ['tipo', 'quantidade']
        for field in required_fields:
            if not data.get(field):
                return jsonify({"error": f"Campo '{field}' é obrigatório"}), 400
        
        # Validar tipo de movimentação
        try:
            tipo_mov = TipoMovimentacao(data['tipo'])
        except ValueError:
            return jsonify({"error": "Tipo de movimentação inválido"}), 400
        
        movimentacao = MovimentacaoEstoque(
            cliente_id=cliente.id,
            lote_id=lote_id,
            tipo=tipo_mov,
            quantidade=data['quantidade'],
            peso_medio=Decimal(str(data.get('peso_medio', 0))) if data.get('peso_medio') else None,
            valor_unitario=Decimal(str(data.get('valor_unitario', 0))) if data.get('valor_unitario') else None,
            descricao=data.get('descricao', ''),
            data_movimentacao=datetime.fromisoformat(data['data_movimentacao']) if data.get('data_movimentacao') else datetime.utcnow()
        )
        
        db.session.add(movimentacao)
        
        # Atualizar quantidades do lote
        if tipo_mov in [TipoMovimentacao.ENTRADA, TipoMovimentacao.REPOSICAO]:
            lote.quantidade_atual += data['quantidade']
        elif tipo_mov in [TipoMovimentacao.SAIDA, TipoMovimentacao.VENDA, TipoMovimentacao.MORTALIDADE]:
            if lote.quantidade_atual < data['quantidade']:
                return jsonify({"error": "Quantidade insuficiente no lote"}), 400
            lote.quantidade_atual -= data['quantidade']
        
        # Atualizar peso médio se informado
        if data.get('peso_medio') and tipo_mov not in [TipoMovimentacao.MORTALIDADE]:
            lote.peso_medio_atual = Decimal(str(data['peso_medio']))
        
        # Atualizar data última movimentação
        lote.data_ultima_movimentacao = movimentacao.data_movimentacao
        
        db.session.commit()
        
        return jsonify({
            "message": "Movimentação registrada com sucesso",
            "movimentacao": movimentacao.to_dict(),
            "lote_atualizado": lote.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Erro ao registrar movimentação: {str(e)}"}), 500

@estoque_bp.route('/dashboard', methods=['GET'])
@jwt_required()
def dashboard_estoque():
    """Dashboard com resumo do estoque"""
    try:
        user_id = get_jwt_identity()
        cliente = Cliente.query.filter_by(user_id=user_id).first()
        
        if not cliente:
            return jsonify({"error": "Cliente não encontrado"}), 404
        
        # Estatísticas gerais
        total_lotes = LotePeixe.query.filter_by(cliente_id=cliente.id).count()
        lotes_ativos = LotePeixe.query.filter_by(
            cliente_id=cliente.id,
            status='ativo'
        ).count()
        
        total_viveiros = Viveiro.query.filter_by(cliente_id=cliente.id).count()
        total_especies = EspeciePeixe.query.filter_by(cliente_id=cliente.id).count()
        
        # Quantidade total de peixes por espécie
        especies_stats = db.session.query(
            EspeciePeixe.nome,
            func.sum(LotePeixe.quantidade_atual).label('total_quantidade'),
            func.avg(LotePeixe.peso_medio_atual).label('peso_medio')
        ).join(
            LotePeixe, EspeciePeixe.id == LotePeixe.especie_id
        ).filter(
            EspeciePeixe.cliente_id == cliente.id,
            LotePeixe.status == 'ativo'
        ).group_by(EspeciePeixe.nome).all()
        
        # Lotes com alerta (mortalidade alta, crescimento lento)
        lotes_com_alerta = []
        for lote in LotePeixe.query.filter_by(cliente_id=cliente.id, status='ativo').all():
            taxa_mortalidade = lote.calcular_taxa_mortalidade()
            if taxa_mortalidade > 10:  # Mortalidade acima de 10%
                lotes_com_alerta.append({
                    "lote": lote.to_dict(),
                    "alerta": f"Alta mortalidade: {taxa_mortalidade:.1f}%"
                })
        
        # Movimentações recentes (últimos 30 dias)
        data_limite = datetime.utcnow() - timedelta(days=30)
        movimentacoes_recentes = MovimentacaoEstoque.query.filter(
            MovimentacaoEstoque.cliente_id == cliente.id,
            MovimentacaoEstoque.data_movimentacao >= data_limite
        ).count()
        
        # Valor estimado do estoque
        valor_total_estimado = 0
        for lote in LotePeixe.query.filter_by(cliente_id=cliente.id, status='ativo').all():
            # Estimativa baseada em peso e quantidade
            peso_total = float(lote.quantidade_atual * lote.peso_medio_atual)
            valor_estimado_kg = 15.0  # R$ por kg (valor médio)
            valor_total_estimado += peso_total * valor_estimado_kg
        
        dashboard_data = {
            "resumo": {
                "total_lotes": total_lotes,
                "lotes_ativos": lotes_ativos,
                "total_viveiros": total_viveiros,
                "total_especies": total_especies,
                "valor_estimado": valor_total_estimado,
                "movimentacoes_mes": movimentacoes_recentes
            },
            "especies": [
                {
                    "nome": esp.nome,
                    "quantidade": int(esp.total_quantidade or 0),
                    "peso_medio": float(esp.peso_medio or 0)
                } for esp in especies_stats
            ],
            "alertas": lotes_com_alerta[:5],  # Apenas os 5 primeiros
            "ultima_atualizacao": datetime.utcnow().isoformat()
        }
        
        return jsonify(dashboard_data), 200
        
    except Exception as e:
        return jsonify({"error": f"Erro ao gerar dashboard: {str(e)}"}), 500

@estoque_bp.route('/lotes/<int:lote_id>/alimentacao', methods=['GET'])
@jwt_required()
def listar_alimentacao_lote(lote_id):
    """Lista registros de alimentação de um lote"""
    try:
        user_id = get_jwt_identity()
        cliente = Cliente.query.filter_by(user_id=user_id).first()
        
        if not cliente:
            return jsonify({"error": "Cliente não encontrado"}), 404
        
        lote = LotePeixe.query.filter_by(
            id=lote_id,
            cliente_id=cliente.id
        ).first()
        
        if not lote:
            return jsonify({"error": "Lote não encontrado"}), 404
        
        # Filtro por período (opcional)
        data_inicio = request.args.get('data_inicio')
        data_fim = request.args.get('data_fim')
        
        query = RegistroAlimentacao.query.filter_by(lote_id=lote_id)
        
        if data_inicio:
            query = query.filter(RegistroAlimentacao.data_alimentacao >= datetime.fromisoformat(data_inicio))
        if data_fim:
            query = query.filter(RegistroAlimentacao.data_alimentacao <= datetime.fromisoformat(data_fim))
        
        registros = query.order_by(desc(RegistroAlimentacao.data_alimentacao)).all()
        
        # Calcular estatísticas
        total_racao = sum(float(reg.quantidade_racao) for reg in registros)
        custo_total = sum(float(reg.custo_racao or 0) for reg in registros)
        
        return jsonify({
            "lote": lote.to_dict(),
            "registros": [reg.to_dict() for reg in registros],
            "estatisticas": {
                "total_registros": len(registros),
                "total_racao_kg": total_racao,
                "custo_total": custo_total,
                "media_diaria": total_racao / max(len(registros), 1)
            }
        }), 200
        
    except Exception as e:
        return jsonify({"error": f"Erro ao listar alimentação: {str(e)}"}), 500

@estoque_bp.route('/lotes/<int:lote_id>/alimentacao', methods=['POST'])
@jwt_required()
def registrar_alimentacao(lote_id):
    """Registra alimentação do lote"""
    try:
        user_id = get_jwt_identity()
        cliente = Cliente.query.filter_by(user_id=user_id).first()
        
        if not cliente:
            return jsonify({"error": "Cliente não encontrado"}), 404
        
        lote = LotePeixe.query.filter_by(
            id=lote_id,
            cliente_id=cliente.id
        ).first()
        
        if not lote:
            return jsonify({"error": "Lote não encontrado"}), 404
        
        data = request.get_json()
        
        # Validar dados obrigatórios
        required_fields = ['quantidade_racao', 'tipo_racao']
        for field in required_fields:
            if not data.get(field):
                return jsonify({"error": f"Campo '{field}' é obrigatório"}), 400
        
        registro = RegistroAlimentacao(
            lote_id=lote_id,
            quantidade_racao=Decimal(str(data['quantidade_racao'])),
            tipo_racao=data['tipo_racao'],
            custo_racao=Decimal(str(data.get('custo_racao', 0))) if data.get('custo_racao') else None,
            observacoes=data.get('observacoes', ''),
            data_alimentacao=datetime.fromisoformat(data['data_alimentacao']) if data.get('data_alimentacao') else datetime.utcnow()
        )
        
        db.session.add(registro)
        db.session.commit()
        
        return jsonify({
            "message": "Alimentação registrada com sucesso",
            "registro": registro.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Erro ao registrar alimentação: {str(e)}"}), 500