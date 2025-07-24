"""
Rotas para Gestão de Qualidade da Água - Simão IA Rural
Sistema completo de monitoramento da qualidade da água na piscicultura
"""

from datetime import datetime, date, timedelta
from decimal import Decimal
from typing import List, Dict, Any
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import and_, or_, func, desc, asc
from sqlalchemy.orm import joinedload

from src.models.user import db, Cliente
from src.models.qualidade_agua import QualidadeAgua, ParametroIdeal, AlertaQualidade
from src.models.estoque_peixe import Viveiro, EspeciePeixe

# Blueprint para rotas de qualidade da água
qualidade_bp = Blueprint('qualidade_agua', __name__, url_prefix='/api/qualidade-agua')

@qualidade_bp.route('/parametros-ideais', methods=['GET'])
@jwt_required()
def listar_parametros_ideais():
    """Lista parâmetros ideais para todas as espécies do cliente"""
    try:
        user_id = get_jwt_identity()
        cliente = Cliente.query.filter_by(user_id=user_id).first()
        
        if not cliente:
            return jsonify({"error": "Cliente não encontrado"}), 404
        
        parametros = ParametroIdeal.query.filter_by(cliente_id=cliente.id).all()
        
        return jsonify({
            "parametros": [param.to_dict() for param in parametros],
            "total": len(parametros)
        }), 200
        
    except Exception as e:
        return jsonify({"error": f"Erro ao listar parâmetros: {str(e)}"}), 500

@qualidade_bp.route('/parametros-ideais', methods=['POST'])
@jwt_required()
def criar_parametro_ideal():
    """Cria parâmetro ideal para uma espécie"""
    try:
        user_id = get_jwt_identity()
        cliente = Cliente.query.filter_by(user_id=user_id).first()
        
        if not cliente:
            return jsonify({"error": "Cliente não encontrado"}), 404
        
        data = request.get_json()
        
        # Validar dados obrigatórios
        required_fields = ['especie_id']
        for field in required_fields:
            if not data.get(field):
                return jsonify({"error": f"Campo '{field}' é obrigatório"}), 400
        
        # Verificar se espécie existe
        especie = EspeciePeixe.query.filter_by(
            id=data['especie_id'],
            cliente_id=cliente.id
        ).first()
        
        if not especie:
            return jsonify({"error": "Espécie não encontrada"}), 404
        
        # Verificar se já existe parâmetro para esta espécie
        parametro_existente = ParametroIdeal.query.filter_by(
            cliente_id=cliente.id,
            especie_id=data['especie_id']
        ).first()
        
        if parametro_existente:
            return jsonify({"error": "Já existe parâmetro ideal para esta espécie"}), 400
        
        parametro = ParametroIdeal(
            cliente_id=cliente.id,
            especie_id=data['especie_id'],
            ph_min=Decimal(str(data.get('ph_min', 6.5))) if data.get('ph_min') else None,
            ph_max=Decimal(str(data.get('ph_max', 8.5))) if data.get('ph_max') else None,
            oxigenio_min=Decimal(str(data.get('oxigenio_min', 5.0))) if data.get('oxigenio_min') else None,
            temperatura_min=Decimal(str(data.get('temperatura_min', 24.0))) if data.get('temperatura_min') else None,
            temperatura_max=Decimal(str(data.get('temperatura_max', 30.0))) if data.get('temperatura_max') else None,
            amonia_max=Decimal(str(data.get('amonia_max', 0.5))) if data.get('amonia_max') else None,
            nitrito_max=Decimal(str(data.get('nitrito_max', 0.5))) if data.get('nitrito_max') else None,
            nitrato_max=Decimal(str(data.get('nitrato_max', 50.0))) if data.get('nitrato_max') else None,
            alcalinidade_min=Decimal(str(data.get('alcalinidade_min', 50.0))) if data.get('alcalinidade_min') else None,
            alcalinidade_max=Decimal(str(data.get('alcalinidade_max', 200.0))) if data.get('alcalinidade_max') else None,
            dureza_min=Decimal(str(data.get('dureza_min', 50.0))) if data.get('dureza_min') else None,
            dureza_max=Decimal(str(data.get('dureza_max', 300.0))) if data.get('dureza_max') else None,
            observacoes=data.get('observacoes')
        )
        
        db.session.add(parametro)
        db.session.commit()
        
        return jsonify({
            "message": "Parâmetro ideal criado com sucesso",
            "parametro": parametro.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Erro ao criar parâmetro: {str(e)}"}), 500

@qualidade_bp.route('/medicoes', methods=['GET'])
@jwt_required()
def listar_medicoes():
    """Lista medições de qualidade da água"""
    try:
        user_id = get_jwt_identity()
        cliente = Cliente.query.filter_by(user_id=user_id).first()
        
        if not cliente:
            return jsonify({"error": "Cliente não encontrado"}), 404
        
        # Filtros opcionais
        viveiro_id = request.args.get('viveiro_id', type=int)
        data_inicio = request.args.get('data_inicio')
        data_fim = request.args.get('data_fim')
        
        query = QualidadeAgua.query.filter_by(cliente_id=cliente.id)
        
        if viveiro_id:
            query = query.filter(QualidadeAgua.viveiro_id == viveiro_id)
        
        if data_inicio:
            query = query.filter(QualidadeAgua.data_medicao >= datetime.fromisoformat(data_inicio))
        
        if data_fim:
            query = query.filter(QualidadeAgua.data_medicao <= datetime.fromisoformat(data_fim))
        
        # Incluir relacionamentos
        medicoes = query.options(
            joinedload(QualidadeAgua.viveiro)
        ).order_by(desc(QualidadeAgua.data_medicao)).limit(100).all()
        
        medicoes_data = []
        for medicao in medicoes:
            medicao_dict = medicao.to_dict()
            
            # Adicionar análise de qualidade
            analise = medicao.analisar_qualidade()
            medicao_dict.update({
                "status_qualidade": analise['status'],
                "parametros_fora": analise['parametros_fora'],
                "recomendacoes": analise['recomendacoes']
            })
            
            medicoes_data.append(medicao_dict)
        
        return jsonify({
            "medicoes": medicoes_data,
            "total": len(medicoes)
        }), 200
        
    except Exception as e:
        return jsonify({"error": f"Erro ao listar medições: {str(e)}"}), 500

@qualidade_bp.route('/medicoes', methods=['POST'])
@jwt_required()
def criar_medicao():
    """Registra nova medição de qualidade da água"""
    try:
        user_id = get_jwt_identity()
        cliente = Cliente.query.filter_by(user_id=user_id).first()
        
        if not cliente:
            return jsonify({"error": "Cliente não encontrado"}), 404
        
        data = request.get_json()
        
        # Validar dados obrigatórios
        required_fields = ['viveiro_id']
        for field in required_fields:
            if not data.get(field):
                return jsonify({"error": f"Campo '{field}' é obrigatório"}), 400
        
        # Verificar se viveiro existe
        viveiro = Viveiro.query.filter_by(
            id=data['viveiro_id'],
            cliente_id=cliente.id
        ).first()
        
        if not viveiro:
            return jsonify({"error": "Viveiro não encontrado"}), 404
        
        medicao = QualidadeAgua(
            cliente_id=cliente.id,
            viveiro_id=data['viveiro_id'],
            ph=Decimal(str(data.get('ph'))) if data.get('ph') else None,
            oxigenio_dissolvido=Decimal(str(data.get('oxigenio_dissolvido'))) if data.get('oxigenio_dissolvido') else None,
            temperatura=Decimal(str(data.get('temperatura'))) if data.get('temperatura') else None,
            amonia=Decimal(str(data.get('amonia'))) if data.get('amonia') else None,
            nitrito=Decimal(str(data.get('nitrito'))) if data.get('nitrito') else None,
            nitrato=Decimal(str(data.get('nitrato'))) if data.get('nitrato') else None,
            alcalinidade=Decimal(str(data.get('alcalinidade'))) if data.get('alcalinidade') else None,
            dureza=Decimal(str(data.get('dureza'))) if data.get('dureza') else None,
            transparencia=Decimal(str(data.get('transparencia'))) if data.get('transparencia') else None,
            observacoes=data.get('observacoes', ''),
            data_medicao=datetime.fromisoformat(data['data_medicao']) if data.get('data_medicao') else datetime.utcnow()
        )
        
        db.session.add(medicao)
        db.session.flush()  # Para obter o ID
        
        # Analisar qualidade e gerar alertas se necessário
        analise = medicao.analisar_qualidade()
        
        if analise['status'] in ['ruim', 'critico']:
            # Criar alerta
            alerta = AlertaQualidade(
                cliente_id=cliente.id,
                medicao_id=medicao.id,
                parametro=', '.join(analise['parametros_fora']),
                valor_medido=0,  # TODO: usar valor específico
                valor_ideal_min=0,
                valor_ideal_max=0,
                severidade='alta' if analise['status'] == 'critico' else 'media',
                mensagem=f"Parâmetros fora do ideal: {', '.join(analise['parametros_fora'])}",
                recomendacao='; '.join(analise['recomendacoes'])
            )
            
            db.session.add(alerta)
        
        db.session.commit()
        
        medicao_dict = medicao.to_dict()
        medicao_dict.update({
            "status_qualidade": analise['status'],
            "parametros_fora": analise['parametros_fora'],
            "recomendacoes": analise['recomendacoes']
        })
        
        return jsonify({
            "message": "Medição registrada com sucesso",
            "medicao": medicao_dict,
            "alertas_gerados": analise['status'] in ['ruim', 'critico']
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Erro ao registrar medição: {str(e)}"}), 500

@qualidade_bp.route('/alertas', methods=['GET'])
@jwt_required()
def listar_alertas():
    """Lista alertas de qualidade da água"""
    try:
        user_id = get_jwt_identity()
        cliente = Cliente.query.filter_by(user_id=user_id).first()
        
        if not cliente:
            return jsonify({"error": "Cliente não encontrado"}), 404
        
        # Filtros opcionais
        status = request.args.get('status', 'ativo')
        severidade = request.args.get('severidade')
        
        query = AlertaQualidade.query.filter_by(cliente_id=cliente.id)
        
        if status:
            query = query.filter(AlertaQualidade.status == status)
        
        if severidade:
            query = query.filter(AlertaQualidade.severidade == severidade)
        
        # Incluir relacionamentos
        alertas = query.options(
            joinedload(AlertaQualidade.medicao).joinedload(QualidadeAgua.viveiro)
        ).order_by(desc(AlertaQualidade.data_criacao)).all()
        
        return jsonify({
            "alertas": [alerta.to_dict() for alerta in alertas],
            "total": len(alertas)
        }), 200
        
    except Exception as e:
        return jsonify({"error": f"Erro ao listar alertas: {str(e)}"}), 500

@qualidade_bp.route('/alertas/<int:alerta_id>/resolver', methods=['PUT'])
@jwt_required()
def resolver_alerta(alerta_id):
    """Marca alerta como resolvido"""
    try:
        user_id = get_jwt_identity()
        cliente = Cliente.query.filter_by(user_id=user_id).first()
        
        if not cliente:
            return jsonify({"error": "Cliente não encontrado"}), 404
        
        alerta = AlertaQualidade.query.filter_by(
            id=alerta_id,
            cliente_id=cliente.id
        ).first()
        
        if not alerta:
            return jsonify({"error": "Alerta não encontrado"}), 404
        
        data = request.get_json()
        
        alerta.status = 'resolvido'
        alerta.data_resolucao = datetime.utcnow()
        alerta.observacoes_resolucao = data.get('observacoes', '')
        
        db.session.commit()
        
        return jsonify({
            "message": "Alerta resolvido com sucesso",
            "alerta": alerta.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Erro ao resolver alerta: {str(e)}"}), 500

@qualidade_bp.route('/dashboard', methods=['GET'])
@jwt_required()
def dashboard_qualidade():
    """Dashboard com resumo da qualidade da água"""
    try:
        user_id = get_jwt_identity()
        cliente = Cliente.query.filter_by(user_id=user_id).first()
        
        if not cliente:
            return jsonify({"error": "Cliente não encontrado"}), 404
        
        # Estatísticas gerais
        total_medicoes = QualidadeAgua.query.filter_by(cliente_id=cliente.id).count()
        total_viveiros = Viveiro.query.filter_by(cliente_id=cliente.id).count()
        
        # Alertas ativos
        alertas_ativos = AlertaQualidade.query.filter_by(
            cliente_id=cliente.id,
            status='ativo'
        ).count()
        
        alertas_criticos = AlertaQualidade.query.filter_by(
            cliente_id=cliente.id,
            status='ativo',
            severidade='alta'
        ).count()
        
        # Últimas medições por viveiro
        viveiros_com_medicoes = []
        for viveiro in Viveiro.query.filter_by(cliente_id=cliente.id).all():
            ultima_medicao = QualidadeAgua.query.filter_by(
                viveiro_id=viveiro.id
            ).order_by(desc(QualidadeAgua.data_medicao)).first()
            
            if ultima_medicao:
                analise = ultima_medicao.analisar_qualidade()
                viveiros_com_medicoes.append({
                    "viveiro": viveiro.to_dict(),
                    "ultima_medicao": ultima_medicao.to_dict(),
                    "status": analise['status'],
                    "dias_desde_medicao": (datetime.utcnow() - ultima_medicao.data_medicao).days
                })
            else:
                viveiros_com_medicoes.append({
                    "viveiro": viveiro.to_dict(),
                    "ultima_medicao": None,
                    "status": "sem_dados",
                    "dias_desde_medicao": None
                })
        
        # Tendências (últimos 30 dias)
        data_limite = datetime.utcnow() - timedelta(days=30)
        medicoes_periodo = QualidadeAgua.query.filter(
            QualidadeAgua.cliente_id == cliente.id,
            QualidadeAgua.data_medicao >= data_limite
        ).all()
        
        # Calcular médias dos parâmetros
        parametros_medios = {
            'ph': 0,
            'oxigenio': 0,
            'temperatura': 0,
            'amonia': 0
        }
        
        if medicoes_periodo:
            parametros_medios = {
                'ph': sum(float(m.ph or 0) for m in medicoes_periodo) / len(medicoes_periodo),
                'oxigenio': sum(float(m.oxigenio_dissolvido or 0) for m in medicoes_periodo) / len(medicoes_periodo),
                'temperatura': sum(float(m.temperatura or 0) for m in medicoes_periodo) / len(medicoes_periodo),
                'amonia': sum(float(m.amonia or 0) for m in medicoes_periodo) / len(medicoes_periodo)
            }
        
        # Status geral da qualidade
        status_geral = "bom"
        if alertas_criticos > 0:
            status_geral = "critico"
        elif alertas_ativos > 0:
            status_geral = "atencao"
        
        dashboard_data = {
            "resumo": {
                "total_medicoes": total_medicoes,
                "total_viveiros": total_viveiros,
                "alertas_ativos": alertas_ativos,
                "alertas_criticos": alertas_criticos,
                "status_geral": status_geral,
                "medicoes_mes": len(medicoes_periodo)
            },
            "viveiros": viveiros_com_medicoes,
            "parametros_medios": parametros_medios,
            "tendencias": {
                "periodo_dias": 30,
                "medicoes_no_periodo": len(medicoes_periodo)
            },
            "ultima_atualizacao": datetime.utcnow().isoformat()
        }
        
        return jsonify(dashboard_data), 200
        
    except Exception as e:
        return jsonify({"error": f"Erro ao gerar dashboard: {str(e)}"}), 500

@qualidade_bp.route('/relatorio', methods=['GET'])
@jwt_required()
def relatorio_qualidade():
    """Gera relatório detalhado de qualidade da água"""
    try:
        user_id = get_jwt_identity()
        cliente = Cliente.query.filter_by(user_id=user_id).first()
        
        if not cliente:
            return jsonify({"error": "Cliente não encontrado"}), 404
        
        # Parâmetros do relatório
        data_inicio = request.args.get('data_inicio')
        data_fim = request.args.get('data_fim')
        viveiro_id = request.args.get('viveiro_id', type=int)
        
        if not data_inicio or not data_fim:
            return jsonify({"error": "Período (data_inicio e data_fim) é obrigatório"}), 400
        
        # Construir query
        query = QualidadeAgua.query.filter(
            QualidadeAgua.cliente_id == cliente.id,
            QualidadeAgua.data_medicao >= datetime.fromisoformat(data_inicio),
            QualidadeAgua.data_medicao <= datetime.fromisoformat(data_fim)
        )
        
        if viveiro_id:
            query = query.filter(QualidadeAgua.viveiro_id == viveiro_id)
        
        medicoes = query.options(
            joinedload(QualidadeAgua.viveiro)
        ).order_by(QualidadeAgua.data_medicao).all()
        
        if not medicoes:
            return jsonify({"error": "Nenhuma medição encontrada no período"}), 404
        
        # Análise estatística
        parametros_stats = {}
        parametros = ['ph', 'oxigenio_dissolvido', 'temperatura', 'amonia', 'nitrito', 'nitrato']
        
        for param in parametros:
            valores = [getattr(m, param) for m in medicoes if getattr(m, param) is not None]
            
            if valores:
                valores_float = [float(v) for v in valores]
                parametros_stats[param] = {
                    'minimo': min(valores_float),
                    'maximo': max(valores_float),
                    'media': sum(valores_float) / len(valores_float),
                    'total_medicoes': len(valores_float)
                }
            else:
                parametros_stats[param] = {
                    'minimo': None,
                    'maximo': None,
                    'media': None,
                    'total_medicoes': 0
                }
        
        # Contabilizar status
        status_count = {"bom": 0, "atencao": 0, "ruim": 0, "critico": 0}
        for medicao in medicoes:
            analise = medicao.analisar_qualidade()
            status_count[analise['status']] += 1
        
        # Alertas no período
        alertas = AlertaQualidade.query.join(QualidadeAgua).filter(
            AlertaQualidade.cliente_id == cliente.id,
            QualidadeAgua.data_medicao >= datetime.fromisoformat(data_inicio),
            QualidadeAgua.data_medicao <= datetime.fromisoformat(data_fim)
        ).all()
        
        relatorio = {
            "periodo": {
                "inicio": data_inicio,
                "fim": data_fim,
                "total_dias": (datetime.fromisoformat(data_fim) - datetime.fromisoformat(data_inicio)).days + 1
            },
            "resumo": {
                "total_medicoes": len(medicoes),
                "viveiros_monitorados": len(set(m.viveiro_id for m in medicoes)),
                "total_alertas": len(alertas)
            },
            "distribuicao_status": status_count,
            "parametros_estatisticas": parametros_stats,
            "medicoes": [
                {
                    **medicao.to_dict(),
                    **medicao.analisar_qualidade()
                } for medicao in medicoes
            ],
            "alertas": [alerta.to_dict() for alerta in alertas],
            "gerado_em": datetime.utcnow().isoformat()
        }
        
        return jsonify(relatorio), 200
        
    except Exception as e:
        return jsonify({"error": f"Erro ao gerar relatório: {str(e)}"}), 500